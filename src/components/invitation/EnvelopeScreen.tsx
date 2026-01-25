'use client';

import { useState, useRef, useCallback } from 'react';

interface EnvelopeScreenProps {
  recipientName: string;
  honorific?: string;
  onOpen: () => void;
}

export default function EnvelopeScreen({
  recipientName,
  honorific = '님께',
  onOpen,
}: EnvelopeScreenProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const SWIPE_THRESHOLD = 100;

  const handleStart = useCallback((clientY: number) => {
    startY.current = clientY;
    isDragging.current = true;
  }, []);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    const diff = startY.current - clientY;
    if (diff > 0) {
      setDragY(Math.min(diff, 150));
    }
  }, []);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragY >= SWIPE_THRESHOLD) {
      setIsOpening(true);
      setTimeout(() => {
        onOpen();
      }, 500);
    } else {
      setDragY(0);
    }
  }, [dragY, onOpen]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleEnd();
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        select-none cursor-grab active:cursor-grabbing
        transition-transform duration-500 ease-out
        ${isOpening ? '-translate-y-full' : ''}
      `}
      style={{
        backgroundColor: '#FFFEF8',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundBlendMode: 'soft-light',
        transform: isOpening
          ? 'translateY(-100%)'
          : `translateY(-${dragY}px)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main content */}
      <div className="flex flex-col items-center gap-6">
        {/* Top gold line */}
        <div
          className="h-px"
          style={{
            width: '120px',
            backgroundColor: '#C9A962'
          }}
        />

        {/* Recipient name */}
        <h1
          className="font-serif"
          style={{
            fontSize: '18px',
            color: '#1A1A1A',
            fontWeight: 400,
            letterSpacing: '1px',
          }}
        >
          {recipientName} {honorific}
        </h1>

        {/* Bottom gold line */}
        <div
          className="h-px"
          style={{
            width: '120px',
            backgroundColor: '#C9A962'
          }}
        />
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <span
          className="animate-bounce text-lg"
          style={{ color: '#C9A962' }}
        >
          ↑
        </span>
        <span
          className="text-xs tracking-widest animate-pulse"
          style={{ color: '#999999' }}
        >
          밀어서 열기
        </span>
      </div>
    </div>
  );
}
