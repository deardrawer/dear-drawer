import Link from 'next/link'
import Image from 'next/image'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="dear drawer"
              width={140}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/"
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
            <Link
              href="/login"
              className="text-sm px-5 py-2 bg-black text-white hover:bg-gray-800 transition-colors tracking-wide"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-100 py-12 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs text-gray-600 tracking-wider uppercase">
            © 2024 dear drawer. Crafted with AI
          </p>
        </div>
      </footer>
    </div>
  )
}
