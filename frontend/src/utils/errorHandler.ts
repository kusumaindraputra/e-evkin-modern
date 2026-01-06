import { AxiosError } from 'axios';
import { message } from 'antd';

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.error || data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Show error message notification
 */
export function showError(error: unknown, prefix?: string): void {
  const msg = getErrorMessage(error);
  message.error(prefix ? `${prefix}: ${msg}` : msg);
}

/**
 * Log error to console with context
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
