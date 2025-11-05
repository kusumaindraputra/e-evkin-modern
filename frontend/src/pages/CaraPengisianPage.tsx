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
        description="Laporan harus diisi setiap bulan sesuai dengan periode kegiatan. Pastikan semua data yang diinput sudah benar sebelum mengirim laporan ke Dinas Kesehatan."
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
              title: 'Akses Menu Laporan',
              description: 'Klik menu "Laporan Kinerja" pada sidebar untuk melihat daftar laporan.',
              icon: <FileTextOutlined />,
            },
            {
              title: 'Buat Laporan Baru',
              description: 'Klik tombol "Tambah Laporan" untuk membuat laporan baru.',
              icon: <EditOutlined />,
            },
            {
              title: 'Isi Form Laporan',
              description: 'Lengkapi semua field yang tersedia dengan data yang akurat.',
              icon: <EditOutlined />,
            },
            {
              title: 'Simpan Draft',
              description: 'Simpan draft terlebih dahulu jika belum siap mengirim.',
              icon: <CheckCircleOutlined />,
            },
            {
              title: 'Kirim Laporan',
              description: 'Klik "Kirim Laporan" jika semua data sudah lengkap dan benar.',
              icon: <CheckCircleOutlined />,
            },
          ]}
        />
      </Card>

      <Card title="Penjelasan Field Laporan" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>1. Kegiatan</Title>
            <Paragraph>
              Pilih kegiatan utama dari dropdown yang tersedia. Kegiatan sudah disesuaikan dengan program kerja puskesmas.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>2. Sub Kegiatan</Title>
            <Paragraph>
              Pilih sub kegiatan yang sesuai dengan kegiatan utama. Sub kegiatan akan muncul otomatis setelah kegiatan dipilih.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>3. Sumber Anggaran</Title>
            <Paragraph>
              Pilih sumber anggaran yang digunakan untuk kegiatan ini:
            </Paragraph>
            <List
              size="small"
              dataSource={[
                'BLUD Puskesmas',
                'DAK Non Fisik',
                'APBD Kabupaten',
                'JKN (Dana Kapitasi)',
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />
          </div>

          <Divider />

          <div>
            <Title level={5}>4. Satuan</Title>
            <Paragraph>
              Pilih satuan yang sesuai dengan jenis kegiatan (contoh: Orang, Dokumen, Kegiatan, dll).
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>5. Target Kuantitas (Target K)</Title>
            <Paragraph>
              Isi jumlah target kuantitas kegiatan yang direncanakan dalam periode laporan.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>6. Anggaran Kas (Angkas)</Title>
            <Paragraph>
              Isi total anggaran kas yang dialokasikan untuk kegiatan ini dalam rupiah.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>7. Target Rupiah (Target Rp)</Title>
            <Paragraph>
              Isi target dana yang akan direalisasikan dalam rupiah.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>8. Realisasi Kuantitas (Realisasi K)</Title>
            <Paragraph>
              Isi jumlah realisasi kuantitas kegiatan yang sudah dilaksanakan.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>9. Realisasi Rupiah (Realisasi Rp)</Title>
            <Paragraph>
              Isi jumlah dana yang sudah direalisasikan dalam rupiah.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>10. Permasalahan</Title>
            <Paragraph>
              Jelaskan kendala atau permasalahan yang dihadapi dalam pelaksanaan kegiatan (jika ada).
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>11. Upaya Pemecahan Masalah</Title>
            <Paragraph>
              Jelaskan upaya atau solusi yang telah/akan dilakukan untuk mengatasi permasalahan.
            </Paragraph>
          </div>
        </Space>
      </Card>

      <Card title="Tips Pengisian" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message="Akurasi Data"
            description="Pastikan semua angka yang diinput sesuai dengan data riil di lapangan."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
          <Alert
            message="Kelengkapan"
            description="Lengkapi semua field yang wajib diisi (ditandai dengan tanda bintang merah)."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
          <Alert
            message="Waktu Pengisian"
            description="Laporan harus diisi paling lambat tanggal 5 setiap bulan untuk periode bulan sebelumnya."
            type="info"
            showIcon
          />
          <Alert
            message="Draft & Edit"
            description="Anda dapat menyimpan draft dan mengedit laporan selama statusnya masih 'Menunggu'. Setelah dikirim, laporan tidak dapat diedit lagi."
            type="info"
            showIcon
          />
        </Space>
      </Card>

      <Card title="Status Laporan">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ color: '#faad14' }}>● Menunggu:</Text>
            <Paragraph style={{ marginLeft: 20 }}>
              Laporan dalam bentuk draft dan belum dikirim ke Dinas Kesehatan.
            </Paragraph>
          </div>

          <div>
            <Text strong style={{ color: '#1890ff' }}>● Terkirim:</Text>
            <Paragraph style={{ marginLeft: 20 }}>
              Laporan sudah dikirim dan sedang menunggu verifikasi dari Dinas Kesehatan.
            </Paragraph>
          </div>

          <div>
            <Text strong style={{ color: '#52c41a' }}>● Diverifikasi:</Text>
            <Paragraph style={{ marginLeft: 20 }}>
              Laporan telah diverifikasi dan disetujui oleh Dinas Kesehatan.
            </Paragraph>
          </div>

          <div>
            <Text strong style={{ color: '#ff4d4f' }}>● Ditolak:</Text>
            <Paragraph style={{ marginLeft: 20 }}>
              Laporan ditolak dan perlu diperbaiki. Silakan cek catatan dari verifikator.
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
              A: Tidak. Laporan yang sudah terkirim tidak dapat diedit. Jika ada kesalahan, laporan akan ditolak oleh verifikator dan Anda dapat memperbaiki kemudian mengirim ulang.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>Q: Berapa lama proses verifikasi?</Title>
            <Paragraph>
              A: Proses verifikasi biasanya memakan waktu 3-5 hari kerja setelah laporan dikirim.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={5}>Q: Bagaimana cara menghapus laporan?</Title>
            <Paragraph>
              A: Laporan hanya bisa dihapus jika statusnya masih "Menunggu". Klik tombol hapus pada baris laporan yang ingin dihapus.
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
