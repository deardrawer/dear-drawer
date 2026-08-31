/* eslint-disable @typescript-eslint/no-explicit-any */
import InvitationClient from "./InvitationClient";
import InvitationClientFamily from "./InvitationClientFamily";
import InvitationClientMagazine from "./InvitationClientMagazine";
import InvitationClientFilm from "./InvitationClientFilm";
import InvitationClientRecord from "./InvitationClientRecord";
import InvitationClientExhibit from "./InvitationClientExhibit";
import InvitationClientEssay from "./InvitationClientEssay";
import InvitationClientThankYou from "./InvitationClientThankYou";
import InvitationClientTheSimple from "./InvitationClientTheSimple";
import InvitationClientClassic from "./InvitationClientClassic";

/**
 * 청첩장 본문 렌더 코어(최소 공용). 접근제어는 포함하지 않는다.
 * - /i/[slug] (공개 링크): public_hidden + Day30 cutoff 게이트 후 이 코어 사용
 * - /s/[shareSlug] (비밀번호 청첩장): 비밀번호 인증 게이트 후 이 코어 사용
 * 두 라우트의 접근제어 로직은 절대 여기서 공유하지 않는다(렌더만 공유).
 */
export interface InvitationBodyProps {
  invitation: any;
  content: any;
  isPaid: boolean;
  isPreview?: boolean;
  isSample?: boolean;
  overrideColorTheme?: string;
  overrideFontStyle?: string;
  skipIntro?: boolean;
  guestInfo?: any;
}

export function InvitationBody({
  invitation,
  content,
  isPaid,
  isPreview = false,
  isSample = false,
  overrideColorTheme,
  overrideFontStyle,
  skipIntro = false,
  guestInfo = null,
}: InvitationBodyProps) {
  const t = invitation.template_id;

  // 감사장은 props가 달라 별도 렌더
  if (t === 'narrative-thankyou') {
    return (
      <InvitationClientThankYou
        invitation={invitation}
        content={content}
        isPaid={isPaid}
        isPreview={isPreview}
        isSample={isSample}
      />
    );
  }

  const ClientComponent =
    t === 'narrative-classic' ? InvitationClientClassic :
    t === 'narrative-the-simple' ? InvitationClientTheSimple :
    t === 'narrative-essay' ? InvitationClientEssay :
    t === 'narrative-exhibit' ? InvitationClientExhibit :
    t === 'narrative-record' ? InvitationClientRecord :
    t === 'narrative-film' ? InvitationClientFilm :
    t === 'narrative-magazine' ? InvitationClientMagazine :
    t === 'narrative-family' ? InvitationClientFamily :
    InvitationClient;

  return (
    <ClientComponent
      invitation={invitation}
      content={content}
      isPaid={isPaid}
      isPreview={isPreview}
      overrideColorTheme={overrideColorTheme}
      overrideFontStyle={overrideFontStyle}
      skipIntro={skipIntro}
      guestInfo={guestInfo}
      isSample={isSample}
    />
  );
}
