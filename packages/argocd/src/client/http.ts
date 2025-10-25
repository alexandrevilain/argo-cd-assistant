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
