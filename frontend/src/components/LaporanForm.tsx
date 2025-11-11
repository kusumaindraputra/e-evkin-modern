import { useEffect, useState } from 'react';
import { Form, Select, InputNumber, Input, Button, Space, Typography, Card, Row, Col, message, Alert } from 'antd';
import axios from 'axios';

const { Text } = Typography;
const { OptGroup, Option } = Select;

const bulanOptions = [
  { value: 'Januari', label: 'Januari' },
  { value: 'Februari', label: 'Februari' },
  { value: 'Maret', label: 'Maret' },
  { value: 'April', label: 'April' },
  { value: 'Mei', label: 'Mei' },
  { value: 'Juni', label: 'Juni' },
  { value: 'Juli', label: 'Juli' },
  { value: 'Agustus', label: 'Agustus' },
  { value: 'September', label: 'September' },
  { value: 'Oktober', label: 'Oktober' },
  { value: 'November', label: 'November' },
  { value: 'Desember', label: 'Desember' },
];

interface LaporanFormProps {
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

interface ReferenceData {
  sumberAnggaran: Array<{ value: number; label: string }>;
  satuan: Array<{ value: number; label: string }>;
  kegiatan: Array<{ value: number; label: string }>;
  subKegiatan: Array<{ value: number; label: string; id_kegiatan: number; indikator_kinerja: string }>;
}

const LaporanForm: React.FC<LaporanFormProps> = ({ initialValues, onSubmit, onCancel, mode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    sumberAnggaran: [],
    satuan: [],
    kegiatan: [],
    subKegiatan: [],
  });
  const [selectedIndikator, setSelectedIndikator] = useState<string>('');
  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<string>('');
  const [assignedSumberAnggaran, setAssignedSumberAnggaran] = useState<Array<{ value: number; label: string }>>([]);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Get user info to fetch only assigned sub kegiatan
        const userStr = localStorage.getItem('user');
        let userId: number | null = null;
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id;
        }

        const [sumberAnggaranRes, satuanRes, kegiatanRes, subKegiatanRes] = await Promise.all([
          axios.get('http://localhost:5000/api/reference/sumber-anggaran', config),
          axios.get('http://localhost:5000/api/reference/satuan', config),
          axios.get('http://localhost:5000/api/reference/kegiatan', config),
          // Fetch only assigned sub kegiatan for puskesmas
          userId 
            ? axios.get(`http://localhost:5000/api/puskesmas-config/puskesmas/${userId}/sub-kegiatan`, config)
            : axios.get('http://localhost:5000/api/reference/sub-kegiatan', config),
        ]);

        // Transform assigned sub kegiatan data to match reference format
        let subKegiatanData = subKegiatanRes.data;
        if (userId && subKegiatanRes.data.assignments) {
          subKegiatanData = subKegiatanRes.data.assignments.map((assignment: any) => ({
            value: assignment.subKegiatan.id_sub_kegiatan,
            label: assignment.subKegiatan.kegiatan,
            id_kegiatan: assignment.subKegiatan.kegiatanParent?.id_kegiatan,
            indikator_kinerja: assignment.subKegiatan.indikator_kinerja,
          }));
        }

        const refData: ReferenceData = {
          sumberAnggaran: sumberAnggaranRes.data,
          satuan: satuanRes.data,
          kegiatan: kegiatanRes.data,
          subKegiatan: subKegiatanData,
        };

        setReferenceData(refData);

        // Set initial indikator if editing
        if (mode === 'edit' && initialValues?.id_sub_kegiatan) {
          const sub = refData.subKegiatan.find((s) => s.value === initialValues.id_sub_kegiatan);
          if (sub) {
            setSelectedIndikator(sub.indikator_kinerja);
            setSelectedSubKegiatan(sub.label);
            
            // Load sumber anggaran for this sub kegiatan
            try {
              const sumberDanaRes = await axios.get(
                `http://localhost:5000/api/sub-kegiatan-sumber-anggaran/by-sub-kegiatan/${initialValues.id_sub_kegiatan}`,
                config
              );
              
              const sumberAnggaranList = sumberDanaRes.data.data.map((item: any) => ({
                value: item.sumberAnggaran.id_sumber,
                label: item.sumberAnggaran.sumber,
              }));
              
              setAssignedSumberAnggaran(sumberAnggaranList);
            } catch (error) {
              console.error('Failed to load sumber anggaran:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load reference data:', error);
        message.error('Gagal memuat data referensi');
      }
    };

    loadReferenceData();
  }, [mode, initialValues]);

  // Handle sub kegiatan change
  const handleSubKegiatanChange = async (value: number) => {
    console.log('🎯 Sub kegiatan changed to:', value);
    const sub = referenceData.subKegiatan.find((s) => s.value === value);
    if (sub) {
      setSelectedIndikator(sub.indikator_kinerja || '');
      setSelectedSubKegiatan(sub.label);
      
      // Reset sumber anggaran
      form.setFieldValue('id_sumber_anggaran', undefined);
      
      // Fetch valid sumber anggaran for this sub kegiatan
      console.log('🔍 Fetching sumber anggaran assignments...');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/sub-kegiatan-sumber-anggaran/by-sub-kegiatan/${value}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('📦 Raw API response:', response.data);
        
        const sumberAnggaranList = response.data.data.map((item: any) => ({
          value: item.sumberAnggaran.id_sumber,
          label: item.sumberAnggaran.sumber,
        }));
        
        console.log('📊 Processed list:', sumberAnggaranList);
        console.log('📊 Total count:', sumberAnggaranList.length);
        setAssignedSumberAnggaran(sumberAnggaranList);
        
        if (sumberAnggaranList.length === 0) {
          message.warning('Tidak ada sumber anggaran yang tersedia untuk sub kegiatan ini. Hubungi admin.');
        }
      } catch (error) {
        console.error('Failed to fetch sumber anggaran:', error);
        message.error('Gagal memuat sumber anggaran');
        setAssignedSumberAnggaran([]);
      }
    } else {
      setSelectedIndikator('');
      setSelectedSubKegiatan('');
      setAssignedSumberAnggaran([]);
    }
    form.setFieldValue('id_sub_kegiatan', value);
    form.setFieldValue('id_kegiatan', sub?.id_kegiatan);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Transform form data to array of laporan for bulk create
      const { sumberAnggaranData, bulan, tahun, permasalahan, upaya, id_sub_kegiatan, id_kegiatan } = values;
      
      // Build array of laporan objects
      const laporanArray = Object.keys(sumberAnggaranData || {}).map((idSumberAnggaran) => {
        const data = sumberAnggaranData[idSumberAnggaran];
        return {
          id_sub_kegiatan,
          id_kegiatan,
          id_sumber_anggaran: Number(idSumberAnggaran),
          id_satuan: data.id_satuan,
          target_k: data.target_k,
          realisasi_k: data.realisasi_k,
          target_rp: data.target_rp,
          realisasi_rp: data.realisasi_rp,
          angkas: data.angkas,
          bulan,
          tahun,
          permasalahan: permasalahan || '',
          upaya: upaya || '',
        };
      });

      // Call bulk API
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/laporan/bulk', 
        { laporanArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      message.success(`Berhasil menyimpan ${laporanArray.length} laporan`);
      form.resetFields();
      setSelectedIndikator('');
      setSelectedSubKegiatan('');
      setAssignedSumberAnggaran([]);
      
      // Call parent onSubmit if needed (e.g., to refresh table)
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menyimpan laporan');
    } finally {
      setLoading(false);
    }
  };

  console.log('🎨 RENDER - assignedSumberAnggaran:', assignedSumberAnggaran);
  console.log('🎨 RENDER - count:', assignedSumberAnggaran.length);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
      autoComplete="off"
    >
      <Card title="Informasi Kegiatan" style={{ marginBottom: 16 }}>
        <Form.Item
          label="Sub Kegiatan"
          name="id_sub_kegiatan"
          rules={[{ required: true, message: 'Pilih sub kegiatan!' }]}
        >
          <Select
            placeholder="Pilih Sub Kegiatan"
            showSearch
            optionFilterProp="children"
            onChange={handleSubKegiatanChange}
            style={{ width: '100%' }}
          >
            {referenceData.kegiatan.map((kegiatan) => (
              <OptGroup key={kegiatan.value} label={kegiatan.label}>
                {referenceData.subKegiatan
                  .filter((sub) => sub.id_kegiatan === kegiatan.value)
                  .map((sub) => (
                    <Option key={sub.value} value={sub.value}>
                      {sub.label}
                    </Option>
                  ))}
              </OptGroup>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="id_kegiatan" hidden>
          <Input />
        </Form.Item>

        {selectedIndikator && (
          <Card size="small" style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff' }}>
            <Text strong>Sub Kegiatan: </Text>
            <Text>{selectedSubKegiatan}</Text>
            <br />
            <Text strong style={{ marginTop: 8, display: 'inline-block' }}>Indikator Kinerja:</Text>
            <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>
              <Text>{selectedIndikator}</Text>
            </div>
          </Card>
        )}
      </Card>

      <Card title="Sumber Anggaran dan Data Laporan" style={{ marginBottom: 16 }}>
        {assignedSumberAnggaran.length === 0 && !form.getFieldValue('id_sub_kegiatan') && (
          <Text type="secondary">Pilih sub kegiatan terlebih dahulu untuk melihat sumber anggaran yang tersedia</Text>
        )}
        
        {form.getFieldValue('id_sub_kegiatan') && assignedSumberAnggaran.length === 0 && (
          <Alert
            message="Tidak ada sumber anggaran"
            description="Tidak ada sumber anggaran yang tersedia untuk sub kegiatan ini. Hubungi admin untuk mengatur sumber anggaran."
            type="warning"
            showIcon
          />
        )}

        {assignedSumberAnggaran.map((sa, index) => (
          <Card
            key={sa.value}
            type="inner"
            title={`${index + 1}. ${sa.label}`}
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Satuan"
                  name={['sumberAnggaranData', sa.value, 'id_satuan']}
                  rules={[{ required: true, message: 'Pilih satuan!' }]}
                >
                  <Select
                    placeholder="Pilih satuan"
                    options={referenceData.satuan}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Target Kinerja (K)"
                  name={['sumberAnggaranData', sa.value, 'target_k']}
                  rules={[{ required: true, message: 'Isi target kinerja!' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Realisasi Kinerja (K)"
                  name={['sumberAnggaranData', sa.value, 'realisasi_k']}
                  rules={[{ required: true, message: 'Isi realisasi kinerja!' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Target Anggaran (Rp)"
                  name={['sumberAnggaranData', sa.value, 'target_rp']}
                  rules={[{ required: true, message: 'Isi target anggaran!' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Realisasi Anggaran (Rp)"
                  name={['sumberAnggaranData', sa.value, 'realisasi_rp']}
                  rules={[{ required: true, message: 'Isi realisasi anggaran!' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Angkas (%)"
                  name={['sumberAnggaranData', sa.value, 'angkas']}
                  rules={[{ required: true, message: 'Isi angkas!' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={100}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}
      </Card>

      {assignedSumberAnggaran.length > 0 && (
        <>
          <Card title="Periode Laporan" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Bulan"
                  name="bulan"
                  rules={[{ required: true, message: 'Pilih bulan!' }]}
                >
                  <Select placeholder="Pilih bulan" options={bulanOptions} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Tahun"
                  name="tahun"
                  rules={[{ required: true, message: 'Isi tahun!' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={2020} max={2100} placeholder="2024" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Permasalahan dan Upaya" style={{ marginBottom: 16 }}>
            <Form.Item
              label="Permasalahan"
              name="permasalahan"
            >
              <Input.TextArea rows={4} placeholder="Jelaskan permasalahan yang dihadapi (opsional)" />
            </Form.Item>

            <Form.Item
              label="Upaya Penyelesaian"
              name="upaya"
            >
              <Input.TextArea rows={4} placeholder="Jelaskan upaya yang dilakukan (opsional)" />
            </Form.Item>
          </Card>
        </>
      )}

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading} disabled={assignedSumberAnggaran.length === 0}>
            {mode === 'create' ? 'Simpan Semua Laporan' : 'Update Laporan'}
          </Button>
          <Button onClick={onCancel}>Batal</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default LaporanForm;
