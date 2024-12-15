const BASE_URL = 'https://services.aibtc.dev/database';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${process.env.NEXT_PUBLIC_AIBTC_SECRET_KEY}`);

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

