import React from 'react';
import { Card, Typography, Alert, Space, List, Collapse, Tag, Steps } from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  WarningOutlined,
  AimOutlined,
  SendOutlined,
  SaveOutlined,
  TableOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

export const CaraPengisianPage: React.FC = () => {
  return (
    <div>
      <Title level={3}>Panduan Pengisian e-evkin</Title>
      <Paragraph type="secondary">
        Panduan lengkap penggunaan sistem e-evkin untuk pelaporan evaluasi kinerja puskesmas.
      </Paragraph>

      <Alert
        message="Fitur Utama Puskesmas"
        description={
          <Space direction="vertical" size={0}>
            <Text><Tag color="blue">Laporan Kinerja</Tag> Input dan kirim laporan bulanan</Text>
            <Text><Tag color="green">Target & Angkas</Tag> Lihat target anggaran dan alokasi kas</Text>
            <Text><Tag color="orange">Cara Pengisian</Tag> Panduan penggunaan sistem (halaman ini)</Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Quick Start Guide */}
      <Card title={<><CalendarOutlined /> Alur Kerja Bulanan</>} style={{ marginBottom: 24 }}>
        <Steps
          direction="vertical"
          current={-1}
          items={[
            {
              title: 'Cek Target & Angkas',
              description: 'Pastikan target anggaran dan angkas sudah ter-upload oleh Dinkes untuk bulan berjalan.',
              icon: <AimOutlined />,
            },
            {
              title: 'Input Laporan Kinerja',
              description: 'Pilih bulan/tahun, isi realisasi untuk setiap sub kegiatan yang telah dikonfigurasi.',
              icon: <EditOutlined />,
            },
            {
              title: 'Simpan Laporan',
              description: 'Klik tombol "Simpan" untuk menyimpan data. Status menjadi "Tersimpan".',
              icon: <SaveOutlined />,
            },
            {
              title: 'Kirim ke Dinkes',
              description: 'Setelah yakin data benar, klik "Kirim Semua" untuk mengirim ke Dinas Kesehatan.',
              icon: <SendOutlined />,
            },
          ]}
        />
      </Card>

      {/* Menu Target & Angkas */}
      <Card
        title={<><AimOutlined style={{ marginRight: 8 }} />Menu Target & Angkas</>}
        style={{ marginBottom: 24 }}
      >
        <Alert
          message="Fitur Baru!"
          description="Menu ini menampilkan data target anggaran (pagu) dan angkas (alokasi kas bulanan) yang telah di-upload oleh Admin Dinkes."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Paragraph>
          Di menu <Text strong>Target & Angkas</Text>, Anda dapat melihat:
        </Paragraph>
        <List
          size="small"
          dataSource={[
            'Target Anggaran - Pagu tahunan per sub kegiatan dan sumber anggaran',
            'Angkas (Anggaran Kas) - Alokasi bulanan (Jan-Des) untuk setiap sub kegiatan',
            'Total angkas kumulatif hingga bulan yang dipilih',
            'Perbandingan target vs angkas untuk monitoring penyerapan',
          ]}
          renderItem={(item) => <List.Item>• {item}</List.Item>}
        />
        <Alert
          message="Catatan"
          description="Data target dan angkas di-upload oleh Admin Dinkes via Excel/PDF. Jika ada ketidaksesuaian, hubungi Admin."
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Menu Laporan Kinerja */}
      <Card
        title={<><FileTextOutlined style={{ marginRight: 8 }} />Menu Laporan Kinerja</>}
        style={{ marginBottom: 24 }}
      >
        <Collapse defaultActiveKey={['1']} ghost>
          <Panel header={<Text strong>1. Memilih Periode</Text>} key="1">
            <Paragraph>
              <CalendarOutlined style={{ marginRight: 8 }} />
              Gunakan dropdown <Text code>Bulan</Text> dan <Text code>Tahun</Text> di bagian atas untuk memilih periode laporan.
            </Paragraph>
            <Alert
              message="Tips"
              description="Sistem akan otomatis memuat data yang sudah tersimpan jika ada."
              type="info"
              showIcon
            />
          </Panel>

          <Panel header={<Text strong>2. Mengisi Data Tabel</Text>} key="2">
            <Paragraph>
              <TableOutlined style={{ marginRight: 8 }} />
              Tabel akan menampilkan semua sub kegiatan yang dikonfigurasi untuk puskesmas Anda.
            </Paragraph>
            <Title level={5}>Kolom yang Harus Diisi:</Title>
            <List
              size="small"
              dataSource={[
                { field: 'Sumber Anggaran', desc: 'BLUD, DAK Non Fisik, APBD, atau JKN' },
                { field: 'Satuan', desc: 'Orang, Dokumen, Kegiatan, Paket, dll' },
                { field: 'Target (K)', desc: 'Target kuantitas (jumlah unit)' },
                { field: 'Target Anggaran (Rp)', desc: 'Pagu tahunan dalam rupiah' },
                { field: 'Realisasi (K)', desc: 'Realisasi kuantitas' },
                { field: 'Realisasi (Rp)', desc: 'Realisasi anggaran dalam rupiah' },
                { field: 'Permasalahan', desc: 'Kendala yang dihadapi (opsional)' },
                { field: 'Upaya', desc: 'Solusi yang dilakukan (opsional)' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Text strong>{item.field}</Text> - {item.desc}
                </List.Item>
              )}
            />
            <Alert
              message="Format Angka Otomatis"
              description="Ketik angka biasa (misal: 1000000), sistem otomatis format menjadi 1.000.000"
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Panel>

          <Panel header={<Text strong>3. Menyimpan & Mengirim</Text>} key="3">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Tag color="default">Simpan</Tag>
                <Paragraph style={{ marginTop: 8 }}>
                  Klik <Text strong>"Simpan"</Text> untuk menyimpan data. Status berubah ke <Tag color="blue">Tersimpan</Tag> dan masih bisa diedit.
                </Paragraph>
              </div>
              <div>
                <Tag color="blue">Kirim Semua</Tag>
                <Paragraph style={{ marginTop: 8 }}>
                  Klik <Text strong>"Kirim Semua"</Text> untuk mengirim ke Dinkes. Status berubah ke <Tag color="green">Terkirim</Tag> dan tidak bisa diedit lagi.
                </Paragraph>
              </div>
            </Space>
          </Panel>
        </Collapse>
      </Card>

      {/* Status Laporan */}
      <Card title="Status Laporan" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Tag>Belum Disimpan</Tag>
            <Text> - Data baru, belum tersimpan ke sistem</Text>
          </div>
          <div>
            <Tag color="blue">Tersimpan</Tag>
            <Text> - Data tersimpan, masih bisa diedit</Text>
          </div>
          <div>
            <Tag color="green">Terkirim</Tag>
            <Text> - Sudah dikirim ke Dinkes, tidak bisa diedit</Text>
          </div>
          <div>
            <Tag color="green">Diverifikasi</Tag>
            <Text> - Sudah diverifikasi oleh Admin Dinkes</Text>
          </div>
        </Space>

        <Alert
          message="Perlu Koreksi?"
          description="Jika laporan sudah terkirim dan perlu dikoreksi, hubungi Admin Dinkes untuk mengembalikan status ke 'Tersimpan'."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* FAQ */}
      <Card title={<><InfoCircleOutlined /> Pertanyaan Umum (FAQ)</>} style={{ marginBottom: 24 }}>
        <Collapse ghost>
          <Panel header="Bagaimana jika lupa password?" key="1">
            <Paragraph>Hubungi Administrator Dinas Kesehatan untuk reset password.</Paragraph>
          </Panel>
          <Panel header="Apakah bisa mengedit laporan yang sudah terkirim?" key="2">
            <Paragraph>
              Tidak bisa langsung. Admin Dinkes dapat mengembalikan status dari "Terkirim" ke "Tersimpan"
              agar Anda bisa memperbaiki data.
            </Paragraph>
          </Panel>
          <Panel header="Bagaimana jika sub kegiatan tidak muncul?" key="3">
            <Paragraph>
              Hubungi Admin Dinkes untuk menambahkan sub kegiatan ke konfigurasi puskesmas Anda
              di menu "Konfigurasi Sub Kegiatan".
            </Paragraph>
          </Panel>
          <Panel header="Target dan Angkas tidak sesuai?" key="4">
            <Paragraph>
              Data target dan angkas di-upload oleh Admin Dinkes dari file Excel/PDF.
              Jika ada ketidaksesuaian, hubungi Admin untuk melakukan koreksi di menu "Edit Target & Angkas".
            </Paragraph>
          </Panel>
          <Panel header="Apakah harus mengisi semua sub kegiatan?" key="5">
            <Paragraph>
              Tidak. Cukup isi sub kegiatan yang memiliki aktivitas/realisasi pada bulan tersebut.
              Sub kegiatan yang tidak diisi akan tetap kosong.
            </Paragraph>
          </Panel>
          <Panel header="Apa beda Target Anggaran dan Angkas?" key="6">
            <Paragraph>
              <Text strong>Target Anggaran (Pagu)</Text>: Total anggaran tahunan yang dialokasikan.
              <br />
              <Text strong>Angkas</Text>: Rencana pencairan/penggunaan anggaran per bulan.
              Total angkas setahun = Target Anggaran.
            </Paragraph>
          </Panel>
        </Collapse>
      </Card>

      {/* Contact */}
      <Alert
        message="Butuh Bantuan?"
        description="Hubungi bagian Perencanaan dan Evaluasi Dinas Kesehatan Kabupaten Bogor untuk bantuan teknis."
        type="warning"
        showIcon
        icon={<WarningOutlined />}
      />
    </div>
  );
};

export default CaraPengisianPage;
