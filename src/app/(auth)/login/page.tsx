'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/my-invitations')
        router.refresh()
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 p-10">
        <div className="text-center mb-10">
          <Link href="/" className="text-xl font-light tracking-wider text-black uppercase">
            dear drawer
          </Link>
          <p className="text-gray-400 mt-3 text-sm font-light">Sign in to manage your invitations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-gray-50 border border-gray-200 text-gray-600 p-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs tracking-wider uppercase text-gray-500">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs tracking-wider uppercase text-gray-500">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800 rounded-none h-12 text-sm tracking-wider"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-400">Don't have an account? </span>
          <Link href="/signup" className="text-black hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
