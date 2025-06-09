import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Gunakan SERVICE ROLE KEY
)

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('custom_users')
      .select('id, username, password_hash')
      .eq('username', username)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 })
    }

    const response = NextResponse.json({ message: 'Login berhasil' })

    response.cookies.set('auth_token', user.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 hari
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Login Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
