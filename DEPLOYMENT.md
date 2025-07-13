# Bidify - Production Deployment Guide

## 🚀 DigitalOcean App Platform Deployment

### Prerequisites
- GitHub account with your code repository
- DigitalOcean account
- MongoDB Atlas account
- Cloudinary account  
- Telegram Bot Token
- Gmail App Password (for email notifications)
- OpenAI API Key (for suggestions)

### Step 1: Prepare Your Environment Variables

#### Backend Environment Variables
Update `backend/.env` with your actual values:
```env
# Server Configuration
PORT=5001
NODE_ENV=production

# Database Configuration
DATABASE_CLOUD=mongodb+srv://username:password@cluster.mongodb.net/bidify

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-123456789

# Cloudinary Configuration
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
SERVER_URL=https://your-app-name.ondigitalocean.app

# Email Configuration
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

#### Frontend Environment Variables
Update `client/.env` with your actual values:
```env
# Frontend Environment Variables
VITE_API_URL=https://your-app-name.ondigitalocean.app/api
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Production-ready configuration"
git push origin main
```

### Step 3: Deploy on DigitalOcean App Platform

1. **Create App**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Choose "GitHub" as your source
   - Select your repository and `main` branch

2. **Configure Backend Service**
   - **Name**: `bidify-backend`
   - **Source Directory**: `/backend`
   - **Environment**: Node.js
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **Port**: `5001`
   - **Environment Variables**: Add all backend env vars from above

3. **Configure Frontend Service**
   - **Name**: `bidify-frontend`
   - **Source Directory**: `/client`
   - **Environment**: Static Site
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Add `VITE_API_URL`

4. **Configure Routing**
   - Add routes for your frontend:
     - `/` → `index.html`
     - `/api/*` → backend service

### Step 4: Required API Keys & Services

#### MongoDB Atlas
1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get connection string
3. Add your IP to whitelist (or use 0.0.0.0/0 for all IPs)

#### Cloudinary
1. Create account at [Cloudinary](https://cloudinary.com)
2. Get API key, secret, and cloud name
3. Format: `cloudinary://api_key:api_secret@cloud_name`

#### Telegram Bot
1. Create bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Get bot token
3. Set webhook URL to your production domain

#### Gmail App Password
1. Enable 2-factor authentication on Gmail
2. Generate app password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use app password in SMTP_PASS

#### OpenAI API
1. Create account at [OpenAI](https://platform.openai.com)
2. Generate API key
3. Add billing method for usage

### Step 5: Important Configuration Notes

1. **Replace Placeholders**: 
   - `your-app-name` → Your actual app name
   - `username:password` → Your MongoDB credentials
   - All `your-*-here` values → Your actual API keys

2. **Security**:
   - JWT_SECRET should be long and random
   - Never commit real API keys to GitHub
   - Use environment variables for all sensitive data

3. **Domain Configuration**:
   - Update all URL references to your production domain
   - Ensure CORS allows your frontend domain

### Step 6: Testing Deployment

1. **Backend Health Check**:
   ```bash
   curl https://your-app-name.ondigitalocean.app/api/users/health
   ```

2. **Frontend Check**:
   - Visit your app URL
   - Test user registration/login
   - Test product creation
   - Test bidding functionality

### Step 7: Post-Deployment Tasks

1. **Database Setup**:
   - Run category creation script if needed
   - Populate initial data

2. **Monitoring**:
   - Check DigitalOcean logs for errors
   - Monitor MongoDB connections
   - Test all API endpoints

### Common Issues & Solutions

1. **CORS Errors**:
   - Ensure CLIENT_URL matches your frontend domain
   - Check CORS configuration in backend

2. **Database Connection**:
   - Verify MongoDB connection string
   - Check network access settings

3. **File Uploads**:
   - Ensure Cloudinary configuration is correct
   - Check file size limits

4. **Email Not Sending**:
   - Verify Gmail app password
   - Check SMTP configuration

### Environment Variables Checklist

- [ ] DATABASE_CLOUD (MongoDB Atlas)
- [ ] JWT_SECRET (Random string)
- [ ] CLOUDINARY_URL (Cloudinary config)
- [ ] TELEGRAM_BOT_TOKEN (Telegram bot)
- [ ] SMTP_EMAIL & SMTP_PASS (Gmail)
- [ ] OPENAI_API_KEY (OpenAI)
- [ ] All URLs updated to production domain

### Success Indicators

✅ App loads without errors  
✅ User registration/login works  
✅ Product creation works  
✅ Image uploads work  
✅ Bidding functionality works  
✅ Email notifications work  
✅ Telegram notifications work  

## 🎉 Your auction platform is now live!

For support, check:
- DigitalOcean App Platform logs
- MongoDB Atlas monitoring
- Cloudinary usage dashboard 