import { renderHook, act } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useConversionProgress } from './useConversionProgress';
test('reports indeterminate progress until a real success response', () => {
  vi.useFakeTimers();
  try {
    const { result, unmount } = renderHook(() => useConversionProgress());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.status).toBe('running');
    expect(result.current.progress).toBeUndefined();
    act(() => result.current.fail());
    expect(result.current.status).toBe('error');
    expect(result.current.progress).toBeUndefined();
    act(() => result.current.complete());
    expect(result.current.progress).toBe(100);
    expect(result.current.status).toBe('complete');
    unmount();
  } finally { vi.useRealTimers(); }
});
