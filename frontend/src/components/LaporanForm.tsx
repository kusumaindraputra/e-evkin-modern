import { useEffect, useState } from 'react';
import { Form, Select, InputNumber, Input, Button, Space, Typography, Card, Row, Col, message, Alert } from 'antd';
import axios from 'axios';
import API_BASE_URL from '../config/api';

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
  const [targetData, setTargetData] = useState<Record<number, { target_k: number; target_rp: number }>>({});

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      console.log('🚀 LaporanForm: Starting loadReferenceData...');
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Get user info to fetch only assigned sub kegiatan
        const userStr = localStorage.getItem('user');
        let userId: number | null = null;
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id;
          console.log('👤 User ID:', userId);
        }

        const tahunSekarang = new Date().getFullYear();
        console.log('📅 Tahun sekarang:', tahunSekarang);

        console.log('📡 Fetching data from APIs...');
        const [sumberAnggaranRes, satuanRes, kegiatanRes, assignedWithTargetsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/reference/sumber-anggaran`, config),
          axios.get(`${API_BASE_URL}/reference/satuan`, config),
          axios.get(`${API_BASE_URL}/reference/kegiatan`, config),
          // Fetch sub kegiatan yang sudah ada targetnya di tahun ini (STRICT)
          userId 
            ? axios.get(`${API_BASE_URL}/target/assigned?tahun=${tahunSekarang}`, config)
            : axios.get(`${API_BASE_URL}/reference/sub-kegiatan`, config),
        ]);

        console.log('✅ All API responses received');

        // Transform data: hanya tampilkan sub kegiatan yang ADA TARGET-nya
        let subKegiatanData: any[] = [];
        if (userId && assignedWithTargetsRes.data.data) {
          console.log('🔍 Raw target data:', assignedWithTargetsRes.data.data);
          
          // Filter hanya yang punya targets (STRICT)
          subKegiatanData = assignedWithTargetsRes.data.data
            .filter((item: any) => item.targets && item.targets.length > 0)
            .map((item: any) => ({
              value: item.subKegiatan.id_sub_kegiatan,
              label: item.subKegiatan.kegiatan,
              id_kegiatan: item.subKegiatan.kegiatanParent?.id_kegiatan,
              indikator_kinerja: item.subKegiatan.indikator_kinerja,
            }));
          
          console.log('📊 Filtered sub kegiatan:', subKegiatanData.length, subKegiatanData);
          
          if (subKegiatanData.length === 0) {
            message.warning('Belum ada sub kegiatan dengan target yang diset untuk tahun ini. Hubungi admin.');
          }
        } else {
          subKegiatanData = assignedWithTargetsRes.data;
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
                `${API_BASE_URL}/sub-kegiatan-sumber-anggaran/by-sub-kegiatan/${initialValues.id_sub_kegiatan}`,
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
        console.error('❌ Failed to load reference data:', error);
        if (error.response) {
          console.error('Response error:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('Request error (no response):', error.request);
        } else {
          console.error('Error message:', error.message);
        }
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
          `${API_BASE_URL}/sub-kegiatan-sumber-anggaran/by-sub-kegiatan/${value}`,
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

        // Fetch targets for this sub kegiatan and assigned sumber anggaran
        const tahunValue = form.getFieldValue('tahun') || new Date().getFullYear();
        const targetsMap: Record<number, { target_k: number; target_rp: number }> = {};
        
        for (const sa of sumberAnggaranList) {
          try {
            const targetRes = await axios.get(
              `${API_BASE_URL}/target/latest/${value}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                  tahun: tahunValue,
                  id_sumber_anggaran: sa.value,
                },
              }
            );
            
            if (targetRes.data.success && targetRes.data.data) {
              targetsMap[sa.value] = {
                target_k: targetRes.data.data.target_k,
                target_rp: targetRes.data.data.target_rp,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch target for sumber anggaran ${sa.value}:`, error);
          }
        }
        
        setTargetData(targetsMap);
        
      } catch (error) {
        console.error('Failed to fetch sumber anggaran:', error);
        message.error('Gagal memuat sumber anggaran');
        setAssignedSumberAnggaran([]);
        setTargetData({});
      }
    } else {
      setSelectedIndikator('');
      setSelectedSubKegiatan('');
      setAssignedSumberAnggaran([]);
      setTargetData({});
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
        const idSumberAnggaranNum = Number(idSumberAnggaran);
        const targetForSumber = targetData[idSumberAnggaranNum] || { target_k: 0, target_rp: 0 };
        
        return {
          id_sub_kegiatan,
          id_kegiatan,
          id_sumber_anggaran: idSumberAnggaranNum,
          id_satuan: data.id_satuan,
          target_k: targetForSumber.target_k,
          realisasi_k: data.realisasi_k,
          target_rp: targetForSumber.target_rp,
          realisasi_rp: data.realisasi_rp,
          realisasi_fisik: data.realisasi_fisik || 0,
          angkas: data.angkas,
          bulan,
          tahun,
          permasalahan: permasalahan || '',
          upaya: upaya || '',
        };
      });

      // Call bulk API
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/laporan/bulk`, 
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
                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>Target Kinerja (K)</Text>
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
                    {targetData[sa.value] ? (
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        {targetData[sa.value].target_k.toLocaleString('id-ID')}
                      </Text>
                    ) : (
                      <Text type="secondary">Target belum diset oleh admin</Text>
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Realisasi Kinerja (K)"
                  name={['sumberAnggaranData', sa.value, 'realisasi_k']}
                  rules={[
                    { required: true, message: 'Isi realisasi kinerja!' },
                    () => ({
                      validator(_, value) {
                        const target = targetData[sa.value];
                        if (!target) {
                          return Promise.reject(new Error('Target belum diset untuk sumber anggaran ini'));
                        }
                        if (value > target.target_k) {
                          return Promise.reject(new Error(`Realisasi tidak boleh melebihi target (${target.target_k})`));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>Target Anggaran (Rp)</Text>
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
                    {targetData[sa.value] ? (
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        Rp {targetData[sa.value].target_rp.toLocaleString('id-ID')}
                      </Text>
                    ) : (
                      <Text type="secondary">Target belum diset oleh admin</Text>
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Realisasi Anggaran (Rp)"
                  name={['sumberAnggaranData', sa.value, 'realisasi_rp']}
                  rules={[
                    { required: true, message: 'Isi realisasi anggaran!' },
                    () => ({
                      validator(_, value) {
                        const target = targetData[sa.value];
                        if (!target) {
                          return Promise.reject(new Error('Target belum diset untuk sumber anggaran ini'));
                        }
                        if (value > target.target_rp) {
                          return Promise.reject(new Error(`Realisasi tidak boleh melebihi target (Rp ${target.target_rp.toLocaleString('id-ID')})`));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
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

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Realisasi Fisik (%)"
                  name={['sumberAnggaranData', sa.value, 'realisasi_fisik']}
                  rules={[{ required: true, message: 'Isi realisasi fisik!' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={100}
                    placeholder="0"
                    step={0.01}
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
