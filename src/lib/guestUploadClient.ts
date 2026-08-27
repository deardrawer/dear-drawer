/**
 * 하객 업로드 클라이언트 헬퍼 (브라우저 전용).
 * 업로드 방식을 헬퍼로 분리 → 이후 100MB 초과 파일 multipart 추가 시 이 파일만 확장.
 *
 * TODO(B1.5): 파일 크기 임계값(예: 100MB) 초과 시 R2 S3 multipart 업로드(putFileToR2Multipart) 추가.
 *   - single PUT은 모바일 네트워크 중단 시 전체 재업로드가 필요함.
 */

export interface PutResult {
  ok: boolean
  status: number
  error?: string
}

/** R2 presigned URL로 단일 PUT 업로드 (진행률 콜백 지원). Authorization 헤더는 넣지 않는다. */
export function putFileToR2(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<PutResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    // presigned 서명에 포함된 Content-Type과 정확히 일치해야 함
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        error: xhr.status >= 300 ? xhr.responseText?.slice(0, 300) : undefined,
      })
    xhr.onerror = () => resolve({ ok: false, status: 0, error: '네트워크/CORS 오류 (R2 CORS 설정 확인)' })
    xhr.send(file)
  })
}
