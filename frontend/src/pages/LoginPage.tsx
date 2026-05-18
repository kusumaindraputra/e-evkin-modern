import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { gradients } from '../theme';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import logoImg from '../assets/logo.png';

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
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: values.username,
        password: values.password,
      });

      const { token, user } = response.data;

      login(user, token);
      message.success('Login berhasil!');
      navigate(user.role === 'admin' ? '/dashboard' : '/puskesmas/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login gagal. Silakan coba lagi.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: gradients.login,
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
              <img src={logoImg} alt="e-evkin logo" style={{ width: 80, height: 'auto', marginBottom: 12, filter: 'brightness(0) saturate(100%) invert(32%) sepia(93%) saturate(1038%) hue-rotate(178deg) brightness(91%) contrast(96%)' }} />
              <Title level={2} style={{ marginBottom: 8, color: 'var(--c-prim)' }}>
                e-evkin
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
                  { required: true, message: 'Username wajib diisi' },
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
                  { required: true, message: 'Password wajib diisi' },
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
                    background: gradients.login,
                    border: 'none',
                  }}
                >
                  Masuk
                </Button>
              </Form.Item>

            </Form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                © 2024 e-evkin. All rights reserved.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
