import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.TELECOM_API_URL;
const API_TOKEN = process.env.TELECOM_API_TOKEN;

export class ApiClient {
  constructor() {
    if (!API_URL) {
      throw { message: 'TELECOM_API_URL is not set', code: 'CONFIG_MISSING' };
    }
    if (!API_TOKEN) {
      throw { message: 'TELECOM_API_TOKEN is not set', code: 'CONFIG_MISSING' };
    }
  }

  async request(method: string, path: string, body?: any) {
    const requestId = uuidv4();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Workspace-Token': API_TOKEN!,
      'X-Actor-Source': 'cli',
      'X-Request-Id': requestId
    };

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const contentType = res.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        // If not JSON, but status is ok, return text wrapped
        if (res.ok) return { message: text }; 
        // If error, try to pass text as error message
        throw new Error(text || res.statusText);
      }

      if (!res.ok) {
        throw {
          message: data.error || res.statusText,
          code: 'API_ERROR',
          status: res.status,
          details: data
        };
      }

      // Append metadata for CLI visibility if needed (mostly internal)
      return data;
    } catch (error: any) {
      // Re-throw standardized format
      if (error.code) throw error;
      throw {
        message: error.message || 'Network request failed',
        code: 'NETWORK_ERROR',
        details: error
      };
    }
  }

  get(path: string) {
    return this.request('GET', path);
  }

  post(path: string, body: any) {
    return this.request('POST', path, body);
  }
}