import React, { useRef } from 'react';
import type { UseDropZoneReturn, DropZoneState } from '../hooks/useDropZone';
import './DropZone.css';

interface DropZoneProps {
  accept: string;
  state: DropZoneState;
  file: File | null;
  progress: number;
  errorMsg?: string;
  handlers: UseDropZoneReturn['handlers'];
  onRetry?: () => void;
  onUploadAgain?: () => void;
}

function getExtBadge(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'xlsx') return { cls: 'fi-ico--xlsx', label: 'XLSX' };
  if (ext === 'pdf')  return { cls: 'fi-ico--pdf',  label: 'PDF'  };
  return { cls: 'fi-ico--other', label: ext.toUpperCase() || 'FILE' };
}

export const DropZone: React.FC<DropZoneProps> = ({
  accept, state, file, progress, errorMsg,
  handlers, onRetry, onUploadAgain,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const modClass: Record<DropZoneState, string> = {
    idle:  '',
    over:  'dz--over',
    file:  'dz--file',
    busy:  'dz--busy',
    ok:    'dz--ok',
    fail:  'dz--fail',
  };

  const isClickable = state === 'idle' || state === 'over';

  return (
    <div
      className={`dz ${modClass[state]}`}
      onDragEnter={handlers.onDragEnter}
      onDragLeave={handlers.onDragLeave}
      onDragOver={handlers.onDragOver}
      onDrop={handlers.onDrop}
      onClick={isClickable ? () => inputRef.current?.click() : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={state === 'idle' ? 0 : undefined}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        className="dz__input"
        type="file"
        accept={accept}
        onChange={handlers.onFileChange}
      />

      {(state === 'idle' || state === 'over') && (
        <>
          <span className="dz__icon">📂</span>
          <span className="dz__hint">
            <strong>Klik atau seret file</strong> ke sini
          </span>
          <span className="dz__hint">{accept.replace(/,/g, ' / ')}</span>
        </>
      )}

      {state === 'file' && file && (
        <FileItem file={file} onRemove={handlers.onRemove} />
      )}

      {state === 'busy' && file && (
        <>
          <FileItem file={file} onRemove={() => {}} showRemove={false} />
          <div
            className="dz__progress"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </>
      )}

      {state === 'ok' && (
        <>
          <span className="dz__ok-msg">✓ Upload berhasil</span>
          {onUploadAgain && (
            <button className="dz__retry" onClick={onUploadAgain}>
              Upload file lain
            </button>
          )}
        </>
      )}

      {state === 'fail' && (
        <>
          <span className="dz__fail-msg">{errorMsg || 'Upload gagal'}</span>
          {onRetry && (
            <button className="dz__retry" onClick={onRetry}>
              Coba lagi
            </button>
          )}
        </>
      )}
    </div>
  );
};

interface FileItemProps {
  file: File;
  onRemove: () => void;
  showRemove?: boolean;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove, showRemove = true }) => {
  const badge = getExtBadge(file.name);
  return (
    <div className="fi">
      <span className={`fi-ico ${badge.cls}`}>{badge.label}</span>
      <span className="fi-name" title={file.name}>{file.name}</span>
      {showRemove && (
        <button
          className="fi-rm"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          aria-label="Hapus file"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
};
