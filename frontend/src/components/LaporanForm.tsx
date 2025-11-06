import { useEffect, useState } from 'react';
import { Form, Select, InputNumber, Input, Button, Space, Typography, Card, Row, Col, message } from 'antd';
import axios from 'axios';

const { TextArea } = Input;
const { Text } = Typography;
const { OptGroup, Option } = Select;

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
  const handleSubKegiatanChange = (value: number) => {
    const sub = referenceData.subKegiatan.find((s) => s.value === value);
    if (sub) {
      setSelectedIndikator(sub.indikator_kinerja || '');
      setSelectedSubKegiatan(sub.label || '');
      form.setFieldValue('id_sub_kegiatan', value);
      form.setFieldValue('id_kegiatan', sub.id_kegiatan);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await onSubmit(values);
      form.resetFields();
      setSelectedIndikator('');
      setSelectedSubKegiatan('');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menyimpan laporan');
    } finally {
      setLoading(false);
    }
  };

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

      <Card title="Sumber Anggaran dan Satuan" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Sumber Anggaran"
              name="id_sumber_anggaran"
              rules={[{ required: true, message: 'Pilih sumber anggaran!' }]}
            >
              <Select
                placeholder="Pilih sumber anggaran"
                options={referenceData.sumberAnggaran}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Satuan"
              name="id_satuan"
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
        </Row>
      </Card>

      <Card title="Target dan Anggaran" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Target Kinerja (K)"
              name="target_k"
              rules={[{ required: true, message: 'Isi target kinerja!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Anggaran Kas (Rp)"
              name="angkas"
              rules={[{ required: true, message: 'Isi anggaran kas!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                controls={false}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Target Pagu (Rp)"
              name="target_rp"
              rules={[{ required: true, message: 'Isi target pagu!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                controls={false}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Realisasi" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Realisasi Kinerja (K)"
              name="realisasi_k"
              initialValue={0}
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
              label="Realisasi Anggaran (Rp)"
              name="realisasi_rp"
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                controls={false}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Permasalahan dan Upaya" style={{ marginBottom: 16 }}>
        <Form.Item
          label="Permasalahan"
          name="permasalahan"
        >
          <TextArea
            rows={4}
            placeholder="Jelaskan permasalahan yang dihadapi (opsional)"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Upaya yang Dilakukan"
          name="upaya"
        >
          <TextArea
            rows={4}
            placeholder="Jelaskan upaya yang telah dilakukan (opsional)"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Card>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {mode === 'create' ? 'Simpan Laporan' : 'Update Laporan'}
          </Button>
          <Button onClick={onCancel}>Batal</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default LaporanForm;
