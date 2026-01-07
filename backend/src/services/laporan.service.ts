import { Op } from 'sequelize';
import { Laporan, User, SumberAnggaran, Satuan, SubKegiatan, Kegiatan, SubKegiatanTarget } from '../models';

interface CreateLaporanParams {
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  tahun: number;
  bulan: string;
  realisasi_k?: number;
  realisasi_rp?: number;
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

    return Laporan.findAndCountAll({
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

  static async create(params: CreateLaporanParams) {
    const { user_id, id_sub_kegiatan, id_sumber_anggaran, tahun, realisasi_k, realisasi_rp } = params;

    // VALIDATION: Check Target
    const target = await SubKegiatanTarget.findOne({
      where: {
        user_id,
        id_sub_kegiatan,
        id_sumber_anggaran,
        bulan: null,
        tahun,
      },
      order: [['created_at', 'DESC']],
    });

    if (!target) {
      throw new Error(`Target belum diset untuk sub kegiatan dan sumber anggaran ini di tahun ${tahun}. Hubungi admin.`);
    }

    // VALIDATION: Realisasi vs Target
    if (realisasi_k !== undefined && realisasi_k > target.target_k) {
      throw new Error(`Realisasi kinerja (${realisasi_k}) tidak boleh melebihi target (${target.target_k})`);
    }

    if (realisasi_rp !== undefined && realisasi_rp > target.target_rp) {
      throw new Error(`Realisasi anggaran tidak boleh melebihi target pagu`);
    }

    // Auto-fill
    let id_kegiatan = params.id_kegiatan;
    if (!id_kegiatan) {
      const subKegiatan = await SubKegiatan.findByPk(id_sub_kegiatan, { attributes: ['id_kegiatan'] });
      id_kegiatan = subKegiatan?.id_kegiatan || 0;
    }

    const id_satuan = params.id_satuan || target.id_satuan;
    const status = params.status || 'tersimpan';

    return Laporan.create({
      ...params,
      id_kegiatan,
      id_satuan,
      status: status as any
    } as any);
  }

  static async bulkCreate(laporanArray: any[], requesterId: string, requesterRole: string) {
    if (!Array.isArray(laporanArray) || laporanArray.length === 0) {
      throw new Error('laporanArray harus berupa array dan tidak boleh kosong');
    }

    const userId = requesterRole === 'puskesmas' ? requesterId : laporanArray[0].user_id;

    // OPTIMIZATION: Pre-fetch targets to avoid N+1 queries
    const subKegiatanIds = [...new Set(laporanArray.map((d: any) => d.id_sub_kegiatan).filter(Boolean))];
    const tahunValues = [...new Set(laporanArray.map((d: any) => d.tahun).filter(Boolean))];
    const sumberAnggaranIds = [...new Set(laporanArray.map((d: any) => d.id_sumber_anggaran).filter(Boolean))];

    const targetMap = new Map<string, any>();

    if (subKegiatanIds.length > 0 && tahunValues.length > 0 && sumberAnggaranIds.length > 0) {
      const targets = await SubKegiatanTarget.findAll({
        where: {
          user_id: userId,
          id_sub_kegiatan: { [Op.in]: subKegiatanIds },
          id_sumber_anggaran: { [Op.in]: sumberAnggaranIds },
          bulan: null,
          tahun: { [Op.in]: tahunValues },
        },
        order: [['created_at', 'DESC']],
      });

      for (const t of targets) {
        // Create unique key for lookup
        const key = `${t.id_sub_kegiatan}_${t.id_sumber_anggaran}_${t.tahun}`;
        // Store only the latest target (due to order DESC) if duplicates exist logic
        if (!targetMap.has(key)) targetMap.set(key, t);
      }
    }

    const processedData = [];

    for (const data of laporanArray) {
      if (!data.id_sub_kegiatan || !data.id_sumber_anggaran) {
        throw new Error('Setiap laporan harus memiliki id_sub_kegiatan dan id_sumber_anggaran');
      }

      const targetKey = `${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${data.tahun}`;
      const target = targetMap.get(targetKey);

      if (!target) {
        throw new Error(`Target belum diset untuk sub kegiatan dan sumber anggaran ini di tahun ${data.tahun}. Hubungi admin.`);
      }

      if (data.realisasi_k > target.target_k) {
        throw new Error(`Realisasi kinerja (${data.realisasi_k}) tidak boleh melebihi target (${target.target_k})`);
      }

      if (data.angkas !== undefined && data.realisasi_rp > data.angkas) {
        throw new Error(`Realisasi anggaran (Rp ${data.realisasi_rp?.toLocaleString('id-ID')}) tidak boleh melebihi realisasi angkas (Rp ${data.angkas?.toLocaleString('id-ID')})`);
      }

      processedData.push({
        ...data,
        user_id: userId,
        status: data.status || 'tersimpan',
      });
    }

    return Laporan.bulkCreate(processedData, { validate: true, returning: true });
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

          if (data.realisasi_k !== undefined && data.realisasi_k > target.target_k) {
            results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Realisasi kinerja (${data.realisasi_k}) melebihi target (${target.target_k})`);
            results.skipped++;
            continue;
          }

          if (data.angkas !== undefined && data.realisasi_rp !== undefined && data.realisasi_rp > data.angkas) {
            results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Realisasi anggaran (Rp ${data.realisasi_rp?.toLocaleString('id-ID')}) melebihi realisasi angkas (Rp ${data.angkas?.toLocaleString('id-ID')})`);
            results.skipped++;
            continue;
          }

          const subKegiatan = subKegiatanMap.get(data.id_sub_kegiatan);
          const laporanData = {
            ...data,
            user_id: userId,
            id_kegiatan: subKegiatan?.id_kegiatan || data.id_kegiatan || 0,
            id_satuan: data.id_satuan || target.id_satuan,
            status: (data.status || 'tersimpan') as any,
          };

          if (data.id) {
            const [updatedCount] = await Laporan.update(laporanData, {
              where: { id: data.id, user_id: userId },
              transaction,
            });
            updatedCount > 0 ? results.updated++ : results.skipped++;
          } else {
            const existingKey = `${userId}_${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${data.bulan}_${data.tahun}`;
            const existing = existingLaporanMap.get(existingKey);
            if (existing) {
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

    if (!target) {
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

    await laporan.destroy();
    return true;
  }

  static async submit(bulan: string, tahun: number, requesterId: string, requesterRole: string, userIdParam?: string) {
    const userId = requesterRole === 'puskesmas' ? requesterId : userIdParam;

    if (!userId) {
      throw new Error('user_id is required');
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
