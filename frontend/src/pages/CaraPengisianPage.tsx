import React from 'react';
import { Card, Typography, Steps, Divider, Alert, Space, List } from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export const CaraPengisianPage: React.FC = () => {
  return (
    <div>
      <Title level={3}>Panduan Pengisian Laporan Kinerja Puskesmas</Title>
      <Paragraph type="secondary">
        Halaman ini berisi panduan lengkap cara mengisi laporan evaluasi kinerja puskesmas.
      </Paragraph>

      <Alert
        message="Informasi Penting"
        description="Sistem menggunakan input laporan berbasis tabel untuk semua sub kegiatan sekaligus. Pilih bulan dan tahun, lalu isi semua sub kegiatan yang telah dikonfigurasi untuk puskesmas Anda."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="Langkah-Langkah Pengisian Laporan" style={{ marginBottom: 24 }}>
        <Steps
          direction="vertical"
          current={-1}
          items={[
            {
              title: 'Login ke Sistem',
              description: 'Masuk menggunakan username dan password yang telah diberikan oleh Dinas Kesehatan.',
              icon: <FileTextOutlined />,
            },
            {
              title: 'Akses Menu Laporan Kinerja',
              description: 'Klik menu "Laporan Kinerja" pada sidebar untuk membuka halaman input laporan.',
              icon: <FileTextOutlined />,
            },
            {
              title: 'Pilih Bulan dan Tahun',
              description: 'Pilih bulan dan tahun periode laporan yang akan diisi menggunakan dropdown filter di bagian atas.',
              icon: <EditOutlined />,
            },
            {
              title: 'Isi Data di Tabel',
              description: 'Sistem akan menampilkan tabel berisi semua sub kegiatan yang telah dikonfigurasi. Isi data langsung pada kolom-kolom yang tersedia (Sumber Anggaran, Satuan, Target K, Angkas, Target Rp, Realisasi K, Realisasi Rp, Permasalahan, Upaya).',
              icon: <EditOutlined />,
            },
            {
              title: 'Simpan Data',
              description: 'Klik tombol "Simpan" untuk menyimpan semua data. Status laporan akan menjadi "Tersimpan" dan masih bisa diedit.',
              icon: <CheckCircleOutlined />,
            },
            {
              title: 'Kirim Laporan',
              description: 'Setelah semua data lengkap dan benar, klik tombol "Kirim Semua" untuk mengirim laporan ke Dinas Kesehatan. Status akan berubah menjadi "Terkirim" dan data tidak bisa diedit lagi.',
              icon: <CheckCircleOutlined />,
            },
          ]}
        />
      </Card>

      <Card title="Penjelasan Field Laporan" style={{ marginBottom: 24 }}>
        <Alert
          message="Input Berbasis Tabel"
          description="Sistem menggunakan tabel untuk input laporan. Semua sub kegiatan yang telah dikonfigurasi akan muncul dalam satu tabel. Anda dapat mengisi data langsung di kolom-kolom yang tersedia."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Kolom yang Tidak Bisa Diedit (Informasi)</Title>
            <List
              size="small"
              dataSource={[
                'No - Nomor urut',
                'Kode - Kode sub kegiatan',
                'Kegiatan - Nama kegiatan parent',
                'Sub Kegiatan - Nama sub kegiatan',
                'Indikator - Indikator kinerja',
                'Status - Status laporan (Belum Disimpan/Tersimpan/Terkirim)',
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />
          </div>

          <Divider />

          <div>
            <Title level={5}>Kolom yang Harus Diisi</Title>
            <Paragraph>
              <Text strong>1. Sumber Anggaran</Text> - Pilih dari dropdown:
            </Paragraph>
            <List
              size="small"
              dataSource={[
                'BLUD Puskesmas',
                'DAK Non Fisik',
                'APBD Kabupaten',
                'JKN (Dana Kapitasi)',
              ]}
              renderItem={(item) => <List.Item style={{ marginLeft: 20 }}>• {item}</List.Item>}
            />
          </div>

          <Divider />

          <div>
            <Paragraph>
              <Text strong>2. Satuan</Text> - Pilih satuan yang sesuai dengan jenis kegiatan (contoh: Orang, Dokumen, Kegiatan, Paket, dll).
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Paragraph>
              <Text strong>3. Target (K)</Text> - Isi jumlah target kuantitas kegiatan yang direncanakan. Format angka otomatis menggunakan thousand separator (contoh: 1.000).
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Paragraph>
              <Text strong>4. Target Angkas (Rp)</Text> - Isi total anggaran kas yang dialokasikan dalam rupiah. Format angka otomatis (contoh: 5.000.000).
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Paragraph>
              <Text strong>5. Target Pagu (Rp)</Text> - Isi target dana yang akan direalisasikan dalam rupiah. Format angka otomatis.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Paragraph>
              <Text strong>6. Realisasi (K)</Text> - Isi jumlah realisasi kuantitas kegiatan yang sudah dilaksanakan. Format angka otomatis.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Paragraph>
              <Text strong>7. Realisasi (Rp)</Text> - Isi jumlah dana yang sudah direalisasikan dalam rupiah. Format angka otomatis.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Paragraph>
              <Text strong>8. Permasalahan</Text> - Jelaskan kendala atau permasalahan yang dihadapi dalam pelaksanaan kegiatan (jika ada). Kolom ini bersifat opsional.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Paragraph>
              <Text strong>9. Upaya</Text> - Jelaskan upaya atau solusi yang telah/akan dilakukan untuk mengatasi permasalahan. Kolom ini bersifat opsional.
            </Paragraph>
          </div>
        </Space>
      </Card>

      <Card title="Tips Pengisian" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message="Input Tabel Efisien"
            description="Anda dapat mengisi beberapa baris sekaligus lalu klik Simpan. Tidak perlu menyimpan satu per satu."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
          <Alert
            message="Format Angka Otomatis"
            description="Semua kolom angka (Target K, Angkas, Target Rp, Realisasi K, Realisasi Rp) menggunakan thousand separator otomatis (contoh: 1.000.000). Anda tidak perlu mengetik titik pemisah."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
          <Alert
            message="Akurasi Data"
            description="Pastikan semua angka yang diinput sesuai dengan data riil di lapangan dan dokumen pendukung."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
          <Alert
            message="Kelengkapan"
            description="Minimal harus mengisi Sumber Anggaran dan Satuan untuk setiap sub kegiatan yang akan dilaporkan."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
          <Alert
            message="Status Tersimpan vs Terkirim"
            description="Data dengan status 'Tersimpan' masih bisa diedit. Setelah diklik 'Kirim Semua', status berubah menjadi 'Terkirim' dan tidak bisa diedit lagi kecuali dikembalikan oleh Admin."
            type="info"
            showIcon
          />
          <Alert
            message="Data Otomatis Tersimpan"
            description="Data yang telah disimpan akan otomatis muncul kembali saat Anda memilih bulan/tahun yang sama."
            type="info"
            showIcon
          />
        </Space>
      </Card>

      <Card title="Status Laporan">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ color: '#d9d9d9' }}>● Belum Disimpan:</Text>
            <Paragraph style={{ marginLeft: 20 }}>
              Data belum disimpan ke sistem. Baris dengan status ini akan hilang jika Anda menutup halaman tanpa menyimpan.
            </Paragraph>
          </div>

          <div>
            <Text strong style={{ color: '#595959' }}>● Tersimpan:</Text>
            <Paragraph style={{ marginLeft: 20 }}>
              Data sudah disimpan di sistem dan masih bisa diedit. Status ini muncul setelah Anda klik tombol "Simpan".
            </Paragraph>
          </div>

          <div>
            <Text strong style={{ color: '#1890ff' }}>● Terkirim:</Text>
            <Paragraph style={{ marginLeft: 20 }}>
              Data sudah dikirim ke Dinas Kesehatan dan tidak bisa diedit lagi. Admin dapat melihat laporan Anda dan jika ada kesalahan, Admin dapat mengembalikan status ke "Tersimpan" untuk diperbaiki.
            </Paragraph>
          </div>
        </Space>
      </Card>

      <Card title="Pertanyaan Umum (FAQ)" style={{ marginTop: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Q: Bagaimana jika lupa password?</Title>
            <Paragraph>
              A: Hubungi administrator Dinas Kesehatan untuk reset password.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>Q: Apakah bisa mengedit laporan yang sudah terkirim?</Title>
            <Paragraph>
              A: Tidak bisa langsung diedit. Jika ada kesalahan, Admin Dinas Kesehatan dapat mengembalikan status laporan dari "Terkirim" ke "Tersimpan" sehingga Anda bisa memperbaiki dan mengirim ulang.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>Q: Apakah harus mengisi semua sub kegiatan?</Title>
            <Paragraph>
              A: Tidak. Anda hanya perlu mengisi sub kegiatan yang memiliki aktivitas/realisasi pada periode bulan tersebut. Sub kegiatan yang tidak diisi tidak akan tersimpan.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>Q: Bagaimana cara mengisi angka dengan format ribuan?</Title>
            <Paragraph>
              A: Cukup ketik angka biasa (contoh: 1000000), sistem akan otomatis memformat menjadi 1.000.000 saat Anda berpindah ke kolom lain.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>Q: Apakah data yang sudah disimpan bisa dihapus?</Title>
            <Paragraph>
              A: Data tidak bisa dihapus, tetapi bisa dikosongkan dengan cara menghapus nilai di kolom-kolom tersebut lalu klik Simpan.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>Q: Bagaimana jika sub kegiatan yang saya butuhkan tidak muncul?</Title>
            <Paragraph>
              A: Hubungi Admin Dinas Kesehatan untuk menambahkan sub kegiatan ke dalam konfigurasi puskesmas Anda.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>Q: Siapa yang bisa dihubungi jika ada kendala teknis?</Title>
            <Paragraph>
              A: Hubungi Tim IT Dinas Kesehatan Kabupaten Bogor melalui email atau telepon yang tertera di portal resmi.
            </Paragraph>
          </div>
        </Space>
      </Card>

      <Alert
        message="Butuh Bantuan?"
        description="Jika Anda masih mengalami kesulitan dalam pengisian laporan, silakan hubungi bagian Perencanaan dan Evaluasi Dinas Kesehatan Kabupaten Bogor."
        type="warning"
        showIcon
        style={{ marginTop: 24 }}
      />
    </div>
  );
};
