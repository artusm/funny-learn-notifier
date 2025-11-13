
/**
 * Cloudflare Worker for generating memes and sending them to Telegram.
 * Supports cron triggers and manual HTTP requests.
 */

/**
 * Generates an image using OpenAI DALL-E API
 * @param {string} prompt - The image generation prompt
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<{imageUrl: string, revisedPrompt?: string}>}
 */
async function generateImageWithOpenAI(prompt, apiKey) {
	const response = await fetch("https://api.openai.com/v1/images/generations", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: "dall-e-3",
			prompt: prompt,
			n: 1,
			size: "1024x1024",
			quality: "standard",
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OpenAI API error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	return {
		imageUrl: data.data[0].url,
		revisedPrompt: data.data[0].revised_prompt,
	};
}

/**
 * Generates an image using OpenRouter API
 * @param {string} prompt - The image generation prompt
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<{imageUrl: string, revisedPrompt?: string}>}
 */
async function generateImageWithOpenRouter(prompt, apiKey) {
	const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
			"HTTP-Referer": "https://github.com/your-repo", // Optional: replace with your site
			"X-Title": "Learn Notifier", // Optional: replace with your app name
		},
		body: JSON.stringify({
			model: "dall-e-3",
			prompt: prompt,
			n: 1,
			size: "1024x1024",
			quality: "standard",
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	return {
		imageUrl: data.data[0].url,
		revisedPrompt: data.data[0].revised_prompt,
	};
}

/**
 * Generates a meme prompt about motivating a colleague to study frontend development
 * @returns {string} A meme prompt
 */
function generateMemePrompt() {
	const memeTemplates = [
		"Create a funny motivational meme showing a person with dark short hair studying frontend development with text overlay saying 'Study or face the soldering iron!' in a humorous way",
		"Generate a meme with a Kazakh person with dark short hair looking at code, with text 'HR to Frontend: Study or we'll get the whip!' as a playful threat",
		"Create a humorous meme showing someone procrastinating on learning frontend, with text overlay 'The soldering iron is waiting... better start studying!'",
		"Generate a funny meme with a person with dark short hair holding a soldering iron menacingly, with text 'Frontend development or else...' as a joke",
		"Create a motivational meme showing a person switching from HR to frontend development, with text 'Study hard or face the consequences!' in a playful way",
		"Generate a meme with someone with dark short hair being chased by a soldering iron, with text overlay 'When you don't study frontend: The consequences are coming!'",
		"Create a funny meme showing a lazy person avoiding coding practice, with text 'HR colleague: Study frontend or the pole and whip await!'",
		"Generate a humorous meme with a Kazakh person with dark short hair coding, with text overlay 'From HR to Frontend: Study or suffer!' as a joke",
		"Create a meme showing someone being motivated to study with a soldering iron in the background, with text 'Frontend development: Study now or regret later!'",
		"Generate a funny motivational meme with a person with dark short hair looking at JavaScript tutorials, with text 'The soldering iron remembers... study frontend!'",
	];

	const randomTemplate = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];
	return randomTemplate;
}

/**
 * Generates a funny caption text for the meme
 * @returns {string} A caption text
 */
function generateMemeCaption() {
	const captions = [
		"Study frontend or the soldering iron awaits! 🔥",
		"HR to Frontend transition: Study hard or face the consequences! 😄",
		"Remember: The whip and pole are watching... time to study! 📚",
		"Frontend development won't learn itself! Better start studying! 💻",
		"The soldering iron remembers... study or else! ⚡",
		"From HR to Frontend: Study now, thank yourself later! 🚀",
		"Procrastination detected! Time to study frontend! 📖",
		"The consequences of not studying are coming... better start coding! 😅",
		"HR colleague, the frontend path requires study! No excuses! 💪",
		"Study frontend development or the soldering iron will find you! 🔧",
	];

	return captions[Math.floor(Math.random() * captions.length)];
}

/**
 * Downloads an image from a URL
 * @param {string} imageUrl - URL of the image to download
 * @returns {Promise<ArrayBuffer>} Image data as ArrayBuffer
 */
async function downloadImage(imageUrl) {
	const response = await fetch(imageUrl);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.status}`);
	}
	return await response.arrayBuffer();
}

/**
 * Sends an image to Telegram chat
 * @param {ArrayBuffer} imageData - Image data as ArrayBuffer
 * @param {string} caption - Caption text for the image
 * @param {string} botToken - Telegram bot token
 * @param {string} chatId - Telegram chat ID
 * @returns {Promise<void>}
 */
async function sendImageToTelegram(imageData, caption, botToken, chatId) {
	// Convert ArrayBuffer to Blob
	const blob = new Blob([imageData], { type: "image/png" });
	const formData = new FormData();
	formData.append("photo", blob, "meme.png");
	formData.append("caption", caption);
	formData.append("chat_id", chatId);

	const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Telegram API error: ${response.status} - ${error}`);
	}
}

/**
 * Main handler for generating and sending memes
 * @param {Object} env - Environment variables
 * @returns {Promise<Response>}
 */
async function handleMemeGeneration(env) {
	try {
		// Validate configuration
		const provider = env.IMAGE_API_PROVIDER || "openai";
		const telegramBotToken = env.TELEGRAM_BOT_TOKEN;
		const telegramChatId = env.TELEGRAM_CHAT_ID;

		if (!telegramBotToken || !telegramChatId) {
			throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured");
		}

		// Generate meme prompt
		const prompt = generateMemePrompt();

		// Generate image based on provider
		let imageResult;
		if (provider === "openrouter") {
			const apiKey = env.OPENROUTER_API_KEY;
			if (!apiKey) {
				throw new Error("OPENROUTER_API_KEY must be configured when using OpenRouter");
			}
			imageResult = await generateImageWithOpenRouter(prompt, apiKey);
		} else {
			// Default to OpenAI
			const apiKey = env.OPENAI_API_KEY;
			if (!apiKey) {
				throw new Error("OPENAI_API_KEY must be configured when using OpenAI");
			}
			imageResult = await generateImageWithOpenAI(prompt, apiKey);
		}

		// Download the image
		const imageData = await downloadImage(imageResult.imageUrl);

		// Create caption with funny text
		const caption = generateMemeCaption();

		// Send to Telegram
		await sendImageToTelegram(imageData, caption, telegramBotToken, telegramChatId);

		return new Response(
			JSON.stringify({
				success: true,
				message: "Meme generated and sent to Telegram successfully",
				prompt: prompt,
				revisedPrompt: imageResult.revisedPrompt,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error generating meme:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

/**
 * Cloudflare Worker export interface.
 * Handles incoming HTTP requests and cron triggers.
 */
export default {
	/**
	 * Main fetch handler for the Cloudflare Worker.
	 * @param {Request} request - The incoming HTTP request
	 * @param {Object} env - Environment bindings (secrets, KV namespaces, etc.)
	 * @param {ExecutionContext} ctx - Execution context for managing async operations
	 * @returns {Promise<Response>} HTTP response
	 */
	async fetch(request, env, ctx) {
		// Handle manual trigger via HTTP request
		if (request.method === "POST" || request.method === "GET") {
			return handleMemeGeneration(env);
		}

		return new Response("Method not allowed", { status: 405 });
	},

	/**
	 * Cron trigger handler.
	 * This is called automatically by Cloudflare Workers based on the cron schedule.
	 * @param {ScheduledEvent} event - The scheduled event
	 * @param {Object} env - Environment bindings
	 * @param {ExecutionContext} ctx - Execution context
	 * @returns {Promise<void>}
	 */
	async scheduled(event, env, ctx) {
		ctx.waitUntil(handleMemeGeneration(env));
	},
};

