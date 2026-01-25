'use client';

import { useState } from 'react';
import EnvelopeScreen from '@/components/invitation/EnvelopeScreen';
import InvitationContent from '@/components/invitation/InvitationContent';

export default function EnvelopeSamplePage() {
  const [isOpened, setIsOpened] = useState(false);

  const handleOpen = () => {
    setIsOpened(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFEF8' }}>
      {!isOpened && (
        <EnvelopeScreen
          recipientName="김영수"
          honorific="님께"
          onOpen={handleOpen}
        />
      )}

      {isOpened && (
        <div className="animate-fade-in">
          <InvitationContent
            groomName="민준"
            brideName="서연"
            groomParents={{
              fatherName: '김철수',
              motherName: '이영희',
            }}
            brideParents={{
              fatherName: '박정호',
              motherName: '최수진',
            }}
            date="2026년 3월 28일 토요일 오후 2시"
            time="오후 2시"
            venue="그랜드 하얏트 서울"
            venueHall="그랜드볼룸 3층"
            address="서울특별시 용산구 소월로 322"
          />
        </div>
      )}
    </div>
  );
}
