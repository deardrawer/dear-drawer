/**
 * 하객 사진 공유 — 업로드 제한/검증/키 생성 (서버·클라이언트 공용 순수 로직).
 * MVP 값은 상수화 — 실사용 보고 후 조정.
 */

export const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'heic'] as const
export const VIDEO_EXTS = ['mp4', 'mov'] as const

// MIME 허용 목록 (HEIC/MOV는 브라우저가 빈 MIME을 주기도 함 → 확장자와 조합 판정)
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const VIDEO_MIMES = ['video/mp4', 'video/quicktime']

export const GUEST_SHARE_LIMITS = {
  imageMaxBytes: 30 * 1024 * 1024, // 30MB
  videoMaxBytes: 500 * 1024 * 1024, // 500MB (single PUT — 모바일 중단 시 전체 재업로드 필요: TODO multipart)
  maxFiles: 20,
  maxTotalBytes: 2 * 1024 * 1024 * 1024, // 2GB
}

// presigned URL 만료 (초). 500MB 모바일 업로드에서 부족하면 상향.
export const PRESIGN_EXPIRES_SECONDS = 600 // 10분

// 남용 방지 (애플리케이션 레벨 rate limit)
export const RATE_LIMIT = {
  perIpSessionsPerHour: 5,
  perInvitationSessionsPerHour: 40,
}

function extFromName(name: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || '')
  return (m?.[1] || '').toLowerCase()
}

export type FileKind = 'image' | 'video'

export interface FileMetaInput {
  name: string
  mimeType: string
  size: number
}

export interface ValidatedFile {
  ok: boolean
  kind?: FileKind
  ext?: string
  error?: string
}

/** 확장자 + MIME 조합으로 종류 판정 + 크기 검증. 클라이언트 값은 서버에서 다시 검증한다. */
export function validateFile(f: FileMetaInput): ValidatedFile {
  const ext = extFromName(f.name)
  const mime = (f.mimeType || '').toLowerCase()

  const isImage = (IMAGE_EXTS as readonly string[]).includes(ext) || IMAGE_MIMES.includes(mime)
  const isVideo = (VIDEO_EXTS as readonly string[]).includes(ext) || VIDEO_MIMES.includes(mime)

  if (!isImage && !isVideo) return { ok: false, error: '지원하지 않는 형식입니다. (사진: jpg/png/webp/heic, 영상: mp4/mov)' }

  const kind: FileKind = (VIDEO_EXTS as readonly string[]).includes(ext)
    ? 'video'
    : (IMAGE_EXTS as readonly string[]).includes(ext)
      ? 'image'
      : isVideo
        ? 'video'
        : 'image'

  const okExt = kind === 'video' ? (VIDEO_EXTS as readonly string[]) : (IMAGE_EXTS as readonly string[])
  const finalExt = okExt.includes(ext) ? ext : kind === 'video' ? 'mp4' : 'jpg'

  const max = kind === 'video' ? GUEST_SHARE_LIMITS.videoMaxBytes : GUEST_SHARE_LIMITS.imageMaxBytes
  if (!Number.isFinite(f.size) || f.size <= 0) return { ok: false, error: '파일 크기가 올바르지 않습니다.' }
  if (f.size > max) {
    const mb = Math.round(max / (1024 * 1024))
    return { ok: false, error: `${kind === 'video' ? '영상' : '사진'}은 최대 ${mb}MB까지 가능합니다.` }
  }
  return { ok: true, kind, ext: finalExt }
}

export function validateBatch(files: FileMetaInput[]): { ok: boolean; error?: string } {
  if (!files.length) return { ok: false, error: '파일을 선택해주세요.' }
  if (files.length > GUEST_SHARE_LIMITS.maxFiles) return { ok: false, error: `한 번에 최대 ${GUEST_SHARE_LIMITS.maxFiles}개까지 업로드할 수 있습니다.` }
  const total = files.reduce((s, f) => s + (f.size || 0), 0)
  if (total > GUEST_SHARE_LIMITS.maxTotalBytes) {
    return { ok: false, error: `전체 용량은 최대 ${Math.round(GUEST_SHARE_LIMITS.maxTotalBytes / (1024 * 1024 * 1024))}GB까지 가능합니다.` }
  }
  return { ok: true }
}

/**
 * 보내는 사람 이름 sanitize — 허용 문자만 유지(whitelist): 유니코드 글자/숫자 + 공백 + _ . -
 * (제어문자·경로문자 / \ : * ? " < > | 등은 자동 제거)
 */
export function sanitizeGuestName(name: string): string {
  const cleaned = (name || '')
    .replace(/[^\p{L}\p{N} _.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 40)
  return cleaned || '익명'
}

/** 확장자 → MIME (브라우저가 빈 MIME을 준 HEIC/MOV 대비) */
export function extToMime(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic',
    mp4: 'video/mp4', mov: 'video/quicktime',
  }
  return map[ext] || 'application/octet-stream'
}

/** R2 object key 생성 — 원본 파일명 미포함, 서버 결정 */
export function buildR2Key(invitationId: string, sessionId: string, fileId: string, ext: string): string {
  const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'bin'
  return `guest-share/${invitationId}/${sessionId}/${fileId}.${safeExt}`
}
