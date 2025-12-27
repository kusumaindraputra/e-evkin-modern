import React from 'react';
import { InputNumber, Input, Tag } from 'antd';

const { TextArea } = Input;

interface LaporanInputCellProps {
  type: 'number' | 'textarea' | 'tag';
  value?: number | string;
  onChange?: (value: any) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  formatter?: (value: number | undefined) => string;
  parser?: (value: string | undefined) => number;
  label?: string;
  color?: string;
  textAlign?: 'left' | 'right' | 'center';
}

/**
 * Memoized input cell component untuk table cells
 * Prevents unnecessary re-renders when other rows change
 */
export const LaporanInputCell = React.memo<LaporanInputCellProps>(({
  type,
  value,
  onChange,
  disabled = false,
  min,
  max,
  step,
  formatter,
  parser,
  label,
  color,
  textAlign = 'left',
}) => {
  if (type === 'tag') {
    return <Tag color={color}>{label}</Tag>;
  }

  if (type === 'textarea') {
    return (
      <TextArea
        value={value as string}
        onChange={(e) => onChange?.(e.target.value)}
        rows={2}
        disabled={disabled}
      />
    );
  }

  if (type === 'number') {
    return (
      <InputNumber
        style={{ width: '100%', textAlign }}
        value={value as number}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        controls={false}
        formatter={formatter}
        parser={parser}
        disabled={disabled}
      />
    );
  }

  return null;
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if these specific props change
  return (
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled
  );
});

LaporanInputCell.displayName = 'LaporanInputCell';
