import React from 'react';
import { Modal, ModalProps } from 'antd';

export interface AppModalProps extends ModalProps {
  title: React.ReactNode;
  width?: number | string;
  footer?: React.ReactNode;
  onCancel: () => void;
  open: boolean;
  children: React.ReactNode;
}

const DEFAULT_WIDTH = 520;

export const AppModal: React.FC<AppModalProps> = ({
  title,
  width = DEFAULT_WIDTH,
  footer,
  onCancel,
  open,
  children,
  ...rest
}) => (
  <Modal
    title={title}
    width={width}
    footer={footer}
    onCancel={onCancel}
    open={open}
    centered
    destroyOnClose
    maskClosable={false}
    {...rest}
  >
    {children}
  </Modal>
);

export default AppModal;
