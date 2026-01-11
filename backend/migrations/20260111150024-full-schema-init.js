'use strict';

/**
 * Full Schema Initialization Migration
 * 
 * This migration creates all tables from scratch for a fresh database.
 * It is idempotent - checks if tables exist before creating.
 * 
 * Tables created:
 * 1. users - User accounts (admin and puskesmas)
 * 2. kegiatan - Main activities
 * 3. sub_kegiatan - Sub-activities under kegiatan
 * 4. sumber_anggaran - Budget sources (BLUD, DAK, APBD, JKN)
 * 5. satuan - Units of measurement
 * 6. laporan - Monthly performance reports
 * 7. sub_kegiatan_target - Yearly/monthly targets per puskesmas
 * 8. sub_kegiatan_sumber_dana - Junction table for sub_kegiatan <-> sumber_anggaran
 * 9. puskesmas_sub_kegiatan - Junction table for user <-> sub_kegiatan assignment
 * 10. anggaran_kas - Monthly budget allocation from PDF uploads
 * 11. puskesmas_edit_permission - Edit window permissions
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Helper to check if table exists
      const tableExists = async (tableName) => {
        const [result] = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = '${tableName}'`,
          { transaction }
        );
        return result.length > 0;
      };

      // 1. Create users table
      if (!(await tableExists('users'))) {
        console.log('Creating users table...');
        await queryInterface.createTable('users', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          username: {
            type: Sequelize.STRING(100),
            allowNull: false,
            unique: true,
          },
          password: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          nama: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          role: {
            type: Sequelize.ENUM('puskesmas', 'admin'),
            allowNull: false,
            defaultValue: 'puskesmas',
          },
          kode_puskesmas: {
            type: Sequelize.STRING(50),
            allowNull: true,
          },
          nama_puskesmas: {
            type: Sequelize.STRING(200),
            allowNull: true,
          },
          kode_sub_unit: {
            type: Sequelize.STRING(50),
            allowNull: true,
            unique: true,
          },
          id_blud: {
            type: Sequelize.STRING(50),
            allowNull: true,
          },
          kecamatan: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
          wilayah: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });

        await queryInterface.addIndex('users', ['role'], {
          name: 'users_role_idx',
          transaction,
        });
      }

      // 2. Create kegiatan table
      if (!(await tableExists('kegiatan'))) {
        console.log('Creating kegiatan table...');
        await queryInterface.createTable('kegiatan', {
          id_kegiatan: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          id_uraian: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          kode: {
            type: Sequelize.STRING(20),
            allowNull: false,
          },
          kegiatan: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
      }

      // 3. Create sub_kegiatan table
      if (!(await tableExists('sub_kegiatan'))) {
        console.log('Creating sub_kegiatan table...');
        await queryInterface.createTable('sub_kegiatan', {
          id_sub_kegiatan: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          id_kegiatan: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'kegiatan',
              key: 'id_kegiatan',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          kode_sub: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          kegiatan: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          indikator_kinerja: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
      }

      // 4. Create sumber_anggaran table
      if (!(await tableExists('sumber_anggaran'))) {
        console.log('Creating sumber_anggaran table...');
        await queryInterface.createTable('sumber_anggaran', {
          id_sumber: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          sumber: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
      }

      // 5. Create satuan table
      if (!(await tableExists('satuan'))) {
        console.log('Creating satuan table...');
        await queryInterface.createTable('satuan', {
          id_satuan: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          satuannya: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
      }

      // 6. Create laporan table
      if (!(await tableExists('laporan'))) {
        console.log('Creating laporan table...');
        
        // Create ENUM type first
        await queryInterface.sequelize.query(
          `DO $$ BEGIN
            CREATE TYPE enum_laporan_status AS ENUM ('menunggu', 'terkirim', 'diverifikasi', 'ditolak', 'tersimpan');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;`,
          { transaction }
        );

        await queryInterface.createTable('laporan', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_kegiatan: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          id_sub_kegiatan: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'sub_kegiatan',
              key: 'id_sub_kegiatan',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_sumber_anggaran: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'sumber_anggaran',
              key: 'id_sumber',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_satuan: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'satuan',
              key: 'id_satuan',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          bulan: {
            type: Sequelize.STRING(20),
            allowNull: false,
          },
          tahun: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          target_k: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          angkas: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          target_rp: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          target_angkas: {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          realisasi_k: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          realisasi_rp: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          realisasi_fisik: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
          },
          permasalahan: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          upaya: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          status: {
            type: Sequelize.ENUM('menunggu', 'terkirim', 'diverifikasi', 'ditolak', 'tersimpan'),
            allowNull: false,
            defaultValue: 'menunggu',
          },
          catatan: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          verified_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          verified_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });

        // Add indexes
        await queryInterface.addIndex('laporan', ['user_id'], { transaction });
        await queryInterface.addIndex('laporan', ['status'], { name: 'laporan_status', transaction });
        await queryInterface.addIndex('laporan', ['bulan', 'tahun'], { transaction });
        await queryInterface.addIndex('laporan', ['user_id', 'bulan', 'tahun'], { 
          name: 'laporan_user_bulan_tahun', 
          transaction 
        });
      }

      // 7. Create sub_kegiatan_target table
      if (!(await tableExists('sub_kegiatan_target'))) {
        console.log('Creating sub_kegiatan_target table...');
        await queryInterface.createTable('sub_kegiatan_target', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_sub_kegiatan: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'sub_kegiatan',
              key: 'id_sub_kegiatan',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_sumber_anggaran: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'sumber_anggaran',
              key: 'id_sumber',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_satuan: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'satuan',
              key: 'id_satuan',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          target_k: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          target_rp: {
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0,
          },
          bulan: {
            type: Sequelize.STRING(20),
            allowNull: true,
          },
          tahun: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          catatan: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });

        // Add indexes
        await queryInterface.addIndex('sub_kegiatan_target', 
          ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'bulan', 'tahun'], 
          { name: 'sub_kegiatan_target_composite', transaction }
        );
        await queryInterface.addIndex('sub_kegiatan_target', ['user_id'], { transaction });
        await queryInterface.addIndex('sub_kegiatan_target', ['id_sub_kegiatan'], { transaction });
        await queryInterface.addIndex('sub_kegiatan_target', ['id_sumber_anggaran'], { transaction });
        await queryInterface.addIndex('sub_kegiatan_target', ['created_at'], { transaction });
        await queryInterface.addIndex('sub_kegiatan_target', ['user_id', 'tahun'], { 
          name: 'sub_kegiatan_target_user_tahun', 
          transaction 
        });
      }

      // 8. Create sub_kegiatan_sumber_dana (junction table)
      if (!(await tableExists('sub_kegiatan_sumber_dana'))) {
        console.log('Creating sub_kegiatan_sumber_dana table...');
        await queryInterface.createTable('sub_kegiatan_sumber_dana', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          id_sub_kegiatan: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'sub_kegiatan',
              key: 'id_sub_kegiatan',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_sumber_anggaran: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'sumber_anggaran',
              key: 'id_sumber',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });

        // Add unique constraint
        await queryInterface.addIndex('sub_kegiatan_sumber_dana', 
          ['id_sub_kegiatan', 'id_sumber_anggaran'], 
          { unique: true, name: 'sub_kegiatan_sumber_dana_unique', transaction }
        );
        await queryInterface.addIndex('sub_kegiatan_sumber_dana', ['id_sub_kegiatan'], { transaction });
        await queryInterface.addIndex('sub_kegiatan_sumber_dana', ['id_sumber_anggaran'], { transaction });
      }

      // 9. Create puskesmas_sub_kegiatan (junction table)
      if (!(await tableExists('puskesmas_sub_kegiatan'))) {
        console.log('Creating puskesmas_sub_kegiatan table...');
        await queryInterface.createTable('puskesmas_sub_kegiatan', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_sub_kegiatan: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'sub_kegiatan',
              key: 'id_sub_kegiatan',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });

        // Add unique constraint
        await queryInterface.addIndex('puskesmas_sub_kegiatan', 
          ['user_id', 'id_sub_kegiatan'], 
          { unique: true, name: 'puskesmas_sub_kegiatan_unique', transaction }
        );
      }

      // 10. Create anggaran_kas table
      if (!(await tableExists('anggaran_kas'))) {
        console.log('Creating anggaran_kas table...');
        await queryInterface.createTable('anggaran_kas', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          id_sub_kegiatan: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'sub_kegiatan',
              key: 'id_sub_kegiatan',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          id_sumber_anggaran: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'sumber_anggaran',
              key: 'id_sumber',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          kode_rekening: {
            type: Sequelize.STRING(50),
            allowNull: false,
          },
          uraian: {
            type: Sequelize.STRING(500),
            allowNull: false,
          },
          tahun: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          bulan: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          nilai: {
            type: Sequelize.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0,
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });

        // Add indexes
        await queryInterface.addIndex('anggaran_kas', 
          ['user_id', 'kode_rekening', 'id_sumber_anggaran', 'tahun', 'bulan'], 
          { name: 'anggaran_kas_lookup_entry', transaction }
        );
        await queryInterface.addIndex('anggaran_kas', ['user_id', 'tahun'], 
          { name: 'anggaran_kas_user_tahun', transaction }
        );
        await queryInterface.addIndex('anggaran_kas', ['id_sub_kegiatan', 'tahun'], 
          { name: 'anggaran_kas_sub_kegiatan_tahun', transaction }
        );
        await queryInterface.addIndex('anggaran_kas', ['created_at'], 
          { name: 'anggaran_kas_created_at', transaction }
        );
      }

      // 11. Create puskesmas_edit_permission table
      if (!(await tableExists('puskesmas_edit_permission'))) {
        console.log('Creating puskesmas_edit_permission table...');
        await queryInterface.createTable('puskesmas_edit_permission', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: true, // null = all puskesmas
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          scope: {
            type: Sequelize.STRING(50),
            allowNull: false,
          },
          bulan: {
            type: Sequelize.STRING(20),
            allowNull: true,
          },
          tahun: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          start_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          end_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });

        // Add indexes
        await queryInterface.addIndex('puskesmas_edit_permission', 
          ['user_id', 'scope', 'bulan', 'tahun'], 
          { name: 'puskesmas_edit_permission_lookup', transaction }
        );
        await queryInterface.addIndex('puskesmas_edit_permission', ['created_at'], { transaction });
      }

      await transaction.commit();
      console.log('Full schema initialization completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop tables in reverse order (respecting foreign keys)
      const tables = [
        'puskesmas_edit_permission',
        'anggaran_kas',
        'puskesmas_sub_kegiatan',
        'sub_kegiatan_sumber_dana',
        'sub_kegiatan_target',
        'laporan',
        'satuan',
        'sumber_anggaran',
        'sub_kegiatan',
        'kegiatan',
        'users',
      ];

      for (const table of tables) {
        const [result] = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = '${table}'`,
          { transaction }
        );
        if (result.length > 0) {
          console.log(`Dropping table ${table}...`);
          await queryInterface.dropTable(table, { transaction, cascade: true });
        }
      }

      // Drop ENUM type
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS enum_laporan_status CASCADE;',
        { transaction }
      );

      await transaction.commit();
      console.log('All tables dropped successfully');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
