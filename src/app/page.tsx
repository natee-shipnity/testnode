'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

type PingState = {
  ok: boolean;
  status: number;
  body: unknown;
  error?: string;
};

export default function Home() {
  const [state, setState] = useState<PingState | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/v1/ping`);
        const contentType = res.headers.get('content-type') ?? '';
        const body = contentType.includes('application/json')
          ? await res.json()
          : await res.text();
        setState({ ok: res.ok, status: res.status, body });
      } catch (e) {
        setState({
          ok: false,
          status: 0,
          body: null,
          error: (e as Error).message,
        });
      }
    };
    run();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 font-mono dark:bg-black dark:text-zinc-100">
      <h1 className="text-2xl font-semibold">box-client ping</h1>
      <p className="text-sm text-zinc-500">target: {API_URL}/v1/ping</p>
      <pre className="rounded-lg border border-zinc-300 bg-white p-6 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {state === null ? 'loading…' : JSON.stringify(state, null, 2)}
      </pre>
    </main>
  );
}
