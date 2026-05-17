import { Op } from 'sequelize';
import { Laporan, User, SumberAnggaran, Satuan, SubKegiatan, Kegiatan, SubKegiatanTarget, AnggaranKas } from '../models';
import { getLraRealisasiMap } from './lraParserService';

const BULAN_MAP: Record<string, number> = {
  Januari: 1, Februari: 2, Maret: 3, April: 4,
  Mei: 5, Juni: 6, Juli: 7, Agustus: 8,
  September: 9, Oktober: 10, November: 11, Desember: 12,
};

interface CreateLaporanParams {
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  tahun: number;
  bulan: string;
  realisasi_k?: number;
  realisasi_rp?: number | null;
  angkas?: number;
  status?: any;
  [key: string]: any;
}

interface UpdateLaporanParams {
  id: string;
  user_id: string; // for security check
  role: string; // for security check
  data: Partial<CreateLaporanParams>;
}

interface LaporanFilterParams {
  user_id?: string;
  role?: string;
  bulan?: string;
  tahun?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export class LaporanService {

  static async findAll(params: LaporanFilterParams) {
    const { user_id, role, bulan, tahun, status, page = 1, limit = 50 } = params;
    const offset = (page - 1) * limit;

    const where: any = {};

    // Security: Puskesmas sees only their own
    if (role === 'puskesmas' && user_id) {
      where.user_id = user_id;
    } else if (role === 'admin' && user_id) {
      where.user_id = user_id;
    }

    if (bulan) where.bulan = bulan;
    if (tahun) where.tahun = tahun;
    if (status) where.status = status;

    const result = await Laporan.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nama', 'nama_puskesmas']
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber']
        },
        {
          model: Satuan,
          as: 'satuan',
          attributes: ['id_satuan', 'satuannya']
        },
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
          include: [{
            model: Kegiatan,
            as: 'kegiatanParent',
            attributes: ['id_kegiatan', 'kode', 'kegiatan']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Enrich with LRA realisasi if querying for a specific puskesmas + bulan + tahun
    if (user_id && bulan && tahun) {
      const lraMap = await getLraRealisasiMap(user_id, bulan, tahun);
      const enrichedRows = result.rows.map(lap => {
        const key = `${(lap as any).id_sub_kegiatan}_${(lap as any).id_sumber_anggaran}`;
        const lraRp = lraMap.get(key);
        const json = lap.toJSON() as any;
        json.realisasi_rp_lra = lraRp ?? 0;
        json.lra_available = lraRp !== undefined;
        return json;
      });
      return { count: result.count, rows: enrichedRows };
    }

    return result;
  }

  static async findById(id: string, requesterId: string, requesterRole: string) {
    const laporan = await Laporan.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nama', 'nama_puskesmas']
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber']
        },
        {
          model: Satuan,
          as: 'satuan',
          attributes: ['id_satuan', 'satuannya']
        },
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
          include: [{
            model: Kegiatan,
            as: 'kegiatanParent',
            attributes: ['id_kegiatan', 'kode', 'kegiatan']
          }]
        }
      ]
    });

    if (!laporan) throw new Error('Laporan not found');

    if (requesterRole === 'puskesmas' && laporan.user_id !== requesterId) {
      throw new Error('Forbidden: Anda tidak bisa mengakses laporan puskesmas lain');
    }

    return laporan;
  }

  static async bulkUpsert(laporanArray: any[], requesterId: string, requesterRole: string) {
    const transaction = await Laporan.sequelize!.transaction();

    try {
      if (!Array.isArray(laporanArray) || laporanArray.length === 0) {
        throw new Error('laporanArray harus berupa array dan tidak boleh kosong');
      }

      const userId = requesterRole === 'puskesmas' ? requesterId : laporanArray[0].user_id;
      const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

      const subKegiatanIds = [...new Set(laporanArray.map((d: any) => d.id_sub_kegiatan).filter(Boolean))];
      const tahunValues = [...new Set(laporanArray.map((d: any) => d.tahun).filter(Boolean))];

      const subKegiatanMap = new Map<number, any>();
      if (subKegiatanIds.length > 0) {
        const subKegiatanList = await SubKegiatan.findAll({
          where: { id_sub_kegiatan: { [Op.in]: subKegiatanIds } },
          attributes: ['id_sub_kegiatan', 'id_kegiatan'],
          transaction,
        });
        subKegiatanList.forEach(sk => subKegiatanMap.set(sk.id_sub_kegiatan, sk));
      }

      const targetMap = new Map<string, any>();
      if (subKegiatanIds.length > 0 && tahunValues.length > 0) {
        const targets = await SubKegiatanTarget.findAll({
          where: {
            user_id: userId,
            id_sub_kegiatan: { [Op.in]: subKegiatanIds },
            bulan: null,
            tahun: { [Op.in]: tahunValues },
          },
          order: [['created_at', 'DESC']],
          transaction,
        });
        for (const t of targets) {
          const key = `${t.id_sub_kegiatan}_${t.id_sumber_anggaran}_${t.tahun}`;
          if (!targetMap.has(key)) targetMap.set(key, t);
        }
      }

      const bulanValues = [...new Set(laporanArray.map((d: any) => d.bulan).filter(Boolean))];
      const sumberAnggaranIds = [...new Set(laporanArray.map((d: any) => d.id_sumber_anggaran).filter(Boolean))];
      const existingLaporanMap = new Map<string, any>();

      if (subKegiatanIds.length > 0 && bulanValues.length > 0 && tahunValues.length > 0) {
        const existingLaporan = await Laporan.findAll({
          where: {
            user_id: userId,
            id_sub_kegiatan: { [Op.in]: subKegiatanIds },
            id_sumber_anggaran: { [Op.in]: sumberAnggaranIds },
            bulan: { [Op.in]: bulanValues },
            tahun: { [Op.in]: tahunValues },
          },
          transaction,
        });

        for (const lap of existingLaporan) {
          const key = `${lap.user_id}_${lap.id_sub_kegiatan}_${lap.id_sumber_anggaran}_${lap.bulan}_${lap.tahun}`;
          existingLaporanMap.set(key, lap);
        }
      }

      // Pre-fetch AnggaranKas from DB (L4 fix — angkas must come from DB, not payload)
      const angkasMap = new Map<string, number>();
      const bulanNums = [...new Set(
        laporanArray.map((d: any) => BULAN_MAP[d.bulan]).filter(Boolean)
      )];

      if (subKegiatanIds.length > 0 && bulanNums.length > 0 && sumberAnggaranIds.length > 0) {
        const angkasRecords = await AnggaranKas.findAll({
          where: {
            user_id: userId,
            id_sub_kegiatan: { [Op.in]: subKegiatanIds },
            id_sumber_anggaran: { [Op.in]: sumberAnggaranIds },
            bulan: { [Op.in]: bulanNums },
            tahun: { [Op.in]: tahunValues },
          },
          attributes: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'bulan', 'tahun', 'nilai'],
          transaction,
        });

        for (const rec of angkasRecords) {
          const key = `${rec.id_sub_kegiatan}_${rec.id_sumber_anggaran}_${rec.bulan}_${rec.tahun}`;
          angkasMap.set(key, (angkasMap.get(key) || 0) + Number(rec.nilai));
        }
      }

      for (const data of laporanArray) {
        try {
          if (!data.id_sub_kegiatan || !data.id_sumber_anggaran) {
            results.skipped++;
            continue;
          }
          const targetKey = `${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${data.tahun}`;
          const target = targetMap.get(targetKey);

          if (!target) {
            results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Target belum diset untuk tahun ${data.tahun}`);
            results.skipped++;
            continue;
          }

          if (target.target_k > 0 && data.realisasi_k !== undefined && data.realisasi_k > target.target_k) {
            results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Realisasi kinerja (${data.realisasi_k}) melebihi target (${target.target_k})`);
            results.skipped++;
            continue;
          }

          const bulanNum = BULAN_MAP[data.bulan];
          if (bulanNum === undefined) {
            results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Nama bulan tidak valid: "${data.bulan}"`);
            results.skipped++;
            continue;
          }
          const angkasKey = `${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${bulanNum}_${data.tahun}`;
          const angkasFromDB = angkasMap.get(angkasKey) ?? 0;

          // angkasFromDB = 0 means no AnggaranKas record exists — no ceiling applied (admin hasn't uploaded PDF yet)
          if (angkasFromDB > 0 && data.realisasi_rp !== undefined && data.realisasi_rp > angkasFromDB) {
            results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Realisasi anggaran (Rp ${data.realisasi_rp?.toLocaleString('id-ID')}) melebihi angkas (Rp ${angkasFromDB.toLocaleString('id-ID')})`);
            results.skipped++;
            continue;
          }

          const subKegiatan = subKegiatanMap.get(data.id_sub_kegiatan);
          const laporanData = {
            ...data,
            user_id: userId,
            id_kegiatan: subKegiatan?.id_kegiatan || data.id_kegiatan || 0,
            id_satuan: data.id_satuan || target.id_satuan,
            angkas: angkasFromDB,   // always from DB, not payload
            status: 'tersimpan' as any,
          };

          if (data.id) {
            // Protect terkirim laporan from being overwritten
            const existingById = await Laporan.findOne({
              where: { id: data.id, user_id: userId },
              attributes: ['id', 'status'],
              transaction,
            });
            if (existingById && existingById.status === 'terkirim') {
              results.skipped++;
              continue;
            }
            const [updatedCount] = await Laporan.update(laporanData, {
              where: { id: data.id, user_id: userId },
              transaction,
            });
            updatedCount > 0 ? results.updated++ : results.skipped++;
          } else {
            const existingKey = `${userId}_${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${data.bulan}_${data.tahun}`;
            const existing = existingLaporanMap.get(existingKey);
            if (existing) {
              // Protect terkirim laporan from being overwritten
              if (existing.status === 'terkirim') {
                results.skipped++;
                continue;
              }
              await existing.update(laporanData, { transaction });
              results.updated++;
            } else {
              const newLaporan = await Laporan.create(laporanData, { transaction });
              existingLaporanMap.set(existingKey, newLaporan);
              results.created++;
            }
          }

        } catch (err: any) {
          results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: ${err.message}`);
        }
      }

      await transaction.commit();
      return results;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(params: UpdateLaporanParams) {
    const { id, user_id, role, data } = params;

    const laporan = await Laporan.findByPk(id);
    if (!laporan) throw new Error('Laporan not found');

    if (role === 'puskesmas' && laporan.user_id !== user_id) {
      throw new Error('Forbidden: Anda tidak bisa mengubah laporan puskesmas lain');
    }

    const subKegiatanId = data.id_sub_kegiatan || laporan.id_sub_kegiatan;
    const sumberAnggaranId = data.id_sumber_anggaran || laporan.id_sumber_anggaran;
    const tahunValue = data.tahun || laporan.tahun;

    const target = await SubKegiatanTarget.findOne({
      where: {
        user_id: laporan.user_id,
        id_sub_kegiatan: subKegiatanId,
        id_sumber_anggaran: sumberAnggaranId,
        bulan: null,
        tahun: tahunValue,
      },
      order: [['created_at', 'DESC']],
    });

    if (!target || (target.target_k === 0 && target.target_rp === 0)) {
      throw new Error(`Target belum diset untuk sub kegiatan dan sumber anggaran ini di tahun ${tahunValue}. Hubungi admin.`);
    }

    if (data.realisasi_k !== undefined || data.realisasi_rp !== undefined) {
      const newRealisasiK = data.realisasi_k !== undefined ? data.realisasi_k : laporan.realisasi_k;
      const newRealisasiRp = data.realisasi_rp !== undefined ? data.realisasi_rp : laporan.realisasi_rp;
      const angkasValue = data.angkas !== undefined ? data.angkas : laporan.angkas;

      if (newRealisasiK > target.target_k) {
        throw new Error(`Realisasi kinerja (${newRealisasiK}) tidak boleh melebihi target (${target.target_k})`);
      }

      if (angkasValue !== undefined && newRealisasiRp > angkasValue) {
        throw new Error(`Realisasi anggaran (Rp ${newRealisasiRp?.toLocaleString('id-ID')}) tidak boleh melebihi realisasi angkas (Rp ${angkasValue?.toLocaleString('id-ID')})`);
      }
    }

    await laporan.update(data);
    return laporan;
  }

  static async delete(id: string, requesterId: string, requesterRole: string) {
    const laporan = await Laporan.findByPk(id);
    if (!laporan) throw new Error('Laporan not found');

    if (requesterRole === 'puskesmas' && laporan.user_id !== requesterId) {
      throw new Error('Forbidden: Anda tidak bisa menghapus laporan puskesmas lain');
    }

    if (requesterRole === 'puskesmas' && laporan.status === 'terkirim') {
      throw new Error('Forbidden: Laporan yang sudah terkirim tidak bisa dihapus');
    }

    await laporan.destroy();
    return true;
  }

  static async submit(bulan: string, tahun: number, requesterId: string, requesterRole: string, userIdParam?: string) {
    const userId = requesterRole === 'puskesmas' ? requesterId : userIdParam;

    if (!userId) {
      throw new Error('user_id is required');
    }

    // Validate data completeness before submit
    const pendingLaporan = await Laporan.findAll({
      where: {
        user_id: userId,
        bulan,
        tahun,
        status: 'tersimpan'
      }
    });

    if (pendingLaporan.length === 0) {
      const alreadySubmittedCount = await Laporan.count({
        where: { user_id: userId, bulan, tahun, status: 'terkirim' }
      });
      if (alreadySubmittedCount > 0) {
        throw new Error(`Semua laporan untuk ${bulan} ${tahun} sudah dikirim sebelumnya`);
      }
      throw new Error(`Tidak ada laporan dengan status "tersimpan" untuk ${bulan} ${tahun}`);
    }

    const incomplete = pendingLaporan.filter(l => {
      const data = l.get({ plain: true }) as any;
      return data.realisasi_k === null || data.realisasi_k === undefined;
    });

    if (incomplete.length > 0) {
      throw new Error(`${incomplete.length} laporan belum memiliki data realisasi kinerja. Lengkapi data sebelum mengirim.`);
    }

    const incompleteRp = pendingLaporan.filter(l => {
      const data = l.get({ plain: true }) as any;
      return data.realisasi_rp === null || data.realisasi_rp === undefined;
    });

    if (incompleteRp.length > 0) {
      throw new Error(`${incompleteRp.length} laporan belum memiliki data realisasi anggaran (Rp). Upload LRA terlebih dahulu sebelum mengirim.`);
    }

    const [updatedCount] = await Laporan.update(
      { status: 'terkirim' },
      {
        where: {
          user_id: userId,
          bulan,
          tahun,
          status: 'tersimpan'
        }
      }
    );

    if (updatedCount === 0) {
      const alreadySubmittedCount = await Laporan.count({
        where: { user_id: userId, bulan, tahun, status: 'terkirim' }
      });
      if (alreadySubmittedCount > 0) {
        throw new Error(`Semua laporan untuk ${bulan} ${tahun} sudah dikirim sebelumnya`);
      }
      throw new Error(`Tidak ada laporan dengan status "tersimpan" untuk ${bulan} ${tahun}`);
    }

    return updatedCount;
  }
}
