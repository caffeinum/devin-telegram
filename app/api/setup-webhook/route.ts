import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const origin = request.headers.get("x-forwarded-host")
  const url = `https://${origin}/api/telegram`

  if (!url) {
    return Response.json({ ok: false, description: "URL parameter is required" }, { status: 400 })
  }

  try {
    // Make a request to the Telegram API to set the webhook
    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("Error setting webhook:", error)
    return Response.json(
      { ok: false, description: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

