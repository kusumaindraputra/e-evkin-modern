import { useState, useCallback, useRef } from 'react';

export type DropZoneState = 'idle' | 'over' | 'file' | 'busy' | 'ok' | 'fail';

interface UseDropZoneOptions {
  accept: string;
  maxSize?: number;
}

export interface UseDropZoneReturn {
  state: DropZoneState;
  file: File | null;
  progress: number;
  errorMsg: string;
  handlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
  };
  reset: () => void;
  setProgress: (n: number) => void;
  setFail: (msg: string) => void;
  setOk: () => void;
}

export function useDropZone({ accept, maxSize = 20 * 1024 * 1024 }: UseDropZoneOptions): UseDropZoneReturn {
  const [state, setState] = useState<DropZoneState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgressState] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const dragCounter = useRef(0);

  const acceptFile = useCallback((f: File) => {
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase();
    const accepted = accept.split(',').map(a => a.trim().toLowerCase());
    if (!accepted.includes(ext)) {
      setState('fail');
      setErrorMsg(`Format tidak didukung. Gunakan ${accept}`);
      return;
    }
    if (f.size > maxSize) {
      setState('fail');
      const sizeLabel = maxSize >= 1024 * 1024
        ? `${Math.round(maxSize / 1024 / 1024)} MB`
        : maxSize >= 1024
          ? `${Math.round(maxSize / 1024)} KB`
          : `${maxSize} B`;
      setErrorMsg(`Ukuran file melebihi batas ${sizeLabel}`);
      return;
    }
    setFile(f);
    setState('file');
    setErrorMsg('');
    setProgressState(0);
  }, [accept, maxSize]);

  const handlers = {
    onDragEnter: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      setState(s => s === 'idle' ? 'over' : s);
    }, []),

    onDragLeave: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) {
        setState(s => s === 'over' ? 'idle' : s);
      }
    }, []),

    onDragOver: useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []),

    onDrop: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      const f = e.dataTransfer?.files?.[0];
      if (f) acceptFile(f);
    }, [acceptFile]),

    onFileChange: useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) acceptFile(f);
      e.target.value = '';
    }, [acceptFile]),

    onRemove: useCallback(() => {
      setFile(null);
      setState('idle');
      setErrorMsg('');
      setProgressState(0);
    }, []),
  };

  const reset = useCallback(() => {
    dragCounter.current = 0;
    setFile(null);
    setState('idle');
    setErrorMsg('');
    setProgressState(0);
  }, []);

  const setProgress = useCallback((n: number) => {
    setState('busy');
    setProgressState(n);
  }, []);

  const setFail = useCallback((msg: string) => {
    setState('fail');
    setErrorMsg(msg);
  }, []);

  const setOk = useCallback(() => {
    setState('ok');
  }, []);

  return { state, file, progress, errorMsg, handlers, reset, setProgress, setFail, setOk };
}
