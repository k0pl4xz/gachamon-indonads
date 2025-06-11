import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { idTelegram } = await request.json()
  
  // Normalisasi input
  const cleanId = idTelegram.replace(/^@/, '').trim().toLowerCase() // handle case sensitivity

  try {
    // Cek format username (5-32 chars, a-z0-9_)
    if (!/^[a-z0-9_]{5,32}$/.test(cleanId)) {
      return NextResponse.json(
        { valid: false, error: "Format username tidak valid" },
        { status: 400 }
      )
    }

    // Gunakan kombinasi endpoint getChat + getChatMember
    const [chatRes, memberRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=@${cleanId}`),
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=@${cleanId}&user_id=@${cleanId}`)
    ])

    // Handle rate limiting
    if (chatRes.status === 429 || memberRes.status === 429) {
      return NextResponse.json(
        { valid: false, error: "Terlalu banyak request" },
        { status: 429 }
      )
    }

    const [chatData, memberData] = await Promise.all([
      chatRes.json(),
      memberRes.json()
    ])

    // Validasi ganda
    const isValid = chatData.ok && memberData.ok && 
                   memberData.result?.status !== 'left'

    return NextResponse.json({
      valid: isValid,
      username: cleanId,
      details: isValid ? chatData.result : null
    })

  } catch (error) {
    console.error('Full Error:', error)
    return NextResponse.json(
      { 
        valid: false, 
        error: "Internal server error",
        debug: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    )
  }
}