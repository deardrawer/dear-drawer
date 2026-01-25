'use client';

import { useRef } from 'react';

interface ParentInfo {
  fatherName: string;
  motherName: string;
  fatherSuffix?: string;
  motherSuffix?: string;
}

interface InvitationContentProps {
  groomName: string;
  brideName: string;
  groomParents: ParentInfo;
  brideParents: ParentInfo;
  date: string;
  time: string;
  venue: string;
  venueHall?: string;
  address?: string;
  message?: string;
}

export default function InvitationContent({
  groomName,
  brideName,
  groomParents,
  brideParents,
  date,
  time,
  venue,
  venueHall,
  address,
  message = '두 사람이 사랑으로 만나\n믿음과 신뢰로 한 가정을 이루려 합니다.\n바쁘시더라도 오셔서 축복해 주시면\n큰 기쁨이 되겠습니다.',
}: InvitationContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={contentRef}
      className="min-h-screen flex flex-col items-center justify-center px-8 py-16"
      style={{ backgroundColor: '#FFFEF8' }}
    >
      {/* Decorative top element */}
      <div className="mb-12 flex flex-col items-center">
        <div
          className="w-8 h-8 border rotate-45 mb-4"
          style={{ borderColor: '#C9A962' }}
        />
        <p
          className="font-serif text-sm tracking-[0.3em]"
          style={{ color: '#C9A962' }}
        >
          WEDDING INVITATION
        </p>
      </div>

      {/* Message */}
      <div className="text-center mb-12 max-w-xs">
        <p
          className="font-serif text-base leading-8 whitespace-pre-line"
          style={{ color: '#1A1A1A' }}
        >
          {message}
        </p>
      </div>

      {/* Gold divider */}
      <div
        className="h-px w-16 mb-12"
        style={{ backgroundColor: '#C9A962' }}
      />

      {/* Parents names */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span
            className="font-serif text-sm"
            style={{ color: '#666666' }}
          >
            {groomParents.fatherName}
            <span className="text-xs ml-1">{groomParents.fatherSuffix || '·'}</span>
          </span>
          <span
            className="font-serif text-sm"
            style={{ color: '#666666' }}
          >
            {groomParents.motherName}
            <span className="text-xs ml-1">{groomParents.motherSuffix || ''}</span>
          </span>
          <span
            className="font-serif text-sm"
            style={{ color: '#1A1A1A' }}
          >
            의 장남
          </span>
          <span
            className="font-serif text-lg font-medium"
            style={{ color: '#1A1A1A' }}
          >
            {groomName}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span
            className="font-serif text-sm"
            style={{ color: '#666666' }}
          >
            {brideParents.fatherName}
            <span className="text-xs ml-1">{brideParents.fatherSuffix || '·'}</span>
          </span>
          <span
            className="font-serif text-sm"
            style={{ color: '#666666' }}
          >
            {brideParents.motherName}
            <span className="text-xs ml-1">{brideParents.motherSuffix || ''}</span>
          </span>
          <span
            className="font-serif text-sm"
            style={{ color: '#1A1A1A' }}
          >
            의 장녀
          </span>
          <span
            className="font-serif text-lg font-medium"
            style={{ color: '#1A1A1A' }}
          >
            {brideName}
          </span>
        </div>
      </div>

      {/* Couple names highlight */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4">
          <span
            className="font-serif text-2xl tracking-wide"
            style={{ color: '#1A1A1A' }}
          >
            {groomName}
          </span>
          <span
            className="font-serif text-lg"
            style={{ color: '#C9A962' }}
          >
            &
          </span>
          <span
            className="font-serif text-2xl tracking-wide"
            style={{ color: '#1A1A1A' }}
          >
            {brideName}
          </span>
        </div>
      </div>

      {/* Date & Time */}
      <div className="text-center mb-8">
        <p
          className="font-serif text-lg tracking-wider mb-2"
          style={{ color: '#1A1A1A' }}
        >
          {date}
        </p>
        <p
          className="font-serif text-base"
          style={{ color: '#666666' }}
        >
          {time}
        </p>
      </div>

      {/* Venue */}
      <div className="text-center mb-12">
        <p
          className="font-serif text-lg mb-1"
          style={{ color: '#1A1A1A' }}
        >
          {venue}
        </p>
        {venueHall && (
          <p
            className="font-serif text-base mb-2"
            style={{ color: '#666666' }}
          >
            {venueHall}
          </p>
        )}
        {address && (
          <p
            className="font-serif text-sm"
            style={{ color: '#999999' }}
          >
            {address}
          </p>
        )}
      </div>

      {/* Decorative bottom element */}
      <div
        className="w-8 h-8 border rotate-45"
        style={{ borderColor: '#C9A962' }}
      />
    </div>
  );
}
