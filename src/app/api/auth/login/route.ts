import { NextRequest, NextResponse } from 'next/server'
import { createSession, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  const token = await createSession()
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return response
}
