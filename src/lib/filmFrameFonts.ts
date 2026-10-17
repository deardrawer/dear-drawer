// 무비 프레임 인트로 글꼴 (조사해 고른 무료 글꼴) — 'theme' 은 템플릿 기본 글꼴
export const FRAME_EN_FONTS: { id: string; label: string; family: string; script?: boolean }[] = [
  { id: 'theme', label: '기본', family: '' },
  { id: 'pinyon', label: 'Pinyon Script', family: "'Pinyon Script', cursive", script: true },
  { id: 'delafield', label: 'Mrs Saint Delafield', family: "'Mrs Saint Delafield', cursive", script: true },
  { id: 'sacramento', label: 'Sacramento', family: "'Sacramento', cursive", script: true },
  { id: 'cormorant', label: 'Cormorant', family: "'Cormorant Garamond', serif" },
  { id: 'playfair', label: 'Playfair', family: "'Playfair Display', serif" },
  { id: 'gilda', label: 'Gilda Display', family: "'Gilda Display', serif" },
  { id: 'bodoni', label: 'Bodoni', family: "'Bodoni Moda', serif" },
  { id: 'cinzel', label: 'Cinzel', family: "'Cinzel', serif" },
]
export const FRAME_KO_FONTS: { id: string; label: string; family: string }[] = [
  { id: 'theme', label: '기본', family: '' },
  { id: 'pretendard', label: '프리텐다드', family: "Pretendard, sans-serif" },
  { id: 'notoserif', label: '노토 세리프', family: "'Noto Serif KR', serif" },
  { id: 'myeongjo', label: '나눔명조', family: "'Nanum Myeongjo', serif" },
  { id: 'gowun', label: '고운바탕', family: "'Gowun Batang', serif" },
  { id: 'hahmlet', label: '함렛', family: "'Hahmlet', serif" },
  { id: 'dodum', label: '고운돋움', family: "'Gowun Dodum', sans-serif" },
  { id: 'hand', label: '손글씨(폴페어니스)', family: "'NostalgicPoliceFairness', cursive" },
]
export const FRAME_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Mrs+Saint+Delafield&family=Sacramento&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Playfair+Display:ital@0;1&family=Gilda+Display&family=Bodoni+Moda:ital,opsz@0,6..96;1,6..96&family=Cinzel:wght@500;600&family=Noto+Serif+KR:wght@400;500&family=Nanum+Myeongjo&family=Gowun+Batang&family=Hahmlet:wght@400;500&family=Gowun+Dodum&display=swap'
