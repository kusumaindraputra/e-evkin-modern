import React, { useState } from 'react';
import './UploadSectionCard.css';

interface UploadSectionCardProps {
  number: number;
  title: string;
  badge?: React.ReactNode;
  statusChip?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const UploadSectionCard: React.FC<UploadSectionCardProps> = ({
  number, title, badge, statusChip, defaultOpen = false, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="uc">
      <button
        className="uc-hd"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        type="button"
      >
        <span className="uc-num">{number}</span>
        <span className="uc-title">{title}</span>
        {badge}
        {statusChip}
        <span className={`uc-chevron${open ? ' uc-chevron--open' : ''}`}>▾</span>
      </button>
      {open && <div className="uc-body">{children}</div>}
    </div>
  );
};
