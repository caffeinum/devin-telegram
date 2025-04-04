import type { Context } from "grammy"
import { createDevinSession, getDevinSessionDetails, sendMessageToDevinSession } from "../../lib/devin-api"
import { sessionStore } from "../../lib/redis-session-store"

// Handle text messages
export async function handleTextMessage(ctx: Context): Promise<void> {
  const userId = ctx.from?.id
  const messageText = ctx.message?.text

  if (!userId || !messageText) {
    return
  }

  try {
    // Check if user has an active session
    if (!(await sessionStore.hasActiveSession(userId))) {
      await createNewSession(ctx, userId, messageText)
    } else {
      // Get the existing session
      const userSession = await sessionStore.getSession(userId)

      if (!userSession) {
        return
      }

      // Send a message to the existing Devin session
      await sendMessageToDevinSession(userSession.devinSessionId, messageText)

      // Update the last interaction time
      await sessionStore.setSession(userId, {
        ...userSession,
        lastInteractionTime: new Date(),
      })

      // Acknowledge receipt of the message
      await ctx.reply(
        "✅ Message sent to Devin. I'll update you when there's progress.\n\n" +
          "Use /status to check the current status or /help for more commands.",
      )
    }
  } catch (error) {
    console.error("Error handling message:", error)
    await ctx.reply(
      "❌ Sorry, there was an error processing your request. Please try again later.\n\n" +
        "If the problem persists, you can try /reset to start a new session.",
    )
  }
}

// Create a new session
async function createNewSession(ctx: Context, userId: number, prompt: string): Promise<void> {
  // Send a message to the user that we're creating a new session
  const loadingMsg = await ctx.reply("🔄 Creating a new Devin session for you...")

  try {
    // Create a new Devin session
    const session = await createDevinSession(prompt)

    // Store the session
    sessionStore.setSession(userId, {
      devinSessionId: session.session_id,
      devinSessionUrl: session.url,
      lastInteractionTime: new Date(),
    })

    // Send a confirmation message with the session URL
    await ctx.reply(
      `🚀 Session created!\n\n` +
        `🔗 View in browser: ${session.url}\n\n` +
        `Devin is now processing your request. I'll update you when there's progress.\n\n` +
        `Use /status to check the current status or /help for more commands.`,
    )

    // Start polling for updates
    pollSessionUpdates(ctx, userId, session.session_id)
  } catch (error) {
    console.error("Error creating session:", error)
    await ctx.reply(
      "❌ Failed to create a Devin session. Please try again later.\n\n" +
        "If the problem persists, please check your Devin API key.",
    )
  }
}

// Format structured output for better readability
function formatStructuredOutput(output: any): string {
  if (!output) return "No output available"

  try {
    if (typeof output === "string") {
      return output
    }

    // If it's an array, format each item
    if (Array.isArray(output)) {
      return output
        .map((item, index) => {
          if (typeof item === "object") {
            return `${index + 1}. ${JSON.stringify(item, null, 2)}`
          }
          return `${index + 1}. ${item}`
        })
        .join("\n\n")
    }

    // If it has specific fields we know about, format them nicely
    if (output.issues || output.suggestions || output.approved !== undefined) {
      let result = ""

      if (output.issues && Array.isArray(output.issues)) {
        result += "📋 Issues:\n"
        result += output.issues
          .map(
            (issue: any, i: number) =>
              `${i + 1}. ${issue.file ? `[${issue.file}` : ""}${issue.line ? `:${issue.line}] ` : ""}${issue.description || issue.message || JSON.stringify(issue)}`,
          )
          .join("\n")
        result += "\n\n"
      }

      if (output.suggestions && Array.isArray(output.suggestions)) {
        result += "💡 Suggestions:\n"
        result += output.suggestions
          .map(
            (suggestion: any, i: number) =>
              `${i + 1}. ${typeof suggestion === "string" ? suggestion : JSON.stringify(suggestion)}`,
          )
          .join("\n")
        result += "\n\n"
      }

      if (output.approved !== undefined) {
        result += `✅ Approved: ${output.approved ? "Yes" : "No"}\n\n`
      }

      return result.trim()
    }

    // Default to pretty JSON
    return JSON.stringify(output, null, 2)
  } catch (e) {
    console.error("Error formatting output:", e)
    return JSON.stringify(output)
  }
}

// Poll for session updates
async function pollSessionUpdates(ctx: Context, userId: number, sessionId: string): Promise<void> {
  let lastStatus: string | null = null
  let lastOutput: any = null

  const intervalId = setInterval(async () => {
    try {
      // Check if the user still has an active session
      const userSession = await sessionStore.getSession(userId)
      if (!userSession || userSession.devinSessionId !== sessionId) {
        clearInterval(intervalId)
        return
      }

      // Get the session details
      const sessionDetails = await getDevinSessionDetails(sessionId)

      // Check if the status has changed
      if (sessionDetails.status !== lastStatus) {
        lastStatus = sessionDetails.status

        // Send a status update
        await ctx.reply(`📊 Status update: ${sessionDetails.status}`)

        // If the session is no longer running, stop polling
        if (sessionDetails.status_enum !== "RUNNING") {
          clearInterval(intervalId)

          // Send a final message
          if (sessionDetails.status_enum === "stopped") {
            await ctx.reply(
              `✅ Session completed!\n\n` +
                `🔗 View results: ${userSession.devinSessionUrl}\n\n` +
                `To start a new session, use /new or just send a new message.`,
            )
          } else if (sessionDetails.status_enum === "blocked") {
            await ctx.reply(
              `⚠️ Devin needs your input!\n\n` +
                `🔗 Please check the session: ${userSession.devinSessionUrl}\n\n` +
                `Or send a message here with your response.`,
            )
          }
        }
      }

      // Check if there's new structured output
      if (
        sessionDetails.structured_output &&
        JSON.stringify(sessionDetails.structured_output) !== JSON.stringify(lastOutput)
      ) {
        lastOutput = sessionDetails.structured_output

        // Format and send the structured output
        const formattedOutput = formatStructuredOutput(sessionDetails.structured_output)
        await ctx.reply(`📝 Update from Devin:\n\n${formattedOutput}`)
      }
    } catch (error) {
      console.error("Error polling session updates:", error)
      clearInterval(intervalId)
    }
  }, 10000) // Poll every 10 seconds
}

// Handle the /start command
export async function handleStartCommand(ctx: Context): Promise<void> {
  await ctx.reply(
    "👋 Welcome to the Devin Telegram Bot!\n\n" +
      "I can help you interact with Devin AI directly from Telegram.\n\n" +
      "🚀 To get started, simply send me a message describing what you want Devin to do.\n\n" +
      "Type /help to see all available commands.",
  )
}

// Handle the /help command
export async function handleHelpCommand(ctx: Context): Promise<void> {
  await ctx.reply(
    "🤖 Devin Telegram Bot - Help\n\n" +
      "Available commands:\n\n" +
      "/start - Welcome message and introduction\n" +
      "/help - Show this help message\n" +
      "/status - Check the status of your current session\n" +
      "/new - Start a new session (clears the current one)\n" +
      "/reset - Reset your current session\n\n" +
      "How to use:\n" +
      "1. Send a message describing what you want Devin to do\n" +
      "2. Wait for Devin to process your request\n" +
      "3. Send follow-up messages to provide more information\n" +
      "4. Use /status to check progress at any time",
  )
}

// Handle the /status command
export async function handleStatusCommand(ctx: Context): Promise<void> {
  const userId = ctx.from?.id

  if (!userId) {
    return
  }

  if (!(await sessionStore.hasActiveSession(userId))) {
    await ctx.reply("❌ You don't have an active session.\n\n" + "Send a message to create a new Devin session.")
    return
  }

  const userSession = await sessionStore.getSession(userId)
  if (!userSession) {
    return
  }

  try {
    // Get the session details
    const sessionDetails = await getDevinSessionDetails(userSession.devinSessionId)

    // Format the last interaction time
    const lastInteraction = new Date(userSession.lastInteractionTime)
    const timeAgo = getTimeAgo(lastInteraction)

    // Send the status
    await ctx.reply(
      `📊 Session Status\n\n` +
        `ID: ${userSession.devinSessionId}\n` +
        `Status: ${sessionDetails.status}\n` +
        `Last interaction: ${timeAgo}\n` +
        `Created: ${new Date(sessionDetails.created_at).toLocaleString()}\n\n` +
        `🔗 View in browser: ${userSession.devinSessionUrl}\n\n` +
        (sessionDetails.structured_output
          ? `📝 Latest output:\n\n${formatStructuredOutput(sessionDetails.structured_output)}`
          : "No structured output available yet."),
    )
  } catch (error) {
    console.error("Error getting session status:", error)
    await ctx.reply(
      "❌ Failed to get session status. The session might have expired.\n\n" +
        "You can use /reset to start a new session.",
    )
  }
}

// Handle the /new command
export async function handleNewCommand(ctx: Context): Promise<void> {
  const userId = ctx.from?.id

  if (!userId) {
    return
  }

  // Clear any existing session
  if (await sessionStore.hasActiveSession(userId)) {
    await sessionStore.removeSession(userId)
  }

  await ctx.reply(
    "🆕 Ready to start a new session!\n\n" + "Please send a message describing what you want Devin to do.",
  )
}

// Handle the /reset command
export async function handleResetCommand(ctx: Context): Promise<void> {
  const userId = ctx.from?.id

  if (!userId) {
    return
  }

  if (await sessionStore.hasActiveSession(userId)) {
    await sessionStore.removeSession(userId)
    await ctx.reply(
      "🔄 Your session has been reset.\n\n" + "You can start a new conversation with Devin by sending a message.",
    )
  } else {
    await ctx.reply("You don't have an active session.")
  }
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) {
    return `${diffSec} seconds ago`
  }

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`
  }

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) {
    return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`
  }

  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`
}

