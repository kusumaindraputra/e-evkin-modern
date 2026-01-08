import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Space, Spin, Tooltip } from 'antd';
import { SendOutlined, ClearOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useAuthStore } from '../store/authStore';
import Markdown from 'react-markdown';
import './ChatWidget.css';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  compact?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ compact = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();

  // Load suggested questions
  useEffect(() => {
    const loadSuggestedQuestions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/suggested-questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuggestedQuestions(response.data.questions);
      } catch (error) {
        console.error('Error loading suggested questions:', error);
      }
    };

    loadSuggestedQuestions();
  }, [token]);

  // Auto scroll to latest message - only scroll if user added new message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/chat`,
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.data.insight,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal mendapatkan analisis dari AI';
      const errorChatMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `❌ ${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendClick = () => {
    sendMessage(input);
  };

  const handleQuestionClick = (question: string) => {
    sendMessage(question);
  };

  const handleClear = () => {
    setMessages([]);
  };

  // Render layout berdasarkan compact
  if (compact) {
    return (
      <Card
        className="chat-widget-compact"
        size="small"
        title={
          <Space size="small">
            <RobotOutlined style={{ color: '#1890ff', fontSize: 14 }} />
            <span style={{ fontSize: 13 }}>Asisten Analis</span>
          </Space>
        }
        extra={
          messages.length > 0 && (
            <Tooltip title="Hapus">
              <Button type="text" size="small" icon={<ClearOutlined />} onClick={handleClear} />
            </Tooltip>
          )
        }
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: '8px 12px' } }}
      >
        {/* Chat Messages */}
        <div 
          ref={messagesContainerRef}
          style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: 8 }}
        >
          {messages.length === 0 ? (
            <div style={{ padding: '8px 0' }}>
              <Space wrap size={[4, 4]}>
                {suggestedQuestions.slice(0, 3).map((q, idx) => (
                  <Button key={idx} type="dashed" size="small" onClick={() => handleQuestionClick(q)} style={{ fontSize: 11 }}>
                    {q.length > 40 ? q.substring(0, 40) + '...' : q}
                  </Button>
                ))}
              </Space>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: 6,
                    padding: '6px 8px',
                    borderRadius: 4,
                    backgroundColor: msg.type === 'user' ? '#e6f7ff' : '#f6f8fb',
                    borderLeft: `2px solid ${msg.type === 'user' ? '#1890ff' : '#52c41a'}`,
                    fontSize: 12,
                  }}
                >
                  {msg.type === 'assistant' ? (
                    <div className="markdown-content"><Markdown>{msg.content}</Markdown></div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              ))}
              {loading && <div style={{ textAlign: 'center', padding: 4 }}><Spin size="small" /></div>}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Tanya analisis kinerja..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => handleSendClick()}
            disabled={loading}
            size="small"
            style={{ fontSize: 12 }}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSendClick} disabled={loading || !input.trim()} size="small" />
        </Space.Compact>
      </Card>
    );
  }

  // Full view
  return (
    <Card
      className="chat-widget-full"
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span>Asisten Analis Kinerja Puskesmas</span>
        </Space>
      }
      extra={
        messages.length > 0 && (
          <Tooltip title="Hapus percakapan">
            <Button type="text" icon={<ClearOutlined />} onClick={handleClear} />
          </Tooltip>
        )
      }
    >
      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef}
        style={{ minHeight: '300px', maxHeight: '500px', overflowY: 'auto', marginBottom: 16 }}
      >
        {messages.length === 0 ? (
          <div style={{ padding: '20px 0' }}>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
              Saya siap membantu menganalisis data kinerja Puskesmas. Pilih pertanyaan atau ketik langsung:
            </p>
            <Space direction="vertical" style={{ width: '100%' }}>
              {suggestedQuestions.slice(0, 5).map((q, idx) => (
                <Button key={idx} type="dashed" block onClick={() => handleQuestionClick(q)} style={{ textAlign: 'left', height: 'auto', whiteSpace: 'normal', fontSize: 13 }}>
                  {q}
                </Button>
              ))}
            </Space>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  borderRadius: 6,
                  backgroundColor: msg.type === 'user' ? '#e6f7ff' : '#f6f8fb',
                  borderLeft: `3px solid ${msg.type === 'user' ? '#1890ff' : '#52c41a'}`,
                }}
              >
                <p style={{ margin: 0, marginBottom: 4, fontWeight: 500, fontSize: 12, color: '#666' }}>
                  {msg.type === 'user' ? '👤 Pertanyaan' : '🤖 Analisis'}
                </p>
                {msg.type === 'assistant' ? (
                  <div className="markdown-content"><Markdown>{msg.content}</Markdown></div>
                ) : (
                  <p style={{ margin: 0 }}>{msg.content}</p>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: 'center', padding: 12 }}>
                <Spin size="default" />
                <p style={{ marginTop: 8, color: '#666', fontSize: 12 }}>Menganalisis data...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Tanyakan tentang kinerja Puskesmas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => handleSendClick()}
          disabled={loading}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSendClick} disabled={loading || !input.trim()} />
      </Space.Compact>
    </Card>
  );
};

export default ChatWidget;
