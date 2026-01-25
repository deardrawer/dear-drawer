'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import HeaderAuth from '@/components/layout/HeaderAuth'
import { Menu, X } from 'lucide-react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
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
            <nav className="flex items-center gap-8">
              <Link
                href="/gallery"
                className="text-sm text-gray-700 hover:text-black transition-colors tracking-wide"
              >
                Templates
              </Link>
              <Link
                href="/my-invitations"
                className="text-sm text-gray-700 hover:text-black transition-colors tracking-wide"
              >
                My Invitations
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
              <Link
                href="/gallery"
                className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Templates
              </Link>
              <Link
                href="/my-invitations"
                className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Invitations
              </Link>
              <div className="px-4 py-3 border-t border-gray-100 mt-2">
                <HeaderAuth />
              </div>
            </nav>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-100 py-8 sm:py-12 mt-12 sm:mt-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-gray-600 tracking-wider uppercase">
            © 2024 dear drawer. Crafted with AI
          </p>
        </div>
      </footer>
    </div>
  )
}
