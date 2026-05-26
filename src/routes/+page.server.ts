import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const res = await fetch('http://localhost:3005/v1/ping');
		const contentType = res.headers.get('content-type') ?? '';
		const body = contentType.includes('application/json') ? await res.json() : await res.text();
		return { ok: res.ok, status: res.status, body };
	} catch (e) {
		return { ok: false, status: 0, body: (e as Error).message };
	}
};
