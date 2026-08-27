/**
 * guest-drive-transfer-worker — Cloudflare Queue consumer.
 * R2에 업로드된 하객 파일을 Google Drive로 resumable 이전한다.
 *
 * 설계(확정):
 *  - Queue 메시지 = { fileId }만. invitationId/r2Key/folderId 등은 D1에서 재조회(조작 표면 최소화).
 *  - at-least-once: DB status + resumable session 기준으로 멱등 처리(중복 Drive 파일 방지).
 *  - 대용량: 8MiB 청크 × invocation당 8청크(~64MiB) 전송 → offset 저장 → 동일 fileId 재-enqueue → completed까지 반복.
 *    (한 invocation이 무한정 살아있지 않게. Free 외부 fetch 50/invocation 한도 내.)
 *  - resumable session URI는 민감 → 로그/에러에 전체 URI 출력 금지(maskUri).
 *  - Next/OpenNext 의존 없음: env.DB / env.R2 / env.DRIVE_QUEUE 직접 사용. 순수 core만 공유.
 */

import type {
  D1Database,
  R2Bucket,
  Queue,
  MessageBatch,
  Message,
} from '@cloudflare/workers-types'

import { decryptSecretWithKey, encryptSecretWithKey } from '../../../src/lib/guest-drive-core/crypto'
import { refreshAccessTokenWith } from '../../../src/lib/guest-drive-core/oauth'
import {
  ensureGuestFolder,
  createGuestSubfolder,
  startResumableSession,
  queryResumableOffset,
  uploadResumableChunk,
  RESUMABLE_CHUNK_BYTES,
  maskUri,
} from '../../../src/lib/guest-drive-core/drive'

export interface Env {
  DB: D1Database
  R2: R2Bucket
  DRIVE_QUEUE: Queue
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  TOKEN_ENCRYPTION_KEY: string
}

interface QueueMessage {
  fileId: string
}

/** 한 invocation에서 보낼 최대 청크 수 (8청크 × 8MiB ≈ 64MiB). */
const CHUNKS_PER_INVOCATION = 8

// ── DB row 타입 ──────────────────────────────────────────────────────
interface FileRow {
  id: string
  session_id: string
  invitation_id: string
  r2_key: string
  original_name: string | null
  mime_type: string | null
  size: number | null
  status: string
  google_file_id: string | null
  attempt_count: number
  google_upload_uri: string | null
  google_upload_offset: number | null
  google_upload_expires_at: string | null
}
interface SessionRow {
  id: string
  invitation_id: string
  guest_name: string | null
  folder_id: string | null
}
interface StorageRow {
  invitation_id: string
  connection_id: string
  root_folder_id: string | null
  guest_folder_id: string | null
}
interface ConnRow {
  id: string
  access_token_enc: string | null
  access_token_iv: string | null
  refresh_token_enc: string | null
  refresh_token_iv: string | null
  expires_at: string | null
}
interface InvitationRow {
  groom_name: string | null
  bride_name: string | null
}

/** 영구 실패(재시도 불가) 표시용 에러 */
class PermanentError extends Error {}

const nowIso = () => new Date().toISOString()

export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages as Message<QueueMessage>[]) {
      const fileId = msg.body?.fileId
      if (!fileId) {
        console.error('[drive-transfer] fileId 없는 메시지 — ack')
        msg.ack()
        continue
      }
      try {
        await handleFile(env, fileId)
        msg.ack()
      } catch (e) {
        if (e instanceof PermanentError) {
          console.error(`[drive-transfer] ${fileId} 영구 실패:`, e.message)
          msg.ack() // 재시도 안 함 (DB는 failed로 기록됨)
        } else {
          console.error(`[drive-transfer] ${fileId} 일시 오류 — retry:`, e instanceof Error ? e.message : e)
          msg.retry()
        }
      }
    }
  },
}

async function handleFile(env: Env, fileId: string): Promise<void> {
  const file = await env.DB.prepare('SELECT * FROM guest_upload_files WHERE id = ? LIMIT 1').bind(fileId).first<FileRow>()
  if (!file) {
    console.error(`[drive-transfer] ${fileId} 파일 레코드 없음 — ack`)
    return
  }
  // 멱등: 이미 완료/실패면 재처리하지 않음
  if (file.status === 'completed') return
  if (file.status === 'failed') return
  if (file.size == null || file.size <= 0) {
    await markFailed(env, fileId, 'size 정보 없음')
    return
  }

  try {
    await transfer(env, file)
  } catch (e) {
    if (e instanceof PermanentError) {
      await markFailed(env, fileId, e.message)
      return // ack
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (classify(msg) === 'permanent') {
      await markFailed(env, fileId, msg)
      return // ack
    }
    throw e // retryable → 상위에서 msg.retry()
  }
}

async function transfer(env: Env, file: FileRow): Promise<void> {
  const size = file.size as number

  // 세션/저장위치/연결 조회
  const session = await env.DB.prepare('SELECT * FROM guest_upload_sessions WHERE id = ? LIMIT 1')
    .bind(file.session_id).first<SessionRow>()
  if (!session) throw new PermanentError('업로드 세션 없음')

  const storage = await env.DB.prepare('SELECT * FROM project_cloud_storage WHERE invitation_id = ? LIMIT 1')
    .bind(file.invitation_id).first<StorageRow>()
  if (!storage) throw new PermanentError('project_cloud_storage 매핑 없음 - Drive 미연결')

  const ref = { conn: await env.DB.prepare('SELECT * FROM cloud_connections WHERE id = ? LIMIT 1')
    .bind(storage.connection_id).first<ConnRow>() }
  if (!ref.conn) throw new PermanentError('cloud_connection 없음 - 재연결 필요')

  const invitation = await env.DB.prepare('SELECT groom_name, bride_name FROM invitations WHERE id = ? LIMIT 1')
    .bind(file.invitation_id).first<InvitationRow>()

  // transferring 진입 + attempt_count++
  await env.DB.prepare(
    "UPDATE guest_upload_files SET status = 'transferring', attempt_count = attempt_count + 1, updated_at = ? WHERE id = ?",
  ).bind(nowIso(), file.id).run()

  // resumable 세션 확보 (없으면 폴더 준비 후 생성 / 있으면 offset 조회 후 resume)
  let sessionUri = file.google_upload_uri
  let offset = file.google_upload_offset ?? 0

  if (sessionUri) {
    const q = await queryResumableOffset(sessionUri, size)
    if (q.completed) {
      await markCompleted(env, file.id, q.fileId ?? null)
      return
    }
    if (q.sessionGone) {
      console.warn(`[drive-transfer] ${file.id} 세션 만료(${q.status}) → 새 세션 (uri=${maskUri(sessionUri)})`)
      sessionUri = null
      offset = 0
    } else {
      offset = q.offset
    }
  }

  if (!sessionUri) {
    const folderId = await getOrCreateGuestFolder(env, ref, session, storage, invitation)
    const name = file.original_name || `${file.id}`
    const mimeType = file.mime_type || 'application/octet-stream'
    sessionUri = await authOp(env, ref, (token) =>
      startResumableSession(token, { name, mimeType, parents: [folderId] }),
    )
    offset = 0
    await env.DB.prepare(
      'UPDATE guest_upload_files SET google_upload_uri = ?, google_upload_offset = 0, google_upload_expires_at = ?, updated_at = ? WHERE id = ?',
    ).bind(sessionUri, new Date(Date.now() + 6 * 24 * 3600_000).toISOString(), nowIso(), file.id).run()
  }

  // 청크 전송 루프 (invocation당 최대 CHUNKS_PER_INVOCATION)
  for (let i = 0; i < CHUNKS_PER_INVOCATION && offset < size; i++) {
    const length = Math.min(RESUMABLE_CHUNK_BYTES, size - offset)
    const obj = await env.R2.get(file.r2_key, { range: { offset, length } })
    if (!obj) throw new PermanentError(`R2 object 없음: ${file.r2_key}`)
    const chunk = await obj.arrayBuffer()

    const r = await uploadResumableChunk(sessionUri, chunk, offset, size)
    if (r.sessionGone) {
      // 세션 만료 → uri 초기화 후 재시도(retryable). 다음 invocation에서 새 세션.
      await env.DB.prepare('UPDATE guest_upload_files SET google_upload_uri = NULL, updated_at = ? WHERE id = ?')
        .bind(nowIso(), file.id).run()
      throw new Error('resumable 세션 만료 — 새 세션 필요')
    }
    offset = r.offset
    await env.DB.prepare('UPDATE guest_upload_files SET google_upload_offset = ?, updated_at = ? WHERE id = ?')
      .bind(offset, nowIso(), file.id).run()

    if (r.completed) {
      await markCompleted(env, file.id, r.fileId ?? null)
      return
    }
  }

  // 아직 남음 → 동일 fileId 재-enqueue (이번 invocation 종료)
  if (offset < size) {
    await env.DRIVE_QUEUE.send({ fileId: file.id })
  }
}

/**
 * 하객 폴더(세션당 1개) get-or-create. session.folder_id에 claim.
 * 동시성: 다른 invocation이 먼저 만들었으면 그 값을 사용(우리 폴더는 빈 채로 남을 수 있으나 드묾/무해).
 */
async function getOrCreateGuestFolder(
  env: Env,
  ref: { conn: ConnRow | null },
  session: SessionRow,
  storage: StorageRow,
  invitation: InvitationRow | null,
): Promise<string> {
  if (session.folder_id) return session.folder_id

  // 하객 사진 상위 폴더 확보(없으면 재생성)
  const roots = await authOp(env, ref, (token) =>
    ensureGuestFolder(
      token,
      { root_folder_id: storage.root_folder_id, guest_folder_id: storage.guest_folder_id },
      invitation?.groom_name ?? null,
      invitation?.bride_name ?? null,
    ),
  )
  // storage 폴더가 재생성됐다면 반영
  if (roots.guestFolderId !== storage.guest_folder_id || roots.rootFolderId !== storage.root_folder_id) {
    await env.DB.prepare('UPDATE project_cloud_storage SET root_folder_id = ?, guest_folder_id = ?, updated_at = ? WHERE invitation_id = ?')
      .bind(roots.rootFolderId, roots.guestFolderId, nowIso(), storage.invitation_id).run()
  }

  const shortId = session.id.replace(/^gus_/, '').slice(0, 8)
  const folderName = `${(session.guest_name || '하객').slice(0, 60)}_${shortId}`
  const subId = await authOp(env, ref, (token) => createGuestSubfolder(token, roots.guestFolderId, folderName))

  // claim: 아직 null일 때만 저장
  const res = await env.DB.prepare('UPDATE guest_upload_sessions SET folder_id = ?, updated_at = ? WHERE id = ? AND folder_id IS NULL')
    .bind(subId, nowIso(), session.id).run()
  const changes = (res as { meta?: { changes?: number } }).meta?.changes ?? 0
  if (changes > 0) return subId

  // 경쟁에서 짐 → 이미 저장된 값 사용
  const fresh = await env.DB.prepare('SELECT folder_id FROM guest_upload_sessions WHERE id = ?')
    .bind(session.id).first<{ folder_id: string | null }>()
  return fresh?.folder_id || subId
}

// ── 토큰 ─────────────────────────────────────────────────────────────
async function getAccessToken(env: Env, conn: ConnRow): Promise<{ token: string; conn: ConnRow }> {
  const expMs = conn.expires_at ? Date.parse(conn.expires_at) : 0
  const valid = conn.access_token_enc && conn.access_token_iv && expMs && expMs - Date.now() > 5 * 60_000
  if (valid) {
    const token = await decryptSecretWithKey(conn.access_token_enc!, conn.access_token_iv!, env.TOKEN_ENCRYPTION_KEY)
    return { token, conn }
  }
  return refreshToken(env, conn)
}

async function refreshToken(env: Env, conn: ConnRow): Promise<{ token: string; conn: ConnRow }> {
  if (!conn.refresh_token_enc || !conn.refresh_token_iv) {
    if (conn.access_token_enc && conn.access_token_iv) {
      const token = await decryptSecretWithKey(conn.access_token_enc, conn.access_token_iv, env.TOKEN_ENCRYPTION_KEY)
      return { token, conn }
    }
    throw new PermanentError('access_token 만료 + refresh_token 없음 - Drive 재연결 필요')
  }
  const refresh = await decryptSecretWithKey(conn.refresh_token_enc, conn.refresh_token_iv, env.TOKEN_ENCRYPTION_KEY)
  const tok = await refreshAccessTokenWith(refresh, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET)
  const enc = await encryptSecretWithKey(tok.access_token, env.TOKEN_ENCRYPTION_KEY)
  const expiresAt = new Date(Date.now() + (tok.expires_in - 30) * 1000).toISOString()
  await env.DB.prepare('UPDATE cloud_connections SET access_token_enc = ?, access_token_iv = ?, expires_at = ?, updated_at = ? WHERE id = ?')
    .bind(enc.enc, enc.iv, expiresAt, nowIso(), conn.id).run()
  return { token: tok.access_token, conn: { ...conn, access_token_enc: enc.enc, access_token_iv: enc.iv, expires_at: expiresAt } }
}

/** Authorization이 필요한 작업 실행. 401이면 강제 refresh 후 1회 재시도(§7). */
async function authOp<T>(env: Env, ref: { conn: ConnRow | null }, fn: (token: string) => Promise<T>): Promise<T> {
  if (!ref.conn) throw new PermanentError('cloud_connection 없음')
  const first = await getAccessToken(env, ref.conn)
  ref.conn = first.conn
  try {
    return await fn(first.token)
  } catch (e) {
    if (/\b401\b/.test(e instanceof Error ? e.message : '')) {
      const r = await refreshToken(env, ref.conn)
      ref.conn = r.conn
      return await fn(r.token)
    }
    throw e
  }
}

// ── 상태 헬퍼 ────────────────────────────────────────────────────────
async function markCompleted(env: Env, fileId: string, googleFileId: string | null): Promise<void> {
  const ts = nowIso()
  await env.DB.prepare(
    "UPDATE guest_upload_files SET status = 'completed', google_file_id = ?, transferred_at = ?, updated_at = ? WHERE id = ?",
  ).bind(googleFileId, ts, ts, fileId).run()
}

async function markFailed(env: Env, fileId: string, message: string): Promise<void> {
  await env.DB.prepare("UPDATE guest_upload_files SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?")
    .bind(message.slice(0, 300), nowIso(), fileId).run()
}

/** 에러 메시지의 HTTP status로 retry/permanent 분류. 429/5xx/네트워크 = retry, 그 외 4xx = permanent. */
function classify(msg: string): 'retry' | 'permanent' {
  const m = /\b(\d{3})\b/.exec(msg)
  const code = m ? parseInt(m[1], 10) : 0
  if (code === 429 || code === 408) return 'retry'
  if (code >= 500) return 'retry'
  if (code >= 400) return 'permanent'
  return 'retry'
}
