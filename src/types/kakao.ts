// Kakao OAuth Types

// Kakao Maps Types
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: { center: any; level: number }) => any;
        LatLng: new (lat: number, lng: number) => any;
        Marker: new (options: { position: any }) => { setMap: (map: any) => void };
        InfoWindow: new (options: { content: string }) => { open: (map: any, marker: any) => void };
        services: {
          Geocoder: new () => {
            addressSearch: (
              address: string,
              callback: (result: { x: string; y: string }[], status: string) => void
            ) => void;
          };
          Status: {
            OK: string;
            ZERO_RESULT: string;
            ERROR: string;
          };
        };
      };
    };
  }
}

export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in: number;
  scope?: string;
}

export interface KakaoProfile {
  nickname?: string;
  thumbnail_image_url?: string;
  profile_image_url?: string;
  is_default_image?: boolean;
}

export interface KakaoAccount {
  profile_nickname_needs_agreement?: boolean;
  profile_image_needs_agreement?: boolean;
  profile?: KakaoProfile;
  email_needs_agreement?: boolean;
  is_email_valid?: boolean;
  is_email_verified?: boolean;
  email?: string;
  name_needs_agreement?: boolean;
  name?: string;
}

export interface KakaoUserResponse {
  id: number;
  connected_at?: string;
  kakao_account?: KakaoAccount;
}

export interface User {
  id: string;
  kakaoId: number;
  nickname: string;
  email?: string;
  profileImage?: string;
}

export interface JWTPayload {
  user: User;
  iat: number;
  exp: number;
}
