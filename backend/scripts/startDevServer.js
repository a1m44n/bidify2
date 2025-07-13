const { spawn } = require('child_process');
const axios = require('axios');
require('dotenv').config();

async function verifyTelegramToken() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    try {
        const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        console.log('✅ Telegram token verified:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Invalid Telegram token:', error.response?.data || error.message);
        return false;
    }
}

async function startDevServer() {
    // Start the Express server
    const server = spawn('node', ['server.js'], {
        cwd: process.cwd(),
        stdio: 'inherit'
    });

    try {
        // Verify token first
        console.log('Verifying Telegram token...');
        const isTokenValid = await verifyTelegramToken();
        
        if (!isTokenValid) {
            throw new Error('Invalid Telegram token. Please check your TELEGRAM_BOT_TOKEN in .env file');
        }

        // Use the existing ngrok URL from .env
        const url = process.env.SERVER_URL;
        console.log(`Using ngrok URL: ${url}`);
        
        // Update the webhook URL with ngrok URL
        console.log('Setting up Telegram webhook...');
        const telegramBot = require('../utils/telegramBot');
        const result = await telegramBot.setWebhook(`${url}/api/telegram/webhook`);
        
        if (result.success) {
            console.log('✅ Telegram webhook set up successfully!');
        } else {
            console.error('❌ Failed to set up Telegram webhook:', result.error);
        }
    } catch (error) {
        console.error('Error setting up webhook:', error);
    }

    // Handle server process cleanup
    process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        server.kill();
        process.exit(0);
    });
}

// Start the server
startDevServer().catch(console.error);