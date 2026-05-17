import OpenAI from 'openai';
import { config } from '../config';
import { Laporan, SubKegiatan, Kegiatan, User, SumberAnggaran, Satuan } from '../models';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Interface untuk laporan context
interface LaporanAnalysis {
  month: string;
  year: number;
  totalLaporan: number;
  kegiatan: {
    name: string;
    totalTarget: number;
    totalRealisasi: number;
    persentase: number;
    puskesmasCount: number;
    status: string;
  }[];
  sumberAnggaran: {
    name: string;
    totalTarget: number;
    totalRealisasi: number;
    persentase: number;
    kegiatan: string[];
  }[];
  topPerformers: string[];
  lowPerformers: string[];
  allPuskesmasPerformance: string[];
  detailLaporanByPuskesmas: {
    [puskesmasName: string]: {
      persentase: number;
      kegiatan: Array<{
        nama: string;
        target: number;
        realisasi: number;
        satuan: string;
        persentase: number;
        realisasiRp: number;
        targetRp: number;
        permasalahan: string;
        upaya: string;
      }>;
    };
  };
  trends: {
    comparison: string;
    improvement: string;
  };
  systemContext: {
    totalPuskesmas: number;
    totalKegiatan: number;
    totalSubKegiatan: number;
    sumberAnggaranList: string[];
  };
}

/**
 * Aggregate laporan data untuk AI context
 * Mengumpulkan seluruh data laporan puskesmas untuk analisis AI
 */
export const aggregateLaporanData = async (): Promise<LaporanAnalysis> => {
  try {
    // Get current month/year
    const now = new Date();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();

    // Get system context
    const [totalPuskesmas, totalKegiatan, totalSubKegiatan, sumberAnggaranData] = await Promise.all([
      User.count({ where: { role: 'puskesmas' } }),
      Kegiatan.count(),
      SubKegiatan.count(),
      SumberAnggaran.findAll({ attributes: ['sumber'] })
    ]);

    // Get all laporan dengan includes
    const laporan = await Laporan.findAll({
      where: {
        bulan: currentMonth,
        tahun: currentYear,
      },
      limit: 1000,
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          include: [
            {
              model: Kegiatan,
              as: 'kegiatanParent',
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['nama_puskesmas', 'nama']
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['sumber']
        },
        {
          model: Satuan,
          as: 'satuan',
          attributes: ['satuannya']
        }
      ]
    });

    // Group by sub kegiatan
    const kegiatanMap = new Map();
    const sumberAnggaranMap = new Map();
    const puskesmasPerformance = new Map();

    for (const lap of laporan) {
      const kegiatanName = (lap as any).subKegiatan?.kegiatanParent?.kegiatan || 'Unknown';
      const sumberName = (lap as any).sumberAnggaran?.sumber || 'Unknown';
      const puskesmasName = (lap as any).user?.nama_puskesmas || 'Unknown';

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
          totalRealisasiRp: 0,
          totalTargetRp: 0,
          count: 0,
        });
      }
      const p = puskesmasPerformance.get(puskesmasName);
      p.totalTarget += lap.target_k || 0;
      p.totalRealisasi += lap.realisasi_k || 0;
      p.totalTargetRp += Number(lap.target_rp) || 0;
      p.totalRealisasiRp += Number(lap.realisasi_rp) || 0;
      p.count += 1;
    }

    // Calculate percentages and format
    const kegiatanArray = Array.from(kegiatanMap.values()).map((k: any) => ({
      name: k.name,
      totalTarget: k.totalTarget,
      totalRealisasi: k.totalRealisasi,
      persentase: k.totalTarget > 0 ? Math.round((k.totalRealisasi / k.totalTarget) * 100) : 0,
      puskesmasCount: k.puskesmasSet.size,
      status: Math.round((k.totalRealisasi / k.totalTarget) * 100) >= 70 ? 'Sesuai Target' : 'Di Bawah Target',
    }));

    const sumberAnggaranArray = Array.from(sumberAnggaranMap.values()).map((s: any) => ({
      name: s.name,
      totalTarget: s.totalTarget,
      totalRealisasi: s.totalRealisasi,
      persentase: s.totalTarget > 0 ? Math.round((s.totalRealisasi / s.totalTarget) * 100) : 0,
      kegiatan: Array.from(s.kegiatan) as string[],
    }));

    // Identify top and low performers
    const performers = Array.from(puskesmasPerformance.entries()).map(([name, data]: any) => ({
      name,
      persentase: data.totalTarget > 0 ? Math.round((data.totalRealisasi / data.totalTarget) * 100) : 0,
      persentaseRp: data.totalTargetRp > 0 ? Math.round((data.totalRealisasiRp / data.totalTargetRp) * 100) : 0,
    }));

    performers.sort((a, b) => b.persentase - a.persentase);
    const topPerformers = performers.slice(0, 5).map(p => `${p.name} (Fisik: ${p.persentase}%, Anggaran: ${p.persentaseRp}%)`);
    const lowPerformers = performers.slice(-5).map(p => `${p.name} (Fisik: ${p.persentase}%, Anggaran: ${p.persentaseRp}%)`);

    // Build all puskesmas performance data sorted by percentage
    const allPuskesmasPerformance = performers.map(p => `${p.name}: Fisik ${p.persentase}%, Anggaran ${p.persentaseRp}%`);

    // Build detail laporan grouped by puskesmas with kegiatan details
    const detailLaporanByPuskesmas: LaporanAnalysis['detailLaporanByPuskesmas'] = {};
    
    for (const lap of laporan) {
      const puskesmasName = (lap as any).user?.nama_puskesmas || 'Unknown';
      const subKegiatanName = (lap as any).subKegiatan?.kegiatan || 'Unknown';
      const satuanName = (lap as any).satuan?.satuannya || '-';

      if (!detailLaporanByPuskesmas[puskesmasName]) {
        const puskesmasPerf = puskesmasPerformance.get(puskesmasName);
        detailLaporanByPuskesmas[puskesmasName] = {
          persentase: puskesmasPerf?.totalTarget > 0 
            ? Math.round((puskesmasPerf.totalRealisasi / puskesmasPerf.totalTarget) * 100) 
            : 0,
          kegiatan: []
        };
      }

      detailLaporanByPuskesmas[puskesmasName].kegiatan.push({
        nama: subKegiatanName,
        target: lap.target_k || 0,
        realisasi: lap.realisasi_k || 0,
        satuan: satuanName,
        persentase: lap.target_k > 0 ? Math.round((lap.realisasi_k / lap.target_k) * 100) : 0,
        realisasiRp: Number(lap.realisasi_rp) || 0,
        targetRp: Number(lap.target_rp) || 0,
        permasalahan: lap.permasalahan || '',
        upaya: lap.upaya || '',
      });
    }

    // Get previous month data for comparison
    const prevMonthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevMonth = months[prevMonthIndex];
    const prevYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;

    const prevLaporan = await Laporan.count({
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
      allPuskesmasPerformance,
      detailLaporanByPuskesmas,
      trends: {
        comparison: laporan.length > prevLaporan ? 'meningkat' : laporan.length < prevLaporan ? 'menurun' : 'sama',
        improvement: laporan.length > prevLaporan 
          ? `${laporan.length - prevLaporan} lebih banyak dari bulan lalu`
          : prevLaporan > laporan.length
          ? `${prevLaporan - laporan.length} lebih sedikit dari bulan lalu`
          : 'sama dengan bulan lalu'
      },
      systemContext: {
        totalPuskesmas,
        totalKegiatan,
        totalSubKegiatan,
        sumberAnggaranList: sumberAnggaranData.map(s => s.sumber),
      }
    };
  } catch (error) {
    console.error('Error aggregating laporan data:', error);
    throw error;
  }
};

/**
 * Get AI insights dengan context laporan
 * Asisten Analis Kinerja Puskesmas - Hanya menggunakan Bahasa Indonesia
 */
export const getAIInsights = async (userQuestion: string): Promise<string> => {
  try {
    // Aggregate data
    const laporanData = await aggregateLaporanData();

    // Build comprehensive system prompt in Bahasa Indonesia
    const systemPrompt = `Anda adalah **Asisten Analis Kinerja Puskesmas** untuk Dinas Kesehatan Kabupaten Bogor.

IDENTITAS ANDA:
- Nama: Asisten Analis E-EVKIN
- Peran: Analis data kinerja dan penyerapan anggaran Puskesmas
- Bahasa: HANYA menggunakan Bahasa Indonesia, JANGAN gunakan bahasa Inggris sama sekali

TENTANG SISTEM E-EVKIN:
E-EVKIN (Evaluasi Kinerja) adalah sistem monitoring dan evaluasi kinerja Puskesmas di Kabupaten Bogor. Sistem ini digunakan untuk:
1. Mencatat laporan kinerja bulanan setiap Puskesmas
2. Memantau penyerapan anggaran berdasarkan sumber dana (${laporanData.systemContext.sumberAnggaranList.join(', ')})
3. Mengevaluasi pencapaian target fisik dan keuangan
4. Mengidentifikasi permasalahan dan upaya penyelesaian

STRUKTUR DATA:
- **Puskesmas**: ${laporanData.systemContext.totalPuskesmas} unit fasilitas kesehatan tingkat pertama
- **Kegiatan**: ${laporanData.systemContext.totalKegiatan} program kesehatan utama
- **Sub Kegiatan**: ${laporanData.systemContext.totalSubKegiatan} sub program yang dilaporkan
- **Sumber Anggaran**: ${laporanData.systemContext.sumberAnggaranList.join(', ')}

TERMINOLOGI PENTING:
- Target K (Kuantitas): Target fisik kegiatan dalam satuan tertentu (orang, kegiatan, dokumen, dll)
- Target Rp: Target anggaran tahunan dalam Rupiah
- Realisasi K: Capaian fisik yang sudah dilaksanakan
- Realisasi Rp: Anggaran yang sudah terserap
- Angkas (Anggaran Kas): Alokasi anggaran bulanan kumulatif dari pemerintah
- Persentase Penyerapan: (Realisasi / Target) x 100%

PEDOMAN ANALISIS:
- Penyerapan >= 90%: Sangat Baik (hijau)
- Penyerapan 70-89%: Baik (kuning)
- Penyerapan 50-69%: Perlu Perhatian (oranye)
- Penyerapan < 50%: Kritis (merah)

CARA MENJAWAB:
1. Analisis data dengan teliti dan spesifik
2. Gunakan angka konkret dari data yang tersedia
3. Berikan rekomendasi yang actionable dan praktis
4. Strukturkan jawaban dengan jelas (gunakan bullet point jika perlu)
5. Maksimal 3-4 paragraf untuk jawaban ringkas
6. Sertakan perbandingan antar Puskesmas jika relevan
7. SELALU jawab dalam Bahasa Indonesia yang profesional dan mudah dipahami`;

    const userPrompt = `
=== DATA LAPORAN KINERJA PUSKESMAS ===
Periode: ${laporanData.month} ${laporanData.year}

📊 RINGKASAN UMUM:
• Total Laporan Masuk: ${laporanData.totalLaporan} laporan
• Trend dibanding bulan lalu: ${laporanData.trends.comparison} (${laporanData.trends.improvement})
• Puskesmas Terdaftar: ${laporanData.systemContext.totalPuskesmas} unit

📈 PERFORMA PER KEGIATAN:
${laporanData.kegiatan.map(k => `• ${k.name}: Realisasi ${k.persentase}% (${k.totalRealisasi}/${k.totalTarget}) - ${k.status} - Dilaporkan oleh ${k.puskesmasCount} Puskesmas`).join('\n')}

💰 PENYERAPAN ANGGARAN PER SUMBER DANA:
${laporanData.sumberAnggaran.map(s => `• ${s.name}: ${s.persentase}% (Realisasi: Rp${s.totalRealisasi.toLocaleString('id-ID')} dari Target: Rp${s.totalTarget.toLocaleString('id-ID')})`).join('\n')}

🏆 TOP 5 PUSKESMAS PERFORMA TERBAIK:
${laporanData.topPerformers.map((p, i) => `${i + 1}. ${p}`).join('\n')}

⚠️ 5 PUSKESMAS PERLU PERHATIAN:
${laporanData.lowPerformers.map((p, i) => `${i + 1}. ${p}`).join('\n')}

📋 RANKING LENGKAP SEMUA PUSKESMAS:
${laporanData.allPuskesmasPerformance.join('\n')}

📝 DETAIL LAPORAN SETIAP PUSKESMAS:
${Object.entries(laporanData.detailLaporanByPuskesmas)
  .sort(([, a], [, b]) => b.persentase - a.persentase)
  .slice(0, 15) // Limit to top 15 for context window
  .map(([puskesmas, data]) => {
    const kegiatanDetail = data.kegiatan
      .slice(0, 5) // Limit kegiatan per puskesmas
      .map(k => `    • ${k.nama}: ${k.realisasi}/${k.target} ${k.satuan} (${k.persentase}%) | Anggaran: Rp${k.realisasiRp.toLocaleString('id-ID')}/${k.targetRp.toLocaleString('id-ID')}${k.permasalahan ? ` | Masalah: ${k.permasalahan.substring(0, 50)}...` : ''}`)
      .join('\n');
    return `\n${puskesmas} (Capaian Fisik: ${data.persentase}%):\n${kegiatanDetail}`;
  })
  .join('\n')}

=== PERTANYAAN ADMIN ===
${userQuestion}

Jawab pertanyaan di atas berdasarkan data yang tersedia. Gunakan HANYA Bahasa Indonesia.`;

    // Call OpenAI
    const message = await openai.chat.completions.create({
      model: config.openai.model,
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
      max_tokens: 1200,
    });

    const response = message.choices[0]?.message?.content || 'Maaf, tidak ada respons dari sistem AI.';
    return response;
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    throw new Error(`Kesalahan Layanan AI: ${error.message}`);
  }
};

/**
 * Get suggested questions untuk dashboard
 * Pertanyaan yang disarankan dalam Bahasa Indonesia untuk analisis kinerja
 */
export const getSuggestedQuestions = (): string[] => {
  return [
    'Berikan analisis lengkap performa semua Puskesmas bulan ini, mana yang terbaik dan perlu perhatian?',
    'Bagaimana penyerapan anggaran per sumber dana (BLUD, DAK, APBD, JKN)? Berikan rekomendasi peningkatan.',
    'Kegiatan mana yang paling bermasalah dalam pencapaian target? Apa solusinya?',
    'Bandingkan 3 Puskesmas teratas dengan 3 terbawah. Apa pelajaran yang bisa diambil?',
    'Buat ringkasan eksekutif kinerja Puskesmas bulan ini untuk laporan ke pimpinan.',
    'Identifikasi pola permasalahan yang sering muncul di laporan Puskesmas dan cara mengatasinya.',
    'Analisis efektivitas penggunaan anggaran, mana yang paling efisien?',
    'Apa rekomendasi prioritas tindakan untuk bulan depan berdasarkan data saat ini?',
  ];
};
