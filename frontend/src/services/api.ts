import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ShareNutApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ShareNutApiError";
    this.status = status;
    this.detail = detail;
  }
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 6000,
  headers: {
    "Content-Type": "application/json",
  },
});

async function request<T>(
  endpoint: string,
  config: AxiosRequestConfig = {},
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: endpoint,
      ...config,
    });
    if (response.status === 204) {
      return undefined as T;
    }
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<{ detail?: unknown; message?: string }>;
      const status = err.response?.status || 500;
      let detail = "An unexpected error occurred";
      const errorBody = err.response?.data;
      if (typeof errorBody?.detail === "string") {
        detail = errorBody.detail;
      } else if (Array.isArray(errorBody?.detail)) {
        detail = errorBody.detail
          .map((item: { loc?: unknown[]; msg?: string }) => {
            const field = Array.isArray(item.loc) ? item.loc.slice(-1)[0] : "";
            return field
              ? `${field}: ${item.msg || ""}`
              : item.msg || JSON.stringify(item);
          })
          .join("; ");
      } else if (errorBody?.message && typeof errorBody.message === "string") {
        detail = errorBody.message;
      } else if (err.message) {
        detail = err.message;
      }
      throw new ShareNutApiError(status, detail);
    }
    throw error;
  }
}

export function get<T>(
  endpoint: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>(endpoint, { method: "GET", ...config });
}

export function post<T>(
  endpoint: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>(endpoint, { method: "POST", data: body, ...config });
}

export function put<T>(
  endpoint: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>(endpoint, { method: "PUT", data: body, ...config });
}

export function del<T>(
  endpoint: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>(endpoint, { method: "DELETE", ...config });
}
