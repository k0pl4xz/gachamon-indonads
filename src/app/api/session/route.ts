import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies() // <--- ✅ gunakan await
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ loggedIn: false }, { status: 401 })
  }

  return NextResponse.json({ loggedIn: true })
}
