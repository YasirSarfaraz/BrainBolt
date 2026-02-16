# 🔑 How to Get a Valid Gemini API Key

Your current Gemini API key appears to be invalid or expired. Here's how to get a new one:

## Steps to Get API Key

### 1. Go to Google AI Studio
Visit: **https://aistudio.google.com/app/apikey**

### 2. Sign in with Google Account
- Use any Google account (Gmail)
- Accept the terms of service

### 3. Create API Key
- Click "Create API Key" button
- Select "Create API key in new project" (or use existing project)
- Copy the key that appears

### 4. Update Your `.env` File
Replace the current key in `.env`:

```bash
# OLD (invalid)
GEMINI_API_KEY="AIzaSyCuTDx_KZGBzqY72Urzf51UBpnOojxWpxw"

# NEW (from Google AI Studio)
GEMINI_API_KEY="AIzaSy..."  # Your new key here
```

### 5. Restart Your Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## ✅ Test Your API Key

Run this command to test if it works:

```bash
node -e "const { GoogleGenerativeAI } = require('@google/generative-ai'); const genAI = new GoogleGenerativeAI('YOUR_KEY_HERE'); const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); model.generateContent('Say hello').then(r => console.log('✅ Success:', r.response.text())).catch(e => console.log('❌ Error:', e.message));"
```

Replace `YOUR_KEY_HERE` with your actual key.

## 📝 Important Notes

1. **Free Tier Limits:**
   - 15 requests per minute (RPM)
   - 1 million tokens per minute (TPM)
   - 1,500 requests per day (RPD)

2. **Model Used:**
   - `gemini-1.5-flash` (fast, efficient, free tier available)
   - Switched from `gemini-2.0-flash` which may not be available yet

3. **Security:**
   - Never commit `.env` to Git
   - Use `.env.example` for templates
   - Keep your key secret

## 🚨 What Changed in the Code

I fixed the code to:
1. Use `gemini-1.5-flash` instead of `gemini-2.0-flash` (more stable)
2. Add AI-generated feedback messages (e.g., "Beast mode! 🔥")
3. Add AI explanations for wrong answers
4. Auto-load next question after 5 seconds
5. Show "✨ AI Generated" badge when questions come from Gemini

## 🎯 Once You Have a Valid Key

After updating `.env` with your new key:

1. ✅ Questions will come from Gemini AI (not seed database)
2. ✅ You'll see "✨ AI Generated" badge on questions
3. ✅ You'll get personalized AI feedback messages
4. ✅ Wrong answers will show AI-generated explanations
5. ✅ Auto-next feature will work

---

**Need Help?** Check the browser console (F12) for errors if questions still don't work.
