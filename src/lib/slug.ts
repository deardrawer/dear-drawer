// Slug 유효성 검사 및 유틸리티

// 예약어 목록 (사용 불가)
export const RESERVED_SLUGS = [
  // 시스템 경로
  'admin', 'api', 'auth', 'login', 'logout', 'signup', 'register',
  'dashboard', 'editor', 'settings', 'profile', 'account',
  'invitation', 'invitations', 'i', 'my-invitations',
  // 일반 예약어
  'www', 'mail', 'ftp', 'smtp', 'pop', 'imap',
  'help', 'support', 'contact', 'about', 'terms', 'privacy',
  'new', 'create', 'edit', 'delete', 'update', 'view',
  'test', 'demo', 'sample', 'example',
  // 서비스명
  'dear-drawer', 'deardrawer', 'wedding', 'weddinglink',
];

// Slug 규칙
export const SLUG_RULES = {
  minLength: 3,
  maxLength: 30,
  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // 영문소문자, 숫자, 하이픈(중간만)
};

export interface SlugValidationResult {
  isValid: boolean;
  error?: string;
  normalizedSlug?: string;
}

// Slug 정규화 (소문자 변환, 공백->하이픈 등)
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // 공백 -> 하이픈
    .replace(/[^a-z0-9-]/g, '')  // 영문소문자, 숫자, 하이픈만 허용
    .replace(/-+/g, '-')         // 연속 하이픈 제거
    .replace(/^-|-$/g, '');      // 앞뒤 하이픈 제거
}

// Slug 유효성 검사
export function validateSlug(slug: string): SlugValidationResult {
  const normalized = normalizeSlug(slug);

  // 빈 값 체크
  if (!normalized) {
    return {
      isValid: false,
      error: '슬러그를 입력해주세요.',
    };
  }

  // 길이 체크
  if (normalized.length < SLUG_RULES.minLength) {
    return {
      isValid: false,
      error: `슬러그는 최소 ${SLUG_RULES.minLength}자 이상이어야 합니다.`,
      normalizedSlug: normalized,
    };
  }

  if (normalized.length > SLUG_RULES.maxLength) {
    return {
      isValid: false,
      error: `슬러그는 최대 ${SLUG_RULES.maxLength}자까지만 가능합니다.`,
      normalizedSlug: normalized,
    };
  }

  // 패턴 체크
  if (!SLUG_RULES.pattern.test(normalized)) {
    return {
      isValid: false,
      error: '슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.',
      normalizedSlug: normalized,
    };
  }

  // 예약어 체크
  if (RESERVED_SLUGS.includes(normalized)) {
    return {
      isValid: false,
      error: '이 슬러그는 예약어로 사용할 수 없습니다.',
      normalizedSlug: normalized,
    };
  }

  // UUID 형식 체크 (충돌 방지)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(normalized)) {
    return {
      isValid: false,
      error: 'UUID 형식은 슬러그로 사용할 수 없습니다.',
      normalizedSlug: normalized,
    };
  }

  return {
    isValid: true,
    normalizedSlug: normalized,
  };
}

// 대체 슬러그 추천 생성
export function generateSlugSuggestions(baseSlug: string, count: number = 5): string[] {
  const normalized = normalizeSlug(baseSlug);
  const suggestions: string[] = [];

  // 숫자 접미사 추가
  for (let i = 1; i <= count; i++) {
    suggestions.push(`${normalized}-${i}`);
  }

  // 랜덤 숫자 추가
  const randomNum = Math.floor(Math.random() * 900) + 100;
  suggestions.push(`${normalized}-${randomNum}`);

  // 연도 추가
  const year = new Date().getFullYear();
  suggestions.push(`${normalized}-${year}`);

  return suggestions.filter(s => s.length <= SLUG_RULES.maxLength);
}

// UUID인지 확인
export function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}
