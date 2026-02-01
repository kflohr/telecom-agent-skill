import fetch from 'node-fetch';

const API_URL = process.env.TELECOM_API_URL || 'http://localhost:3000';
const API_TOKEN = process.env.TELECOM_API_TOKEN;

export const request = async (method: string, path: string, body?: any) => {
    if (!API_TOKEN) {
        console.error(JSON.stringify({
            error: 'Missing TELECOM_API_TOKEN environment variable',
            code: 'AUTH_MISSING'
        }, null, 2));
        (process as any).exit(1);
    }

    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Workspace-Token': API_TOKEN as string,
                'X-Actor-Source': 'cli'
            },
            body: body ? JSON.stringify(body) : undefined
        });

        const contentType = res.headers.get('content-type');
        let data;

        // Safely parse response
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            try {
                data = JSON.parse(text);
            } catch {
                data = { text };
            }
        }

        if (!res.ok) {
            console.error(JSON.stringify({
                error: (data as any).error || res.statusText,
                code: 'API_ERROR',
                status: res.status
            }, null, 2));
            (process as any).exit(1);
        }

        return data;
    } catch (error: any) {
        console.error(JSON.stringify({
            error: error.message,
            code: 'NETWORK_ERROR'
        }, null, 2));
        (process as any).exit(1);
    }
};