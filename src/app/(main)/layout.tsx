'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import HeaderAuth from '@/components/layout/HeaderAuth'
import { Menu, X } from 'lucide-react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isActive = (path: string) => {
    if (path === '/gallery') {
      return pathname === '/' || pathname === '/gallery'
    }
    return pathname === path || pathname?.startsWith(path + '/')
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/gallery" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="dear drawer"
              width={140}
              height={32}
              className="h-6 sm:h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation - 768px 이상 */}
          {!isMobile && (
            <nav className="flex items-center gap-6">
              <a
                href="https://pf.kakao.com/_bEpxen/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors tracking-wide text-gray-500 hover:text-black"
              >
                문의하기
              </a>
              <Link
                href="/templates"
                className="text-sm transition-colors tracking-wide text-gray-500 hover:text-black"
              >
                모바일 청첩장
              </Link>
              <Link
                href="/my-invitations"
                className="text-sm font-medium px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                제작내역
              </Link>
              <HeaderAuth />
            </nav>
          )}

          {/* Mobile Menu Button - 768px 미만 */}
          {isMobile && (
            <button
              className="p-2 -mr-2 text-gray-700 hover:text-black transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMobile && isMobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              <a
                href="https://pf.kakao.com/_bEpxen/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 text-sm rounded-lg transition-colors text-gray-500 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                문의하기
              </a>
              <Link
                href="/templates"
                className="px-4 py-3 text-sm rounded-lg transition-colors text-gray-500 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                모바일 청첩장
              </Link>
              <div className="px-4 my-2">
                <Link
                  href="/my-invitations"
                  className="block w-full py-3 text-sm font-medium text-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  제작내역
                </Link>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 mt-2">
                <HeaderAuth />
              </div>
            </nav>
          </div>
        )}
      </header>
      <main>{children}</main>
      {/* 갤러리 페이지에서는 Full-page 스크롤 사용으로 푸터 숨김 */}
      {pathname !== '/gallery' && pathname !== '/' && (
      <footer className="border-t border-gray-100 py-10 sm:py-14 mt-12 sm:mt-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          {/* 상단: 로고 + 링크들 */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
            {/* 로고 및 설명 */}
            <div className="flex flex-col items-center md:items-start">
              <Image
                src="/logo.png"
                alt="dear drawer"
                width={120}
                height={28}
                className="h-6 w-auto mb-3 opacity-70"
              />
              <p className="text-xs text-gray-500 text-center md:text-left">
                세상에 하나뿐인 우리의 이야기를 담은 청첩장
              </p>
            </div>

            {/* 링크 그룹들 */}
            <div className="flex flex-wrap justify-center md:justify-end gap-8 sm:gap-12">
              {/* 서비스 */}
              <div className="text-center md:text-left">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">서비스</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/gallery" className="text-sm text-gray-500 hover:text-black transition-colors">
                      템플릿 둘러보기
                    </Link>
                  </li>
                  <li>
                    <Link href="/my-invitations" className="text-sm text-gray-500 hover:text-black transition-colors">
                      내 청첩장
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 고객지원 */}
              <div className="text-center md:text-left">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">고객지원</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://pf.kakao.com/_bEpxen" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-black transition-colors">
                      문의하기
                    </a>
                  </li>
                </ul>
              </div>

              {/* 법적 정보 */}
              <div className="text-center md:text-left">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">약관</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://www.deardrawer.com/098" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-black transition-colors">
                      이용약관
                    </a>
                  </li>
                  <li>
                    <a href="https://www.deardrawer.com/099" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-black transition-colors">
                      개인정보처리방침
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* 카피라이트 */}
              <p className="text-xs text-gray-500">
                © 2024 dear drawer. All rights reserved.
              </p>

              {/* SNS 링크 */}
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/dear.drawer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-500 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://pf.kakao.com/_bEpxen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-yellow-500 transition-colors"
                  aria-label="KakaoTalk"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.84 1.86 5.33 4.66 6.73-.15.54-.96 3.48-1 3.64 0 .07.02.14.08.19.06.05.14.06.21.03.28-.04 3.22-2.12 4.55-3 .49.07.99.11 1.5.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  )
}
