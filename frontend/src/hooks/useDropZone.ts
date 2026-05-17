import { useState, useCallback } from 'react';

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
      setErrorMsg(`Ukuran file melebihi batas maksimum`);
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
      setState(s => s === 'idle' ? 'over' : s);
    }, []),

    onDragLeave: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setState(s => s === 'over' ? 'idle' : s);
    }, []),

    onDragOver: useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []),

    onDrop: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const f = (e.dataTransfer as any)?.files?.[0];
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
