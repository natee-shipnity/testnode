'use client';

import { useEffect, useRef, useState } from 'react';

const API_HTTP =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';
const API_WS = API_HTTP.replace(/^http/, 'ws');

type WsMessage = {
  type: string;
  data?: unknown;
  ts: number;
};

type Status = 'connecting' | 'open' | 'closed' | 'error';

export default function Home() {
  const [status, setStatus] = useState<Status>('connecting');
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${API_WS}/v1/ws`);
    wsRef.current = ws;

    ws.onopen = () => setStatus('open');
    ws.onclose = () => setStatus('closed');
    ws.onerror = () => setStatus('error');
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage;
        setMessages((prev) => [msg, ...prev].slice(0, 20));
      } catch {
        // ignore non-JSON frames
      }
    };

    return () => ws.close();
  }, []);

  const sendPing = () => {
    wsRef.current?.send('ping from client');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 font-mono dark:bg-black dark:text-zinc-100">
      <h1 className="text-2xl font-semibold">box-client websocket</h1>
      <p className="text-sm text-zinc-500">target: {API_WS}/v1/ws</p>
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-3 w-3 rounded-full ${
            status === 'open'
              ? 'bg-green-500'
              : status === 'connecting'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
        />
        <span className="text-sm">{status}</span>
        <button
          onClick={sendPing}
          disabled={status !== 'open'}
          className="rounded border border-zinc-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-zinc-700"
        >
          send ping
        </button>
      </div>
      <pre className="max-h-96 w-full max-w-2xl overflow-auto rounded-lg border border-zinc-300 bg-white p-4 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {messages.length === 0
          ? 'waiting for messages…'
          : messages.map((m) => JSON.stringify(m)).join('\n')}
      </pre>
    </main>
  );
}
