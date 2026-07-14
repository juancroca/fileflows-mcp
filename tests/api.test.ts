import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileFlowsClient, SCHEDULE_ALL } from '../src/api.js';

function mockResponse(data: unknown, status = 200) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(body),
  });
}

describe('SCHEDULE_ALL', () => {
  it('is exactly 672 characters of 1', () => {
    expect(SCHEDULE_ALL).toHaveLength(672);
    expect(SCHEDULE_ALL).toMatch(/^1+$/);
  });
});

describe('FileFlowsClient', () => {
  let client: FileFlowsClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new FileFlowsClient('http://localhost:5050');
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('strips trailing slash from base URL', async () => {
      const c = new FileFlowsClient('http://localhost:5050/');
      mockFetch.mockReturnValueOnce(mockResponse({}));
      await c.get('/api/library');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5050/api/library');
    });
  });

  describe('get()', () => {
    it('calls the correct URL', async () => {
      mockFetch.mockReturnValueOnce(mockResponse([{ Uid: '123' }]));
      await client.get('/api/library');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5050/api/library');
    });

    it('returns parsed JSON', async () => {
      const data = [{ Uid: 'abc', Name: 'Movies' }];
      mockFetch.mockReturnValueOnce(mockResponse(data));
      const result = await client.get('/api/library');
      expect(result).toEqual(data);
    });

    it('throws with path and status on non-200', async () => {
      mockFetch.mockReturnValueOnce(mockResponse('Not Found', 404));
      await expect(client.get('/api/missing')).rejects.toThrow('GET /api/missing → 404');
    });
  });

  describe('post()', () => {
    it('sends POST with Content-Type and serialised body', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ Uid: 'new' }));
      await client.post('/api/library', { Name: 'Test', Schedule: '111' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5050/api/library',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Name: 'Test', Schedule: '111' }),
        })
      );
    });

    it('returns undefined when response body is empty', async () => {
      mockFetch.mockReturnValueOnce({ ok: true, status: 200, text: () => Promise.resolve('') });
      const result = await client.post('/api/library/rescan-enabled');
      expect(result).toBeUndefined();
    });

    it('throws on non-200', async () => {
      mockFetch.mockReturnValueOnce(mockResponse('server error', 500));
      await expect(client.post('/api/library', {})).rejects.toThrow('POST /api/library → 500');
    });
  });

  describe('put()', () => {
    it('sends PUT with correct method and URL', async () => {
      mockFetch.mockReturnValueOnce({ ok: true, status: 200, text: () => Promise.resolve('') });
      await client.put('/api/library/state/abc?enable=true');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5050/api/library/state/abc?enable=true',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('sends Uids body for rescan/reset endpoints', async () => {
      mockFetch.mockReturnValueOnce({ ok: true, status: 200, text: () => Promise.resolve('') });
      await client.put('/api/library/rescan', { Uids: ['uid-1', 'uid-2'] });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ Uids: ['uid-1', 'uid-2'] }),
        })
      );
    });
  });

  describe('delete()', () => {
    it('sends DELETE with JSON body', async () => {
      mockFetch.mockReturnValueOnce({ ok: true, status: 200, text: () => Promise.resolve('') });
      await client.delete('/api/library', { Uids: ['abc'] });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5050/api/library',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Uids: ['abc'] }),
        })
      );
    });

    it('throws on non-200', async () => {
      mockFetch.mockReturnValueOnce(mockResponse('forbidden', 403));
      await expect(client.delete('/api/library', { Uids: [] })).rejects.toThrow(
        'DELETE /api/library → 403'
      );
    });
  });
});
