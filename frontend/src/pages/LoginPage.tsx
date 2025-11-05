import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        username: values.username,
        password: values.password,
      });

      const { token, user } = response.data;
      
      login(user, token);
      message.success('Login berhasil!');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login gagal. Silakan coba lagi.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (username: string, password: string) => {
    form.setFieldsValue({ username, password });
    form.submit();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Row justify="center" style={{ width: '100%', padding: '0 16px' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: 12,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Title level={2} style={{ marginBottom: 8, color: '#667eea' }}>
                E-EVKIN
              </Title>
              <Text type="secondary">
                Sistem Evaluasi Kinerja Puskesmas
              </Text>
            </div>

            <Form
              name="login"
              form={form}
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: 'Username wajib diisi!' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Masukkan username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Password wajib diisi!' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Masukkan password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{
                    height: 48,
                    fontSize: 16,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  Masuk
                </Button>
              </Form.Item>

              {/* Quick Login Buttons for Testing */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                  Quick Login (Testing):
                </Text>
                <Row gutter={8}>
                  <Col span={12}>
                    <Button
                      size="small"
                      block
                      onClick={() => quickLogin('dinkes', 'dinkes')}
                      disabled={loading}
                      style={{ fontSize: 12 }}
                    >
                      👤 Admin Dinkes
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      size="small"
                      block
                      onClick={() => quickLogin('bojonggede', 'bogorkab')}
                      disabled={loading}
                      style={{ fontSize: 12 }}
                    >
                      🏥 Puskesmas Bojonggede
                    </Button>
                  </Col>
                </Row>
              </div>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                © 2024 E-EVKIN. All rights reserved.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
