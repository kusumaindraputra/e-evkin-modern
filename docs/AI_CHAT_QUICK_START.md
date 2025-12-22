# 🚀 AI Chat Quick Start (5 Minutes)

## Step 1️⃣: Get OpenAI API Key (2 min)

```bash
# Visit this URL
https://platform.openai.com/api-keys

# Login with your OpenAI account
# (Create account if needed - free tier available)

# Click "Create new secret key"
# Copy the key (looks like: sk-xxx...)
# ⚠️ Save it somewhere safe - won't show again!
```

## Step 2️⃣: Setup Backend (2 min)

```bash
# Go to backend folder
cd backend

# Install OpenAI SDK
npm install

# Create/open .env file and add:
# OPENAI_API_KEY=sk-your-key-here
# OPENAI_MODEL=gpt-4

# OR just copy from example:
# cp .env.example .env
# Then edit and add your API key
```

## Step 3️⃣: Setup Frontend (1 min)

```bash
# Go to frontend folder
cd frontend

# Install dependencies
npm install
```

## Step 4️⃣: Run & Test! ✅

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (in another terminal)
cd frontend
npm run dev

# Browser
# Visit: http://localhost:5173
# Login as admin user
# Go to /dashboard
# 🤖 ChatWidget appears above statistics!
```

## Done! 🎉

Now you can:
- ✅ Ask AI questions about performa kegiatan
- ✅ Get insights on budget absorption
- ✅ Receive actionable recommendations
- ✅ View suggested questions

---

## 💡 Try These Questions

```
1. "Kegiatan mana yang perlu perhatian khusus untuk mencapai 70% penyerapan?"

2. "Bagaimana strategi untuk meningkatkan performa puskesmas yang masih di bawah target?"

3. "Rekomendasi realokasi anggaran untuk optimasi penyerapan?"

4. "Prediksi: kegiatan mana yang paling mungkin mencapai target bulan depan?"

5. "Analisis keseluruhan alokasi anggaran per sumber dana, mana yang paling efektif?"
```

---

## ⚠️ Common Issues

| Issue | Fix |
|-------|-----|
| "Failed to get AI insights" | Check API key in .env is correct |
| ChatWidget not showing | Restart both backend & frontend |
| "401 Unauthorized" | Make sure you logged in as admin user |
| Timeout on response | Check internet connection & OpenAI status |

---

## 📚 Full Documentation

See: `docs/guides/AI_CHAT_FEATURE.md` for complete setup & customization guide

---

**Questions? Everything working? Great! 🎊**
