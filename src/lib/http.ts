import axios from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/auth/authStore';
import { toApiError } from './errors';

/** baseURL "/api": dev dùng Vite proxy → http://localhost:8080 (cùng origin, không phụ thuộc CORS). */
export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const { accessToken, expiresAt, clearSession } = useAuthStore.getState();
  if (accessToken) {
    if (expiresAt && Date.now() >= expiresAt) clearSession();
    else config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

/**
 * Nếu BE bọc kết quả kiểu { success: true, statusCode, data } thì gỡ lớp bọc để các module API dùng chung.
 * BE P03 hiện trả dữ liệu trực tiếp → điều kiện dưới đây không khớp, response giữ nguyên.
 */
function unwrapEnvelope(body: unknown): unknown {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    if (o.success === true && 'data' in o && 'statusCode' in o) return o.data;
  }
  return body;
}

http.interceptors.response.use(
  (r) => {
    r.data = unwrapEnvelope(r.data);
    return r;
  },
  (error) => {
    const e = toApiError(error);
    const url = String(error?.config?.url ?? '');
    if (e.status === 401 && !url.includes('/auth/login')) useAuthStore.getState().clearSession();
    return Promise.reject(e);
  },
);

export const api = {
  get: <T>(url: string, params?: object) => http.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, body?: unknown) => http.post<T>(url, body).then((r) => r.data),
  put: <T>(url: string, body?: unknown) => http.put<T>(url, body).then((r) => r.data),
};
