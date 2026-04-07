import React from 'react';
import { Empty, Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import './EvkinEmpty.css';

interface EvkinEmptyProps {
  icon?: React.ReactNode;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EvkinEmpty: React.FC<EvkinEmptyProps> = ({
  icon,
  description,
  actionText,
  onAction,
}) => (
  <div className="evkin-empty">
    <Empty
      image={icon || <FileTextOutlined className="evkin-empty-icon" />}
      description={<span className="evkin-empty-text">{description}</span>}
    >
      {actionText && onAction && (
        <Button type="primary" onClick={onAction}>{actionText}</Button>
      )}
    </Empty>
  </div>
);
