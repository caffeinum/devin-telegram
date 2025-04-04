import { ensureBotInitialized, bot } from "../../../lib/bot"
import {
  handleTextMessage,
  handleStartCommand,
  handleResetCommand,
  handleHelpCommand,
  handleStatusCommand,
  handleNewCommand,
} from "../../../bot/handlers/message"

// Set up command handlers FIRST
bot.command("start", handleStartCommand)
bot.command("reset", handleResetCommand)
bot.command("help", handleHelpCommand)
bot.command("status", handleStatusCommand)
bot.command("new", handleNewCommand)

// Then set up the general message handler
bot.on("message:text", handleTextMessage)

// Export the POST method to handle webhook requests
export async function POST(request: Request) {
  try {
    // Ensure bot is initialized
    await ensureBotInitialized()

    // Parse the request body
    const update = await request.json()

    // Process the update with the bot
    await bot.handleUpdate(update)

    // Return a success response
    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("Error in webhook handler:", error)
    return new Response(`Error processing webhook: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
    })
  }
}

// Export a GET method to check if the webhook endpoint is working
export async function GET() {
  try {
    // Ensure bot is initialized
    const initializedBot = await ensureBotInitialized()
    return new Response(`Telegram webhook is active! Bot username: @${initializedBot.botInfo.username}`, {
      status: 200,
    })
  } catch (error) {
    console.error("Error initializing bot:", error)
    return new Response(`Error initializing bot: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
    })
  }
}

