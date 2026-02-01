import { getConfig } from './config.js';
import { randomUUID } from 'crypto';

const config = getConfig();

export const request = async (method: string, path: string, body?: any) => {
  const requestId = randomUUID();
  
  try {
    const res = await fetch(`${config.TELECOM_API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-Token': config.TELECOM_API_TOKEN,
        'X-Actor-Source': 'cli',
        'X-Request-Id': requestId
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const contentType = res.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text };
    }

    if (!res.ok) {
      // API Error -> Exit 1
      throw {
        message: data.error || data.message || res.statusText,
        code: 'API_ERROR',
        status: res.status,
        details: data,
        exitCode: 1
      };
    }

    return data;
  } catch (error: any) {
    if (error.exitCode) throw error;
    
    // Network Error -> Exit 3
    throw {
      message: error.message || 'Network request failed',
      code: 'NETWORK_ERROR',
      details: error,
      exitCode: 3
    };
  }
};