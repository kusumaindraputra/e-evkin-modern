// @vitest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDropZone } from './useDropZone';

const xlsxFile = () => new File([''], 'data.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
const pdfFile = () => new File([''], 'doc.pdf', { type: 'application/pdf' });
const dragEvent = (files: File[] = []) => ({
  preventDefault: () => {},
  dataTransfer: { files },
} as unknown as React.DragEvent);

describe('useDropZone', () => {
  it('starts in idle state with no file', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    expect(result.current.state).toBe('idle');
    expect(result.current.file).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it('idle → over on dragenter', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDragEnter(dragEvent()));
    expect(result.current.state).toBe('over');
  });

  it('over → idle on dragleave', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDragEnter(dragEvent()));
    act(() => result.current.handlers.onDragLeave(dragEvent()));
    expect(result.current.state).toBe('idle');
  });

  it('over → file on valid drop', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    const f = xlsxFile();
    act(() => result.current.handlers.onDragEnter(dragEvent()));
    act(() => result.current.handlers.onDrop(dragEvent([f])));
    expect(result.current.state).toBe('file');
    expect(result.current.file).toBe(f);
  });

  it('drop with wrong extension → fail with error message', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDrop(dragEvent([pdfFile()])));
    expect(result.current.state).toBe('fail');
    expect(result.current.errorMsg).toContain('.xlsx');
  });

  it('file → idle on onRemove', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDrop(dragEvent([xlsxFile()])));
    act(() => result.current.handlers.onRemove());
    expect(result.current.state).toBe('idle');
    expect(result.current.file).toBeNull();
  });

  it('setOk transitions to ok', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDrop(dragEvent([xlsxFile()])));
    act(() => result.current.setOk());
    expect(result.current.state).toBe('ok');
  });

  it('setFail transitions to fail with message', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.setFail('Server timeout'));
    expect(result.current.state).toBe('fail');
    expect(result.current.errorMsg).toBe('Server timeout');
  });

  it('setProgress transitions to busy', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDrop(dragEvent([xlsxFile()])));
    act(() => result.current.setProgress(50));
    expect(result.current.state).toBe('busy');
    expect(result.current.progress).toBe(50);
  });

  it('reset returns to idle from any state', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.setOk());
    act(() => result.current.reset());
    expect(result.current.state).toBe('idle');
    expect(result.current.file).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it('drop with multiple accept types accepts matching', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx,.pdf' }));
    act(() => result.current.handlers.onDrop(dragEvent([pdfFile()])));
    expect(result.current.state).toBe('file');
  });

  it('stays over when dragleave fires on child element (dragCounter > 0)', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDragEnter(dragEvent())); // enter parent
    act(() => result.current.handlers.onDragEnter(dragEvent())); // enter child
    act(() => result.current.handlers.onDragLeave(dragEvent())); // leave child
    expect(result.current.state).toBe('over'); // still over parent
    act(() => result.current.handlers.onDragLeave(dragEvent())); // leave parent
    expect(result.current.state).toBe('idle');
  });

  it('rejects file exceeding maxSize', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx', maxSize: 100 }));
    const bigFile = new File([new ArrayBuffer(200)], 'big.xlsx');
    act(() => result.current.handlers.onDrop(dragEvent([bigFile])));
    expect(result.current.state).toBe('fail');
    expect(result.current.errorMsg).toContain('100 B');
  });
});
