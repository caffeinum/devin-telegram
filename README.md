# Devin Telegram Bot

A Telegram bot that integrates with the Devin AI API. This bot allows users to create Devin sessions and interact with them directly from Telegram.

## Features

- Create new Devin sessions from Telegram messages
- Send follow-up messages to existing Devin sessions
- Receive status updates and structured output from Devin
- Check session status and history
- Start new sessions with simple commands

## Setup

1. Create a Telegram bot by talking to [@BotFather](https://t.me/BotFather) on Telegram
2. Get your bot token from BotFather
3. Get your Devin API key from the [Devin settings page](https://app.devin.ai/settings)
4. Add the bot token as an environment variable named `BOT_TOKEN` in your Vercel project
5. Add the Devin API key as an environment variable named `DEVIN_API_KEY` in your Vercel project
6. Deploy this project to Vercel
7. Visit your deployed site and use the interface to set up the webhook

## How It Works

This bot uses Telegram's webhook API to receive updates. When a user sends a message to your bot:

1. If it's their first message, the bot creates a new Devin session with that message as the prompt
2. If they already have an active session, the bot sends the message to that session
3. The bot polls the Devin API for updates and sends them back to the user

## Commands

- `/start` - Get a welcome message and introduction
- `/help` - Show all available commands and usage instructions
- `/status` - Check the status of your current session
- `/new` - Start a new session (clears the current one)
- `/reset` - Reset your current session

## User Experience

- Emoji indicators for different message types (status, updates, errors)
- Formatted structured output for better readability
- Links to view sessions in the Devin web interface
- Status updates as Devin works on your task
- Time-ago formatting for session activity

## Development

To run this project locally:

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file with your `BOT_TOKEN` and `DEVIN_API_KEY`
4. Run `npm run dev`
5. Use a tool like ngrok to expose your local server to the internet
6. Set up the webhook using the Telegram API

## License

MIT

