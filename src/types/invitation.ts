// 청첩장 타입 정의

export interface Invitation {
  id: string;
  user_id: string;
  template_id: string;

  // 신랑신부 정보
  groom_name: string | null;
  bride_name: string | null;

  // 결혼식 정보
  wedding_date: string | null;
  wedding_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_detail: string | null;
  venue_map_url: string | null;

  // 이미지
  main_image: string | null;
  gallery_images: string; // JSON string array

  // 인사말
  greeting_message: string | null;

  // 추가 정보
  contact_groom: string | null;
  contact_bride: string | null;
  account_info: string; // JSON string array

  // 전체 콘텐츠 (JSON)
  content: string | null;

  // 상태
  is_paid: number;
  is_published: number;
  slug: string | null;

  // 타임스탬프
  created_at: string;
  updated_at: string;
}

export interface InvitationInput {
  template_id?: string;
  groom_name?: string;
  bride_name?: string;
  wedding_date?: string;
  wedding_time?: string;
  venue_name?: string;
  venue_address?: string;
  venue_detail?: string;
  venue_hall?: string;
  venue_map_url?: string;
  main_image?: string;
  gallery_images?: string[];
  greeting_message?: string;
  contact_groom?: string;
  contact_bride?: string;
  account_info?: AccountInfo[];
  content?: string;
  is_published?: boolean;
  slug?: string;
}

export interface AccountInfo {
  bank: string;
  holder: string;
  number: string;
  type: "groom" | "bride" | "groom_father" | "groom_mother" | "bride_father" | "bride_mother";
}

export interface PageView {
  id: number;
  invitation_id: string;
  visitor_ip: string | null;
  user_agent: string | null;
  viewed_at: string;
}

export interface SlugAlias {
  id: string;
  invitation_id: string;
  alias_slug: string;
  created_at: string;
}

// 템플릿 정의
export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  isPremium: boolean;
}

export const TEMPLATES: Template[] = [
  {
    id: "classic",
    name: "클래식",
    description: "우아하고 전통적인 디자인",
    thumbnail: "/templates/classic.png",
    isPremium: false,
  },
  {
    id: "modern",
    name: "모던",
    description: "세련되고 미니멀한 디자인",
    thumbnail: "/templates/modern.png",
    isPremium: false,
  },
  {
    id: "romantic",
    name: "손글씨",
    description: "따뜻하고 감성적인 디자인",
    thumbnail: "/templates/romantic.png",
    isPremium: true,
  },
  {
    id: "nature",
    name: "네이처",
    description: "자연 친화적인 디자인",
    thumbnail: "/templates/nature.png",
    isPremium: true,
  },
];
