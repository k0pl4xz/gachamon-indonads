import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { idTelegram } = await request.json()
    const cleanId = idTelegram.replace(/^@/, '')
    
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=${cleanId}`
    )
    const data = await response.json()

    return NextResponse.json({ 
      valid: data.ok,
      username: data.result?.username || cleanId 
    })
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Gagal verifikasi ID Telegram' },
      { status: 500 }
    )
  }
}