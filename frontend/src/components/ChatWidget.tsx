import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Space, Spin, Empty, message, Collapse, Tooltip } from 'antd';
import { SendOutlined, ClearOutlined, LoadingOutlined, SmileOutlined } from '@ant-design/icons';
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
      const errorMessage = error.response?.data?.message || 'Gagal mendapatkan insight dari AI';
      message.error(errorMessage);
      
      const errorChatMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `❌ Error: ${errorMessage}`,
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
        title={
          <Space>
            <SmileOutlined style={{ color: '#1890ff' }} />
            <span>AI Insights Assistant</span>
          </Space>
        }
        extra={
          messages.length > 0 && (
            <Tooltip title="Clear conversation">
              <Button 
                type="text" 
                size="small" 
                icon={<ClearOutlined />} 
                onClick={handleClear}
              />
            </Tooltip>
          )
        }
        style={{ marginBottom: 24 }}
      >
        {/* Chat Messages */}
        <div 
          ref={messagesContainerRef}
          className="chat-messages" 
          style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: 12 }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Empty 
                description="Belum ada pertanyaan"
                style={{ margin: 0 }}
              />
              {suggestedQuestions.length > 0 && (
                <div style={{ marginTop: 12, textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>💡 Pertanyaan yang disarankan:</p>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {suggestedQuestions.slice(0, 2).map((q, idx) => (
                      <Button
                        key={idx}
                        type="dashed"
                        size="small"
                        onClick={() => handleQuestionClick(q)}
                        style={{ width: '100%', textAlign: 'left', height: 'auto', whiteSpace: 'normal' }}
                      >
                        {q}
                      </Button>
                    ))}
                  </Space>
                </div>
              )}
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.type}`}
                  style={{
                    marginBottom: 12,
                    padding: '8px 12px',
                    borderRadius: 6,
                    backgroundColor: msg.type === 'user' ? '#e6f7ff' : '#f6f8fb',
                    borderLeft: `3px solid ${msg.type === 'user' ? '#1890ff' : '#52c41a'}`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>{msg.type === 'user' ? 'You' : 'AI'}: </strong>
                  </p>
                  {msg.type === 'assistant' ? (
                    <div className="markdown-content" style={{ fontSize: 12, marginTop: 4 }}>
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <p style={{ margin: 0, marginTop: 4, fontSize: 12 }}>{msg.content}</p>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 18 }} spin />} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </Space>
          )}
        </div>

        {/* Input Area */}
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Tanya apa saja tentang performa kegiatan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => handleSendClick()}
            disabled={loading}
            size="small"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendClick}
            disabled={loading || !input.trim()}
            size="small"
          />
        </Space.Compact>

        {/* Suggested Questions Compact */}
        {messages.length > 0 && suggestedQuestions.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Collapse
              items={[
                {
                  key: '1',
                  label: '💡 Pertanyaan Lainnya',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {suggestedQuestions.map((q, idx) => (
                        <Button
                          key={idx}
                          type="dashed"
                          size="small"
                          onClick={() => handleQuestionClick(q)}
                          style={{ width: '100%', textAlign: 'left', height: 'auto', whiteSpace: 'normal' }}
                        >
                          {q}
                        </Button>
                      ))}
                    </Space>
                  ),
                }
              ]}
              size="small"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
        )}
      </Card>
    );
  }

  // Full view
  return (
    <Card
      className="chat-widget-full"
      title={
        <Space>
          <SmileOutlined style={{ color: '#1890ff' }} />
          <span>AI Insights Assistant</span>
        </Space>
      }
      extra={
        messages.length > 0 && (
          <Tooltip title="Clear conversation">
            <Button 
              type="text" 
              icon={<ClearOutlined />} 
              onClick={handleClear}
            />
          </Tooltip>
        )
      }
    >
      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef}
        className="chat-messages" 
        style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'auto', marginBottom: 16 }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Empty 
              description="Belum ada pertanyaan"
              style={{ margin: 0 }}
            />
            {suggestedQuestions.length > 0 && (
              <div style={{ marginTop: 24, textAlign: 'left' }}>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>💡 Pertanyaan yang disarankan:</p>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {suggestedQuestions.map((q, idx) => (
                    <Button
                      key={idx}
                      type="dashed"
                      block
                      onClick={() => handleQuestionClick(q)}
                      style={{ textAlign: 'left', height: 'auto', whiteSpace: 'normal' }}
                    >
                      {q}
                    </Button>
                  ))}
                </Space>
              </div>
            )}
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.type}`}
                style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  borderRadius: 8,
                  backgroundColor: msg.type === 'user' ? '#e6f7ff' : '#f6f8fb',
                  borderLeft: `4px solid ${msg.type === 'user' ? '#1890ff' : '#52c41a'}`,
                }}
              >
                <p style={{ margin: 0, marginBottom: 8, fontWeight: 500 }}>
                  {msg.type === 'user' ? '👤 Your Question' : '🤖 AI Insight'}
                </p>
                {msg.type === 'assistant' ? (
                  <div className="markdown-content">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <p style={{ margin: 0 }}>{msg.content}</p>
                )}
                <p style={{ margin: '8px 0 0 0', fontSize: 11, color: '#999' }}>
                  {msg.timestamp.toLocaleTimeString('id-ID')}
                </p>
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <p style={{ marginTop: 8, color: '#666' }}>AI sedang memproses...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </Space>
        )}
      </div>

      {/* Input Area */}
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="Tanya tentang performa kegiatan, penyerapan anggaran, atau strategi peningkatan..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => handleSendClick()}
          disabled={loading}
          size="large"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendClick}
          disabled={loading || !input.trim()}
          size="large"
        />
      </Space.Compact>

      {/* Suggested Questions */}
      {suggestedQuestions.length > 0 && (
        <div>
          <p style={{ marginBottom: 12, color: '#666', fontSize: 12 }}>💡 Atau coba pertanyaan berikut:</p>
          <Space direction="vertical" style={{ width: '100%' }}>
            {suggestedQuestions.map((q, idx) => (
              <Button
                key={idx}
                type="dashed"
                block
                onClick={() => handleQuestionClick(q)}
                style={{ textAlign: 'left', height: 'auto', whiteSpace: 'normal', justifyContent: 'flex-start' }}
              >
                {q}
              </Button>
            ))}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default ChatWidget;
