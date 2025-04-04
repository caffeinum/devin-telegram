import { Bot } from "grammy"

// Initialize the bot with the token from environment variables
const bot = new Bot(process.env.BOT_TOKEN!)

// Flag to track if the bot has been initialized
let botInitialized = false

// Function to ensure bot is initialized
export async function ensureBotInitialized() {
  if (!botInitialized) {
    await bot.init()
    botInitialized = true
    console.log(`Bot initialized: @${bot.botInfo.username}`)
  }
  return bot
}

// Export the bot instance
export { bot }

