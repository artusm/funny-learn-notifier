# Learn Notifier

A Cloudflare Worker that automatically generates motivational memes using AI image generation (OpenAI DALL-E or OpenRouter) and sends them to a Telegram chat via cron triggers. Perfect for playfully reminding colleagues to study! 😄

## Features

- 🤖 **Automated Cron Jobs**: Runs on a schedule (default: daily at 9 AM UTC)
- 🎨 **AI Image Generation**: Supports both OpenAI DALL-E 3 and OpenRouter APIs
- 📱 **Telegram Integration**: Sends generated memes directly to Telegram chats
- 🎯 **Custom Meme Prompts**: Generates memes with specific themes and descriptions
- 🔧 **Configurable**: Easy to switch between API providers and customize settings
- 🚀 **Manual Trigger**: Can be triggered via HTTP requests for testing

## Prerequisites

- Node.js 18+ and npm/yarn
- Cloudflare account
- OpenAI API key OR OpenRouter API key
- Telegram bot token (get from [@BotFather](https://t.me/BotFather))
- Telegram chat ID (get from [@userinfobot](https://t.me/userinfobot))

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd learn-notifier
yarn install  # or npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
IMAGE_API_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### 3. Configure Cloudflare Worker

Update `wrangler.jsonc`:

1. Set your Cloudflare `account_id`
2. Adjust the cron schedule if needed (default: `"0 9 * * *"` = daily at 9 AM UTC)
3. Set environment variables in the `vars` section (or use Cloudflare dashboard)

### 4. Get Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Copy the bot token provided

### 5. Get Telegram Chat ID

#### For Personal Chats (Direct Messages):

1. Start a chat with your bot
2. Send a message to your bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat.id` value in the response (positive number)

#### For Group Chats (Recommended):

**Method 1 - Using @userinfobot (Easiest):**

1. Add [@userinfobot](https://t.me/userinfobot) to your group
2. Send any message in the group
3. The bot will reply with the chat ID (usually a negative number like `-1001234567890`)

**Method 2 - Using getUpdates API:**

1. Add your bot to the group
2. Send a message in the group (mention the bot or have it read messages)
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat.id` value in the response
   - Group chats have **negative IDs** (e.g., `-1001234567890`)
   - Personal chats have **positive IDs** (e.g., `123456789`)

**Note:** Make sure your bot has permission to read messages in the group for Method 2 to work.

## Development

### Run Locally

```bash
# Development mode with hot reload
yarn dev

# Production mode
yarn start
```

### Test Manually

Once running locally, you can trigger the meme generation:

```bash
# GET request
curl http://localhost:8787

# POST request
curl -X POST http://localhost:8787
```

### Linting and Formatting

```bash
# Format code
yarn format

# Lint code
yarn lint

# Run tests
yarn test
```

## Deployment

### Deploy to Cloudflare Workers

1. **Install Wrangler CLI** (if not already installed):

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:

   ```bash
   wrangler login
   ```

3. **Set Environment Variables** in Cloudflare Dashboard:

   - Go to your Worker → Settings → Variables
   - Add the following secrets:
     - `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
     - `TELEGRAM_BOT_TOKEN`
     - `TELEGRAM_CHAT_ID`
     - `IMAGE_API_PROVIDER` (optional, defaults to "openai")

4. **Deploy**:
   ```bash
   wrangler deploy
   ```

### Configure Cron Trigger

The cron trigger is configured in `wrangler.jsonc`. The default schedule is `"0 9 * * *"` (daily at 9 AM UTC).

To change the schedule, edit the `triggers.crons` array in `wrangler.jsonc`. Examples:

- `"0 9 * * *"` - Daily at 9 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"0 9 * * 1"` - Every Monday at 9 AM UTC
- `"*/30 * * * *"` - Every 30 minutes

## Configuration

### Environment Variables

| Variable                  | Required | Description                                    | Default        |
| ------------------------- | -------- | ---------------------------------------------- | -------------- |
| `IMAGE_API_PROVIDER`      | No       | API provider: `"openai"` or `"openrouter"`     | `"openai"`     |
| `OPENAI_API_KEY`          | Yes\*    | OpenAI API key                                 | -              |
| `OPENROUTER_API_KEY`      | Yes\*    | OpenRouter API key                             | -              |
| `OPENROUTER_MODEL`        | No       | OpenRouter model (e.g., `"dall-e-3"`)          | `"dall-e-3"`   |
| `TELEGRAM_BOT_TOKEN`      | Yes      | Telegram bot token                             | -              |
| `TELEGRAM_CHAT_ID`        | Yes      | Telegram chat ID                               | -              |
| `MANUAL_TRIGGER_PASSWORD` | Yes\*    | Password for manual HTTP trigger               | -              |
| `ENVIRONMENT`             | No       | Environment: `"development"` or `"production"` | `"production"` |

\*Required based on `IMAGE_API_PROVIDER` selection  
\*\*Required in production mode to prevent abuse. Not needed in development mode.

### API Providers

#### OpenAI (DALL-E 3)

- Get API key: https://platform.openai.com/api-keys
- Uses DALL-E 3 model
- Returns revised prompts

#### OpenRouter

- Get API key: https://openrouter.ai/keys
- Routes to DALL-E 3 via OpenRouter
- May have different pricing
- Model can be configured via `OPENROUTER_MODEL` environment variable
- Default model: `"dall-e-3"`
- Other models may be available (check OpenRouter documentation)

## How It Works

1. **Cron Trigger**: Cloudflare Workers runs the `scheduled` handler based on the cron schedule
2. **Prompt Generation**: A random meme prompt is selected from predefined templates
3. **Image Generation**: The prompt is sent to the configured AI image API (OpenAI or OpenRouter)
4. **Image Download**: The generated image is downloaded from the API
5. **Telegram Send**: The image is sent to Telegram with a funny caption

## API Endpoints

### Manual Trigger

- **GET** `/?password=YOUR_PASSWORD` - Trigger meme generation
- **POST** `/?password=YOUR_PASSWORD` - Trigger meme generation

**Security:**

- In **development mode** (`ENVIRONMENT=development`): Password is not required
- In **production mode** (default): Password is required via query parameter

**Example:**

```bash
# Production (password required)
curl "https://your-worker.workers.dev/?password=your_secure_password"

# Development (no password needed)
curl "http://localhost:8787"
```

Response format:

```json
{
  "success": true,
  "message": "Meme generated and sent to Telegram successfully",
  "prompt": "...",
  "revisedPrompt": "..."
}
```

## Customization

### Modify Meme Prompts

Edit the `generateMemePrompt()` function in `src/index.js` to customize the meme templates.

### Modify Captions

Edit the `generateMemeCaption()` function in `src/index.js` to customize the Telegram captions.

## Troubleshooting

### Worker Not Running on Schedule

- Check cron syntax in `wrangler.jsonc`
- Verify the worker is deployed: `wrangler deployments list`
- Check Cloudflare dashboard for cron trigger status

### Image Generation Fails

- Verify API key is correct and has sufficient credits
- Check API provider is set correctly (`IMAGE_API_PROVIDER`)
- Review error logs in Cloudflare dashboard

### Telegram Not Receiving Messages

- Verify bot token is correct
- Ensure chat ID is correct (use `getUpdates` endpoint to verify)
- Check that you've started a conversation with the bot
- Verify bot has permission to send messages

### Local Development Issues

- Ensure `wrangler.jsonc` has correct configuration
- Check that environment variables are set in `.env`
- Verify Miniflare is installed: `yarn add -D miniflare`

## License

Private project - All rights reserved

## Contributing

This is a private project. For internal use only.
