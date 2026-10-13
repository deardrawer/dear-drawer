'use client'

import { useEffect } from 'react'

/**
 * 페이지 핀치/제스처 줌 비활성화.
 * - iOS Safari: gesturestart/gesturechange preventDefault
 * - Android(Chrome/삼성인터넷): 멀티터치 touchmove preventDefault (viewport user-scalable=no·touch-action만으론 일부 기기에서 안 막힘)
 * 단일 손가락 스크롤·스와이프는 영향 없음. 갤러리 라이트박스 줌은 Pointer 이벤트 기반이라 정상 동작.
 * OUR/Family가 쓰던 가드를 전 템플릿 공용으로 분리.
 */
export default function PinchZoomGuard() {
  useEffect(() => {
    const onGesture = (e: Event) => e.preventDefault()
    const onTouchMove = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault() }
    document.addEventListener('gesturestart', onGesture, { passive: false } as AddEventListenerOptions)
    document.addEventListener('gesturechange', onGesture, { passive: false } as AddEventListenerOptions)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      document.removeEventListener('gesturestart', onGesture)
      document.removeEventListener('gesturechange', onGesture)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [])
  return null
}
