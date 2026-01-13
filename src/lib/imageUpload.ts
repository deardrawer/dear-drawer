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
  invitationId?: string
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
 * base64 문자열인지 확인
 */
export function isBase64(str: string): boolean {
  return str.startsWith('data:image/');
}

/**
 * URL인지 확인 (http/https)
 */
export function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}
