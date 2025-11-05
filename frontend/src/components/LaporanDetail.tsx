import { Card, Descriptions, Tag, Typography, Row, Col, Progress, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface LaporanDetailProps {
  laporan: {
    id: string;
    bulan: string;
    tahun: number;
    status: string;
    target_k: number;
    angkas: number;
    target_rp: number;
    realisasi_k: number;
    realisasi_rp: number;
    permasalahan: string;
    upaya: string;
    subKegiatan?: {
      kegiatan: string;
      indikator_kinerja: string;
      kegiatanParent?: {
        kegiatan: string;
        kode: string;
      };
    };
    sumberAnggaran?: {
      sumber: string;
    };
    satuan?: {
      satuannya: string;
    };
    created_at: string;
    updated_at: string;
  };
}

const LaporanDetail: React.FC<LaporanDetailProps> = ({ laporan }) => {
  const formatNumber = (num: number) => {
    return num?.toLocaleString('id-ID') || '0';
  };

  const formatCurrency = (num: number) => {
    return `Rp ${num?.toLocaleString('id-ID') || '0'}`;
  };

  const calculatePercentage = (realisasi: number, target: number) => {
    if (!target || target === 0) return 0;
    return Math.round((realisasi / target) * 100);
  };

  const capaianKinerja = calculatePercentage(laporan.realisasi_k, laporan.target_k);
  const capaianAnggaranKas = calculatePercentage(laporan.realisasi_rp, laporan.angkas);
  const capaianPagu = calculatePercentage(laporan.realisasi_rp, laporan.target_rp);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#52c41a'; // green
    if (percentage >= 70) return '#1890ff'; // blue
    if (percentage >= 50) return '#faad14'; // orange
    return '#ff4d4f'; // red
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'diverifikasi':
        return { color: 'success', icon: <CheckCircleOutlined />, text: 'Diverifikasi' };
      case 'terkirim':
        return { color: 'processing', icon: <ClockCircleOutlined />, text: 'Terkirim' };
      case 'menunggu':
        return { color: 'warning', icon: <ClockCircleOutlined />, text: 'Menunggu' };
      case 'ditolak':
        return { color: 'error', icon: <CloseCircleOutlined />, text: 'Ditolak' };
      default:
        return { color: 'default', icon: null, text: status };
    }
  };

  const statusConfig = getStatusConfig(laporan.status);

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Laporan {laporan.bulan} {laporan.tahun}
            </Title>
          </Col>
          <Col>
            <Tag color={statusConfig.color} icon={statusConfig.icon} style={{ fontSize: 14, padding: '4px 12px' }}>
              {statusConfig.text}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Informasi Kegiatan */}
      <Card title="Informasi Kegiatan" style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Kode Kegiatan">
            {laporan.subKegiatan?.kegiatanParent?.kode || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Kegiatan">
            {laporan.subKegiatan?.kegiatanParent?.kegiatan || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Sub Kegiatan">
            <Text strong>{laporan.subKegiatan?.kegiatan || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Indikator Kinerja">
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {laporan.subKegiatan?.indikator_kinerja || '-'}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Sumber Anggaran & Satuan */}
      <Card title="Sumber Anggaran & Satuan" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Sumber Anggaran">
            {laporan.sumberAnggaran?.sumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Satuan">
            {laporan.satuan?.satuannya || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Target dan Realisasi Kinerja */}
      <Card title="Capaian Kinerja" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f5ff' }}>
              <Text type="secondary">Target Kinerja</Text>
              <Title level={3} style={{ margin: '8px 0' }}>
                {formatNumber(laporan.target_k)}
              </Title>
              <Text>{laporan.satuan?.satuannya}</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
              <Text type="secondary">Realisasi Kinerja</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#52c41a' }}>
                {formatNumber(laporan.realisasi_k)}
              </Title>
              <Text>{laporan.satuan?.satuannya}</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text type="secondary">Capaian Kinerja</Text>
              <Title level={2} style={{ margin: '8px 0', color: getProgressColor(capaianKinerja) }}>
                {capaianKinerja}%
              </Title>
              <Progress 
                percent={capaianKinerja} 
                strokeColor={getProgressColor(capaianKinerja)}
                showInfo={false}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Target dan Realisasi Anggaran */}
      <Card title="Capaian Anggaran" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Target Pagu">
                  <Text strong>{formatCurrency(laporan.target_rp)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Anggaran Kas">
                  <Text strong>{formatCurrency(laporan.angkas)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Realisasi Anggaran">
                  <Text strong style={{ color: '#52c41a' }}>
                    {formatCurrency(laporan.realisasi_rp)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" style={{ height: '100%' }}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">Capaian Anggaran Kas</Text>
                <Title level={4} style={{ margin: '4px 0', color: getProgressColor(capaianAnggaranKas) }}>
                  {capaianAnggaranKas}%
                </Title>
                <Progress 
                  percent={capaianAnggaranKas} 
                  strokeColor={getProgressColor(capaianAnggaranKas)}
                />
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text type="secondary">Capaian Pagu Anggaran</Text>
                <Title level={4} style={{ margin: '4px 0', color: getProgressColor(capaianPagu) }}>
                  {capaianPagu}%
                </Title>
                <Progress 
                  percent={capaianPagu} 
                  strokeColor={getProgressColor(capaianPagu)}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Permasalahan dan Upaya */}
      {(laporan.permasalahan || laporan.upaya) && (
        <Card title="Permasalahan dan Upaya" style={{ marginBottom: 16 }}>
          <Descriptions column={1} bordered>
            {laporan.permasalahan && (
              <Descriptions.Item label="Permasalahan">
                <div style={{ whiteSpace: 'pre-wrap' }}>{laporan.permasalahan}</div>
              </Descriptions.Item>
            )}
            {laporan.upaya && (
              <Descriptions.Item label="Upaya yang Dilakukan">
                <div style={{ whiteSpace: 'pre-wrap' }}>{laporan.upaya}</div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Info Timestamps */}
      <Card size="small">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Dibuat">
            {new Date(laporan.created_at).toLocaleString('id-ID')}
          </Descriptions.Item>
          <Descriptions.Item label="Diupdate">
            {new Date(laporan.updated_at).toLocaleString('id-ID')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default LaporanDetail;
