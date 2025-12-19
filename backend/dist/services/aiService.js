"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestedQuestions = exports.getAIInsights = exports.aggregateLaporanData = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const models_1 = require("../models");
const openai = new openai_1.default({
    apiKey: config_1.config.openai.apiKey,
});
/**
 * Aggregate laporan data untuk AI context
 */
const aggregateLaporanData = async () => {
    try {
        // Get current month/year
        const now = new Date();
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const currentMonth = months[now.getMonth()];
        const currentYear = now.getFullYear();
        // Get all laporan dengan includes
        const laporan = await models_1.Laporan.findAll({
            where: {
                bulan: currentMonth,
                tahun: currentYear,
            },
            include: [
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    include: [
                        {
                            model: models_1.Kegiatan,
                            as: 'kegiatanParent',
                        }
                    ]
                },
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['nama_puskesmas', 'nama']
                },
                {
                    model: models_1.SumberAnggaran,
                    as: 'sumberAnggaran',
                    attributes: ['sumber']
                }
            ]
        });
        // Group by sub kegiatan
        const kegiatanMap = new Map();
        const sumberAnggaranMap = new Map();
        const puskesmasPerformance = new Map();
        for (const lap of laporan) {
            const kegiatanName = lap.subKegiatan?.kegiatanParent?.kegiatan || 'Unknown';
            const sumberName = lap.sumberAnggaran?.sumber || 'Unknown';
            const puskesmasName = lap.user?.nama_puskesmas || 'Unknown';
            // Group by kegiatan
            if (!kegiatanMap.has(kegiatanName)) {
                kegiatanMap.set(kegiatanName, {
                    name: kegiatanName,
                    totalTarget: 0,
                    totalRealisasi: 0,
                    count: 0,
                    puskesmasSet: new Set(),
                });
            }
            const k = kegiatanMap.get(kegiatanName);
            k.totalTarget += lap.target_k || 0;
            k.totalRealisasi += lap.realisasi_k || 0;
            k.count += 1;
            k.puskesmasSet.add(puskesmasName);
            // Group by sumber anggaran
            if (!sumberAnggaranMap.has(sumberName)) {
                sumberAnggaranMap.set(sumberName, {
                    name: sumberName,
                    totalTarget: 0,
                    totalRealisasi: 0,
                    kegiatan: new Set(),
                });
            }
            const s = sumberAnggaranMap.get(sumberName);
            s.totalTarget += lap.target_rp || 0;
            s.totalRealisasi += lap.realisasi_rp || 0;
            s.kegiatan.add(kegiatanName);
            // Group by puskesmas
            if (!puskesmasPerformance.has(puskesmasName)) {
                puskesmasPerformance.set(puskesmasName, {
                    totalRealisasi: 0,
                    totalTarget: 0,
                    count: 0,
                });
            }
            const p = puskesmasPerformance.get(puskesmasName);
            p.totalTarget += lap.target_k || 0;
            p.totalRealisasi += lap.realisasi_k || 0;
            p.count += 1;
        }
        // Calculate percentages and format
        const kegiatanArray = Array.from(kegiatanMap.values()).map((k) => ({
            name: k.name,
            totalTarget: k.totalTarget,
            totalRealisasi: k.totalRealisasi,
            persentase: k.totalTarget > 0 ? Math.round((k.totalRealisasi / k.totalTarget) * 100) : 0,
            puskesmasCount: k.puskesmasSet.size,
            status: Math.round((k.totalRealisasi / k.totalTarget) * 100) >= 70 ? 'On Track' : 'Below Target',
        }));
        const sumberAnggaranArray = Array.from(sumberAnggaranMap.values()).map((s) => ({
            name: s.name,
            totalTarget: s.totalTarget,
            totalRealisasi: s.totalRealisasi,
            persentase: s.totalTarget > 0 ? Math.round((s.totalRealisasi / s.totalTarget) * 100) : 0,
            kegiatan: Array.from(s.kegiatan),
        }));
        // Identify top and low performers
        const performers = Array.from(puskesmasPerformance.entries()).map(([name, data]) => ({
            name,
            persentase: data.totalTarget > 0 ? Math.round((data.totalRealisasi / data.totalTarget) * 100) : 0,
        }));
        performers.sort((a, b) => b.persentase - a.persentase);
        const topPerformers = performers.slice(0, 3).map(p => `${p.name} (${p.persentase}%)`);
        const lowPerformers = performers.slice(-3).map(p => `${p.name} (${p.persentase}%)`);
        // Get previous month data for comparison
        const prevMonthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevMonth = months[prevMonthIndex];
        const prevYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
        const prevLaporan = await models_1.Laporan.count({
            where: {
                bulan: prevMonth,
                tahun: prevYear,
            }
        });
        return {
            month: currentMonth,
            year: currentYear,
            totalLaporan: laporan.length,
            kegiatan: kegiatanArray,
            sumberAnggaran: sumberAnggaranArray,
            topPerformers,
            lowPerformers,
            trends: {
                comparison: laporan.length > prevLaporan ? 'meningkat' : laporan.length < prevLaporan ? 'menurun' : 'sama',
                improvement: laporan.length > prevLaporan
                    ? `${laporan.length - prevLaporan} lebih banyak dari bulan lalu`
                    : prevLaporan > laporan.length
                        ? `${prevLaporan - laporan.length} lebih sedikit dari bulan lalu`
                        : 'sama dengan bulan lalu'
            }
        };
    }
    catch (error) {
        console.error('Error aggregating laporan data:', error);
        throw error;
    }
};
exports.aggregateLaporanData = aggregateLaporanData;
/**
 * Get AI insights dengan context laporan
 */
const getAIInsights = async (userQuestion) => {
    try {
        // Aggregate data
        const laporanData = await (0, exports.aggregateLaporanData)();
        // Build system prompt
        const systemPrompt = `Anda adalah analis kesehatan publik berpengalaman untuk sistem evaluasi kinerja puskesmas (E-EVKIN). 
Anda memiliki pengetahuan mendalam tentang:
- Analisis performa kesehatan masyarakat
- Target vs realisasi kegiatan kesehatan
- Optimasi penyerapan anggaran kesehatan
- Strategi peningkatan kinerja puskesmas

Anda diminta memberikan insights, rekomendasi, dan analisis berdasarkan data laporan yang diberikan.
Jawaban harus:
- Konkret dan actionable
- Berbahasa Indonesia profesional
- Data-driven dengan referensi angka dari laporan
- Fokus pada solusi peningkatan performa
- Singkat namun informatif (max 3-4 paragraf)`;
        const userPrompt = `
Data Laporan Terkini (Bulan: ${laporanData.month} ${laporanData.year}):

RINGKASAN:
- Total Laporan Masuk: ${laporanData.totalLaporan}
- Trend: ${laporanData.trends.comparison.charAt(0).toUpperCase() + laporanData.trends.comparison.slice(1)} (${laporanData.trends.improvement})

KEGIATAN PERFORMA:
${laporanData.kegiatan.map(k => `- ${k.name}: ${k.persentase}% (Target: ${k.totalTarget}, Realisasi: ${k.totalRealisasi}) - ${k.status}`).join('\n')}

SUMBER ANGGARAN:
${laporanData.sumberAnggaran.map(s => `- ${s.name}: ${s.persentase}% (Target: Rp${s.totalTarget.toLocaleString()}, Realisasi: Rp${s.totalRealisasi.toLocaleString()})`).join('\n')}

PERFORMA PUSKESMAS:
Top Performers: ${laporanData.topPerformers.join(', ')}
Low Performers: ${laporanData.lowPerformers.join(', ')}

PERTANYAAN ADMIN:
${userQuestion}

Berikan analisis dan rekomendasi konkret berdasarkan data di atas.`;
        // Call OpenAI
        const message = await openai.chat.completions.create({
            model: config_1.config.openai.model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userPrompt,
                }
            ],
            temperature: 0.7,
            max_tokens: 800,
        });
        const response = message.choices[0]?.message?.content || 'Tidak ada response dari AI';
        return response;
    }
    catch (error) {
        console.error('Error calling OpenAI:', error);
        throw new Error(`AI Service Error: ${error.message}`);
    }
};
exports.getAIInsights = getAIInsights;
/**
 * Get suggested questions untuk dashboard
 */
const getSuggestedQuestions = () => {
    return [
        'Kegiatan mana yang perlu perhatian khusus untuk mencapai 70% penyerapan?',
        'Bagaimana strategi untuk meningkatkan performa puskesmas yang masih di bawah target?',
        'Analisis keseluruhan alokasi anggaran per sumber dana, mana yang paling efektif?',
        'Prediksi: kegiatan mana yang paling mungkin mencapai target bulan depan?',
        'Rekomendasi realokasi anggaran untuk optimasi penyerapan?',
    ];
};
exports.getSuggestedQuestions = getSuggestedQuestions;
//# sourceMappingURL=aiService.js.map