/**
 * 이미지 업로드 유틸리티
 * - 클라이언트에서 이미지 리사이즈 (Canvas API)
 * - WebP 변환
 * - R2에 web/thumb 두 버전 업로드
 */

export interface UploadResult {
  success: boolean;
  imageId?: string;
  webUrl?: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  sizeWeb?: number;
  sizeThumb?: number;
  error?: string;
}

export interface UploadOptions {
  invitationId?: string;
  maxWebSize?: number;    // default: 2048
  maxThumbSize?: number;  // default: 600
  webQuality?: number;    // default: 0.8
  thumbQuality?: number;  // default: 0.7
  onProgress?: (progress: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<UploadOptions, 'invitationId' | 'onProgress'>> = {
  maxWebSize: 2048,
  maxThumbSize: 600,
  webQuality: 0.8,
  thumbQuality: 0.7,
};

/**
 * 이미지를 로드하여 Image 객체 반환
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 이미지를 리사이즈하고 WebP Blob으로 변환
 */
function resizeToWebP(
  img: HTMLImageElement,
  maxSize: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context를 가져올 수 없습니다.'));
      return;
    }

    // 비율 유지하며 리사이즈
    let { width, height } = img;
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;

    // 이미지 그리기
    ctx.drawImage(img, 0, 0, width, height);

    // WebP로 변환
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width, height });
        } else {
          reject(new Error('이미지 변환에 실패했습니다.'));
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * 파일을 R2에 업로드
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 가능)',
      };
    }

    // 파일 크기 검증 (30MB)
    if (file.size > 30 * 1024 * 1024) {
      return {
        success: false,
        error: '파일 크기는 30MB 이하여야 합니다.',
      };
    }

    opts.onProgress?.(10);

    // 이미지 로드
    const img = await loadImage(file);

    opts.onProgress?.(30);

    // Web 버전 생성 (max 2048px)
    const web = await resizeToWebP(img, opts.maxWebSize, opts.webQuality);

    opts.onProgress?.(50);

    // Thumb 버전 생성 (max 600px)
    const thumb = await resizeToWebP(img, opts.maxThumbSize, opts.thumbQuality);

    opts.onProgress?.(70);

    // Object URL 해제
    URL.revokeObjectURL(img.src);

    // FormData 생성
    const formData = new FormData();
    formData.append('web', new File([web.blob], 'web.webp', { type: 'image/webp' }));
    formData.append('thumb', new File([thumb.blob], 'thumb.webp', { type: 'image/webp' }));
    formData.append('width', web.width.toString());
    formData.append('height', web.height.toString());

    if (opts.invitationId) {
      formData.append('invitationId', opts.invitationId);
    }

    // 업로드
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    opts.onProgress?.(90);

    const data = await response.json() as {
      error?: string;
      imageId?: string;
      webUrl?: string;
      thumbUrl?: string;
      width?: number;
      height?: number;
      sizeWeb?: number;
      sizeThumb?: number;
    };

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '업로드에 실패했습니다.',
      };
    }

    opts.onProgress?.(100);

    return {
      success: true,
      imageId: data.imageId,
      webUrl: data.webUrl,
      thumbUrl: data.thumbUrl,
      width: data.width,
      height: data.height,
      sizeWeb: data.sizeWeb,
      sizeThumb: data.sizeThumb,
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 이미지 삭제
 */
export async function deleteImage(
  imageId: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageId, invitationId }),
    });

    const data = await response.json() as { error?: string };

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '삭제에 실패했습니다.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Image delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 배치 업로드 옵션
 */
export interface BatchUploadOptions {
  invitationId?: string;
  maxConcurrent?: number;  // 기본 3
  onFileStart?: (index: number, localPreviewUrl: string) => void;
  onFileProgress?: (index: number, progress: number) => void;
  onFileComplete?: (index: number, result: UploadResult) => void;
  onFileError?: (index: number, error: string) => void;
}

/**
 * 여러 이미지를 동시에 업로드 (concurrency 제한)
 * - 각 파일마다 로컬 프리뷰 URL 즉시 생성 → onFileStart 콜백
 * - maxConcurrent 개씩 병렬 업로드
 * - 내부적으로 기존 uploadImage() 재사용
 */
export async function uploadImages(
  files: File[],
  options: BatchUploadOptions = {}
): Promise<void> {
  const { maxConcurrent = 3, invitationId, onFileStart, onFileProgress, onFileComplete, onFileError } = options;

  // 즉시 모든 파일의 로컬 프리뷰 생성
  for (let i = 0; i < files.length; i++) {
    const previewUrl = URL.createObjectURL(files[i]);
    onFileStart?.(i, previewUrl);
  }

  // 간단한 concurrency 큐 구현
  let running = 0;
  let nextIndex = 0;

  await new Promise<void>((resolveAll) => {
    function startNext() {
      while (running < maxConcurrent && nextIndex < files.length) {
        const idx = nextIndex++;
        running++;

        uploadImage(files[idx], {
          invitationId,
          onProgress: (progress) => onFileProgress?.(idx, progress),
        })
          .then((result) => {
            if (result.success) {
              onFileComplete?.(idx, result);
            } else {
              onFileError?.(idx, result.error || '업로드 실패');
            }
          })
          .catch((err) => {
            onFileError?.(idx, err instanceof Error ? err.message : '업로드 중 오류');
          })
          .finally(() => {
            running--;
            if (nextIndex >= files.length && running === 0) {
              resolveAll();
            } else {
              startNext();
            }
          });
      }

      // 파일이 0개인 경우
      if (files.length === 0) {
        resolveAll();
      }
    }

    startNext();
  });
}

/**
 * 이미지를 URL에서 로드 → 크롭 → WebP 변환 → R2 업로드
 * OG 이미지 / 카카오 썸네일의 크롭 결과를 실제 파일로 생성하여
 * 외부 서비스(카카오, 페이스북 등)가 바로 사용 가능한 URL을 반환
 */
export async function cropAndUploadImage(
  imageUrl: string,
  crop: { cropX: number; cropY: number; cropWidth: number; cropHeight: number },
  options: {
    invitationId?: string;
    outputWidth?: number;
    quality?: number;
    suffix?: string;
  } = {}
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { outputWidth = 1200, quality = 0.85, suffix = 'og', invitationId } = options;

  try {
    // fetch → Object URL 방식으로 Canvas 오염(tainted) 문제 회피
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return { success: false, error: `이미지 로드 실패: ${imgResponse.status}` };
    const imgBlob = await imgResponse.blob();
    const objectUrl = URL.createObjectURL(imgBlob);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
      el.src = objectUrl;
    });

    const sx = Math.round(crop.cropX * img.naturalWidth);
    const sy = Math.round(crop.cropY * img.naturalHeight);
    const sw = Math.round(crop.cropWidth * img.naturalWidth);
    const sh = Math.round(crop.cropHeight * img.naturalHeight);

    if (sw <= 0 || sh <= 0) {
      return { success: false, error: '크롭 영역이 올바르지 않습니다.' };
    }

    let dw = sw;
    let dh = sh;
    if (dw > outputWidth) {
      dh = Math.round(dh * (outputWidth / dw));
      dw = outputWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { success: false, error: 'Canvas를 생성할 수 없습니다.' };

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    URL.revokeObjectURL(objectUrl);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });

    if (!blob) return { success: false, error: '이미지 변환에 실패했습니다.' };

    const formData = new FormData();
    formData.append('web', new File([blob], `${suffix}.webp`, { type: 'image/webp' }));
    formData.append('thumb', new File([blob], `${suffix}-thumb.webp`, { type: 'image/webp' }));
    formData.append('width', dw.toString());
    formData.append('height', dh.toString());
    if (invitationId) formData.append('invitationId', invitationId);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json() as { webUrl?: string; error?: string };
    if (!response.ok) {
      return { success: false, error: data.error || '업로드에 실패했습니다.' };
    }

    return { success: true, url: data.webUrl };
  } catch (error) {
    console.error('Crop and upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '크롭 업로드 중 오류가 발생했습니다.',
    };
  }
}

/**
 * base64 문자열인지 확인
 */
export function isBase64(str: string): boolean {
  return str.startsWith('data:image/');
}

/**
 * URL인지 확인 (http/https 또는 상대 경로)
 */
export function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/');
}
