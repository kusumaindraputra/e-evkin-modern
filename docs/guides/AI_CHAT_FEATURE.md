# AI Chat Feature - Setup & Implementation Guide

## 📋 Overview

Admin users dapat menggunakan **AI Chat Assistant** di Dashboard untuk mendapatkan insights real-time tentang:
- Analisis performa kegiatan vs target
- Strategi peningkatan penyerapan anggaran
- Rekomendasi kegiatan yang perlu prioritas
- Perbandingan performa puskesmas
- Prediksi dan forecasting

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install openai@^4.47.2
```

### 2. Environment Variables

Tambahkan ke file `.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
```

**Dapatkan API Key:**
1. Buka https://platform.openai.com/api-keys
2. Login dengan akun OpenAI Anda
3. Klik "Create new secret key"
4. Copy key dan simpan di `.env`

### 3. Verify Backend Routes

Routes berikut sudah otomatis ditambahkan:

- `POST /api/admin/chat` - Send question ke AI
- `GET /api/admin/suggested-questions` - Get recommended questions
- `GET /api/admin/chat/context` - Get laporan context data

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install react-markdown@^9.0.1
```

### 2. Verify Component Integration

ChatWidget sudah terintegrasi ke **DashboardPage** dan menampilkan:
- Compact UI di atas statistik laporan
- Message history dengan timestamp
- Suggested questions yang selalu tersedia
- Markdown support untuk response AI

## 🚀 How to Use

### Admin Dashboard

1. **Login** sebagai admin user
2. Buka halaman **Dashboard** (`/dashboard`)
3. Lihat **AI Insights Assistant** di bagian atas (di atas statistik)
4. Ada 3 cara bertanya:

#### Option A: Gunakan Suggested Questions
- Klik salah satu pertanyaan yang disarankan
- AI langsung memberikan insight

#### Option B: Tanya Sendiri
- Ketik pertanyaan di input field
- Tekan Enter atau klik tombol Send
- Tunggu AI memproses

#### Option C: Expand Chat
- Klik pada ChatWidget untuk view lebih lengkap
- Lihat full conversation history
- Explore lebih banyak suggested questions

### Example Questions

```
"Kegiatan mana yang perlu perhatian khusus untuk mencapai 70% penyerapan?"
"Bagaimana strategi untuk meningkatkan performa puskesmas yang masih di bawah target?"
"Analisis keseluruhan alokasi anggaran per sumber dana, mana yang paling efektif?"
"Prediksi: kegiatan mana yang paling mungkin mencapai target bulan depan?"
"Rekomendasi realokasi anggaran untuk optimasi penyerapan?"
```

## 🔐 Security

- ✅ **Authentication Required**: Hanya authenticated users
- ✅ **Admin Only**: Hanya admin users yang bisa akses chat
- ✅ **Secure API**: All API calls use JWT tokens
- ✅ **API Key Protection**: OpenAI API key hanya di backend (hidden from frontend)

## 📊 Data Context

AI menggunakan data real-time dari:

### Current Month Analysis
```
- Total laporan masuk
- Per-kegiatan performa (target vs realisasi)
- Per-sumber-anggaran analysis
- Per-puskesmas performance ranking
```

### Trend Analysis
```
- Month-over-month comparison
- Top performers
- Low performers
- Overall absorption percentage
```

### Response Format

AI memberikan response dalam format:
- **Konkret**: Data-driven dengan angka spesifik
- **Actionable**: Rekomendasi yang bisa diimplementasikan
- **Indonesian**: Berbahasa Indonesia profesional
- **Structured**: Organized dalam paragraf dan bullet points

## 🔄 Data Flow

```
User Question
     ↓
[Frontend] ChatWidget captures input
     ↓
[API] POST /api/admin/chat (with auth)
     ↓
[Backend] aiService.aggregateLaporanData()
     ↓
Query all laporan + build context
     ↓
OpenAI API with system prompt + context
     ↓
AI generates insight
     ↓
Response back to frontend
     ↓
Display in ChatWidget with markdown
```

## 📝 System Prompt

AI diatur dengan system prompt khusus untuk kesehatan publik:

```
"Anda adalah analis kesehatan publik berpengalaman untuk sistem 
evaluasi kinerja puskesmas (E-EVKIN). Anda memiliki pengetahuan 
mendalam tentang analisis performa kesehatan masyarakat, target vs 
realisasi kegiatan, optimasi penyerapan anggaran, dan strategi 
peningkatan kinerja puskesmas."
```

## 🛠️ Customization

### Ubah Suggested Questions

Edit file: `backend/src/services/aiService.ts`

```typescript
export const getSuggestedQuestions = (): string[] => {
  return [
    'Your custom question 1?',
    'Your custom question 2?',
    // ...
  ];
};
```

### Ubah Model AI

Edit `.env`:
```env
OPENAI_MODEL=gpt-4-turbo  # atau gpt-3.5-turbo untuk lebih cepat/murah
```

### Adjust Temperature (Kreativitas Response)

Edit `aiService.ts`:
```typescript
const message = await openai.chat.completions.create({
  // ...
  temperature: 0.5,  // 0 = deterministic, 1 = creative
  // ...
});
```

## ⚡ Performance Tips

### Cost Optimization
- **Model**: `gpt-3.5-turbo` lebih murah dari `gpt-4` (tapi sedikit less powerful)
- **Tokens**: Response sudah dibatasi `max_tokens: 800` untuk efisiensi
- **Context**: Hanya load data saat ada pertanyaan (bukan real-time polling)

### Speed Optimization
- Data aggregation cached di response (tidak di-recompute setiap kali)
- Responses average 2-5 detik
- Suggestion questions load asynchronously

## 🐛 Troubleshooting

### "Failed to get AI insights"

**Problem**: API key tidak valid atau tidak set

**Solution**:
```bash
# Check .env file exists dan OPENAI_API_KEY ada
cat .env | grep OPENAI_API_KEY

# Verify API key di https://platform.openai.com/api-keys
# Recreate key jika sudah expired
```

### "AI sedang memproses..." terlalu lama

**Problem**: API timeout atau network issue

**Solution**:
- Check internet connection
- Verify OpenAI API status: https://status.openai.com
- Reduce data range (filter by month)

### Response tidak relevant

**Problem**: Prompt engineering perlu ditingkatkan

**Solution**:
1. Update system prompt di `aiService.ts`
2. Test dengan berbagai pertanyaan
3. Adjust `temperature` untuk berbeda kreativitas
4. Consider menggunakan `gpt-4` untuk lebih akurat

## 📚 Related Files

```
Backend:
  - backend/src/services/aiService.ts (Main AI logic)
  - backend/src/routes/chat.routes.ts (Chat endpoints)
  - backend/src/config/index.ts (Config dengan OpenAI)

Frontend:
  - frontend/src/components/ChatWidget.tsx (Chat component)
  - frontend/src/components/ChatWidget.css (Styling)
  - frontend/src/pages/DashboardPage.tsx (Integration point)

Config:
  - .env (OpenAI API key)
```

## 📞 Support

Jika ada issues:
1. Check logs: `npm run dev:backend`
2. Verify API key di https://platform.openai.com
3. Check OpenAI API status
4. Review error messages di browser console (F12)

---

**Last Updated**: December 20, 2025  
**Version**: 1.0.0
