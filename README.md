# 🎂 Bad with Dates

> **Never forget an anniversary, birthday, or milestone again.**
> An autonomous celebration tracking app featuring WhatsApp number authentication, AI occasion photo styling, personalized wish generation, and a 24/7 background scheduler daemon that dispatches wishes even when your browser is closed.

---

## 🚀 Features

- **WhatsApp Number Login**: Secure phone OTP verification so wishes are prepared and dispatched on behalf of your number.
- **24/7 Autonomous Background Cloud Daemon**: Background server scheduler dispatches scheduled wishes (e.g. 12:01 AM Midnight Surprise) even when all browser tabs are closed.
- **AI Occasion Photo Studio**: Decorate photos with hats, crowns, confetti borders, polaroids, stickers, and AI greeting banners.
- **Smart Wish Generator**: Tailored wishes powered by Gemini with tones (Heartfelt, Roast, Punchy, Poetic, Champagne).
- **Neo-Brutalist / Bauhaus Design**: Vibrant amber dot canvas, cream card surfaces, hard black drop shadows, and responsive layout across mobile phones and desktop.
- **Integrated Push & Calendar Sync**: Browser notifications, harmonic celebration chimes, and `.ics` calendar sync for Apple, Google, and Outlook.

---

## 🛠️ Deploying with GitHub

Because **Bad with Dates** has both a React frontend and an Express backend running the 24/7 autonomous background daemon, deploy it to a Node-compatible hosting service:

### Option 1: Render (Recommended - Free & Easy)
1. Push this repository to your GitHub account (see instructions below).
2. Go to [render.com](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml`:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = *your Google Gemini API key*
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**!

---

### Option 2: Railway
1. Go to [railway.app](https://railway.app) and select **New Project > Deploy from GitHub repo**.
2. Select your repository.
3. Add the `GEMINI_API_KEY` variable under settings.
4. Railway will automatically build and deploy using the `Dockerfile` or `npm start`.

---

### Option 3: Docker / Google Cloud Run / Fly.io
The included `Dockerfile` builds a production image with zero extra configuration:
```bash
docker build -t bad-with-dates .
docker run -p 3000:3000 -e GEMINI_API_KEY="your_api_key_here" bad-with-dates
```

---

## 📦 How to Push this Code to GitHub

### Method A: Using Git CLI

1. Create a new empty repository on [GitHub](https://github.com/new) (e.g. `bad-with-dates`).
2. Run the following commands in your terminal:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit of Bad with Dates app"

# Rename branch to main
git branch -M main

# Link to your new GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/bad-with-dates.git

# Push code to GitHub
git push -u origin main
```

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for AI wish generation and photo styling. |
| `PORT` | Port for the server (defaults to `3000`). |
| `NODE_ENV` | `production` or `development`. |

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run full-stack dev server (Express + Vite)
npm run dev

# Run type check and lint
npm run lint

# Build production distribution
npm run build

# Start production server
npm start
```
