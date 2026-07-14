export const SCHEDULE_ALL = '1'.repeat(672);

export class FileFlowsClient {
  constructor(private readonly baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  }

  async getText(path: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
    return res.text();
  }

  async post<T>(path: string, body?: unknown): Promise<T | undefined> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : undefined;
  }

  async put<T>(path: string, body?: unknown): Promise<T | undefined> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PUT ${path} → ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : undefined;
  }

  async delete<T>(path: string, body?: unknown): Promise<T | undefined> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : undefined;
  }
}
