import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { idTelegram } = await request.json()
  
  if (!idTelegram) {
    return NextResponse.json(
      { error: 'ID Telegram diperlukan' },
      { status: 400 }
    )
  }

  try {
    const cleanId = idTelegram.replace(/^@/, '')
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=${cleanId}`
    
    const response = await fetch(url)
    const data = await response.json()

    return NextResponse.json({ 
      valid: data.ok,
      username: data.result?.username || cleanId 
    })
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Gagal verifikasi ID Telegram' },
      { status: 500 }
    )
  }
}