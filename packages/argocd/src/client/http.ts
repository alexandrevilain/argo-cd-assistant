import axios, { AxiosInstance } from 'axios';

type SearchParams = Record<string, string | number | boolean | undefined | null>;

export class HttpClient {
  private readonly instance: AxiosInstance;

  constructor(baseUrl: string, apiToken: string) {
    this.instance = axios.create({
      baseURL: baseUrl.replace(/\/+$/, ''),
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
    });

    // AxiosError carries the request config (incl. the Authorization header), which loggers
    // serialize verbatim. Rethrow a plain Error with only the status and Argo CD's message.
    this.instance.interceptors.response.use(undefined, (err: unknown) => {
      if (!axios.isAxiosError(err)) throw err;
      const status = err.response?.status;
      const data = err.response?.data;
      const detail = typeof data === 'string' ? data : data?.message;
      const method = err.config?.method?.toUpperCase();
      throw new Error(
        `Argo CD API ${method} ${err.config?.url} failed${status ? ` (${status})` : ''}: ${detail || err.message}`,
      );
    });
  }

  async get<T>(url: string, params?: SearchParams): Promise<T> {
    const response = await this.instance.get<T>(url, { params });
    return response.data;
  }

  async getText(url: string, params?: SearchParams): Promise<string> {
    const response = await this.instance.get<string>(url, {
      params,
      responseType: 'text',
      transformResponse: (data) => data,
    });
    return response.data;
  }
}
