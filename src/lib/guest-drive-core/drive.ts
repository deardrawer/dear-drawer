/**
 * env-비의존 Google Drive REST + resumable 업로드 프리미티브.
 * accessToken을 파라미터로 받는다. Next 앱(폴더 준비)과 Worker(청크 전송)가 공유.
 *
 * 보안: resumable session URI(?upload_id=...)는 민감. 로그/에러에 전체 URI 노출 금지 → maskUri 사용.
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

/** resumable session URI에서 query(토큰성 값)를 제거해 로그/에러에 안전한 형태로 만든다. */
export function maskUri(uri: string): string {
  try {
    const u = new URL(uri)
    return `${u.origin}${u.pathname}?<redacted>`
  } catch {
    return '<invalid-uri>'
  }
}

// ── 폴더/계정 (Next 앱 연결 플로우에서 사용) ──────────────────────────
export async function getAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(`${DRIVE_API}/about?fields=user`, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) return null
  const data = (await res.json()) as { user?: { emailAddress?: string } }
  return data.user?.emailAddress ?? null
}

/** 표시용 파일 메타(썸네일/보기 링크). 바이트는 받지 않음 — thumbnailLink는 Google CDN 직접 로드용. */
export interface DriveFileView {
  id: string
  mimeType: string | null
  /** Google 서명 임시 썸네일 URL(브라우저가 직접 로드). 만료성. */
  thumbnailLink: string | null
  /** Drive에서 열기(원본 접근). 로그인/권한 필요할 수 있음 — 주로 영상용. */
  webViewLink: string | null
  isVideo: boolean
}

/**
 * 표시용 파일 메타 1건 조회. 바이트를 프록시하지 않고 thumbnailLink(서명 임시 URL)만 받아온다.
 * 실패(삭제/권한/미존재) 시 null. supportsAllDrives로 공유드라이브도 대응.
 */
export async function getFileView(accessToken: string, fileId: string): Promise<DriveFileView | null> {
  const res = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=id,mimeType,thumbnailLink,webViewLink,videoMediaMetadata&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) return null
  const d = (await res.json()) as {
    id?: string
    mimeType?: string
    thumbnailLink?: string
    webViewLink?: string
    videoMediaMetadata?: unknown
  }
  const mime = d.mimeType ?? null
  return {
    id: d.id ?? fileId,
    mimeType: mime,
    thumbnailLink: d.thumbnailLink ?? null,
    webViewLink: d.webViewLink ?? null,
    isVideo: !!d.videoMediaMetadata || (!!mime && mime.toLowerCase().startsWith('video')),
  }
}

export async function folderExists(accessToken: string, folderId: string): Promise<boolean> {
  const res = await fetch(`${DRIVE_API}/files/${folderId}?fields=id,trashed`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return false
  const d = (await res.json()) as { trashed?: boolean }
  return d.trashed !== true
}

export async function createFolder(accessToken: string, name: string, parentId?: string): Promise<string> {
  const body: Record<string, unknown> = { name, mimeType: 'application/vnd.google-apps.folder' }
  if (parentId) body.parents = [parentId]
  const res = await fetch(`${DRIVE_API}/files?fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`폴더 생성 실패: ${res.status} ${await res.text()}`)
  const d = (await res.json()) as { id: string }
  return d.id
}

/**
 * 최초 연결 시 폴더 트리: Dear Drawer / {신랑} & {신부} / 하객 사진
 * @returns rootFolderId = 커플 폴더, guestFolderId = 하객 사진 폴더
 */
export async function ensureRootFolders(
  accessToken: string,
  groomName: string | null,
  brideName: string | null,
): Promise<{ rootFolderId: string; guestFolderId: string }> {
  const dearDrawer = await createFolder(accessToken, 'Dear Drawer')
  const couple = await createFolder(accessToken, `${groomName || '신랑'} & ${brideName || '신부'}`, dearDrawer)
  const guest = await createFolder(accessToken, '하객 사진', couple)
  return { rootFolderId: couple, guestFolderId: guest }
}

/** 저장된 guest_folder_id가 살아있으면 그대로, 삭제됐으면 재생성 (folder_id 기준 접근) */
export async function ensureGuestFolder(
  accessToken: string,
  storage: { root_folder_id: string | null; guest_folder_id: string | null },
  groomName: string | null,
  brideName: string | null,
): Promise<{ rootFolderId: string; guestFolderId: string }> {
  if (storage.guest_folder_id && (await folderExists(accessToken, storage.guest_folder_id))) {
    return { rootFolderId: storage.root_folder_id || storage.guest_folder_id, guestFolderId: storage.guest_folder_id }
  }
  if (storage.root_folder_id && (await folderExists(accessToken, storage.root_folder_id))) {
    const guest = await createFolder(accessToken, '하객 사진', storage.root_folder_id)
    return { rootFolderId: storage.root_folder_id, guestFolderId: guest }
  }
  return ensureRootFolders(accessToken, groomName, brideName)
}

/** 하객별 하위 폴더 생성 → folderId 반환 */
export async function createGuestSubfolder(accessToken: string, guestFolderId: string, folderName: string): Promise<string> {
  return createFolder(accessToken, folderName, guestFolderId)
}

// ── resumable 업로드 프리미티브 ──────────────────────────────────────

/** resumable 세션 개시 → session URI(Location) 반환. */
export async function startResumableSession(
  accessToken: string,
  meta: { name: string; mimeType: string; parents: string[] },
): Promise<string> {
  const res = await fetch(`${DRIVE_UPLOAD}/files?uploadType=resumable&fields=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': meta.mimeType,
    },
    body: JSON.stringify({ name: meta.name, parents: meta.parents }),
  })
  if (!res.ok) throw new Error(`resumable 세션 개시 실패: ${res.status}`)
  const loc = res.headers.get('location')
  if (!loc) throw new Error('resumable session URI(Location 헤더)가 응답에 없습니다.')
  return loc
}

export interface ResumableProgress {
  /** 업로드 완료 여부 */
  completed: boolean
  /** 서버가 확정한 다음 시작 오프셋(=이미 받은 바이트 수) */
  offset: number
  /** 완료 시 Drive 파일 ID */
  fileId?: string
  /** 세션이 만료/무효(404/410)라 새 세션이 필요한 경우 */
  sessionGone?: boolean
  /** HTTP status (분류용) */
  status: number
}

/** Range: bytes=0-N → 다음 오프셋(N+1). 없으면 0. */
function parseRangeNextOffset(range: string | null): number {
  if (!range) return 0
  const m = /bytes=0-(\d+)/.exec(range)
  return m ? parseInt(m[1], 10) + 1 : 0
}

/**
 * 현재 확정 오프셋 조회 (resume 시). PUT + Content-Range: bytes *​/TOTAL, 빈 본문.
 * 308 → Range로 확정 오프셋. 200/201 → 이미 완료(fileId). 404/410 → 세션 만료.
 */
export async function queryResumableOffset(sessionUri: string, totalSize: number): Promise<ResumableProgress> {
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: { 'Content-Range': `bytes */${totalSize}`, 'Content-Length': '0' },
  })
  if (res.status === 200 || res.status === 201) {
    const d = (await res.json().catch(() => ({}))) as { id?: string }
    return { completed: true, offset: totalSize, fileId: d.id, status: res.status }
  }
  if (res.status === 308) {
    return { completed: false, offset: parseRangeNextOffset(res.headers.get('range')), status: res.status }
  }
  if (res.status === 404 || res.status === 410) {
    return { completed: false, offset: 0, sessionGone: true, status: res.status }
  }
  throw new Error(`resumable offset 조회 실패: ${res.status}`)
}

/**
 * 한 청크 업로드. chunk는 [offset, offset+chunk.byteLength) 구간.
 * 308 → 다음 오프셋 반환. 200/201 → 완료(fileId).
 */
export async function uploadResumableChunk(
  sessionUri: string,
  chunk: ArrayBuffer,
  offset: number,
  totalSize: number,
): Promise<ResumableProgress> {
  const len = chunk.byteLength
  const last = offset + len - 1
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      'Content-Length': String(len),
      'Content-Range': `bytes ${offset}-${last}/${totalSize}`,
    },
    body: chunk,
  })
  if (res.status === 200 || res.status === 201) {
    const d = (await res.json().catch(() => ({}))) as { id?: string }
    return { completed: true, offset: totalSize, fileId: d.id, status: res.status }
  }
  if (res.status === 308) {
    const next = parseRangeNextOffset(res.headers.get('range'))
    return { completed: false, offset: next > 0 ? next : offset + len, status: res.status }
  }
  if (res.status === 404 || res.status === 410) {
    return { completed: false, offset, sessionGone: true, status: res.status }
  }
  throw new Error(`resumable 청크 업로드 실패: ${res.status}`)
}

/** Google resumable 청크 크기(마지막 제외 256KiB 배수). 8 MiB. */
export const RESUMABLE_CHUNK_BYTES = 8 * 1024 * 1024
