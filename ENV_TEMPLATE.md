# Environment Variables Template

## Backend Environment Variables
Create `backend/.env` file with:

```env
# Server Configuration
PORT=5001
NODE_ENV=production

# Database Configuration
DATABASE_CLOUD=mongodb+srv://username:password@cluster.mongodb.net/bidify

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Cloudinary Configuration
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
SERVER_URL=https://your-app-name.ondigitalocean.app

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM_NAME=Bidify
SMTP_FROM_EMAIL=your-email@gmail.com

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# CORS Configuration
CLIENT_URL=https://your-app-name.ondigitalocean.app
FRONTEND_URL=https://your-app-name.ondigitalocean.app
```

## Frontend Environment Variables
Create `client/.env` file with:

```env
# Frontend Environment Variables
VITE_API_URL=https://your-app-name.ondigitalocean.app/api
```

## Notes
- Replace all placeholder values with your actual API keys
- Never commit your actual .env files to GitHub
- Your .env files are already ignored by .gitignore 