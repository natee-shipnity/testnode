'use client';

import { useEffect, useRef, useState } from 'react';

const API_HTTP =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';
const API_WS = API_HTTP.replace(/^http/, 'ws');

type BoardEvent = {
  time: string;
  port: string;
  kind:
    | 'button'
    | 'raw'
    | 'frame'
    | 'disconnect'
    | 'error'
    | 'info'
    | 'uptime';
  pin?: number;
  text?: string;
  hex?: string;
  uptimeMs?: number;
  bootEpochMs?: number;
  error?: string;
};

type WsMessage = {
  type: 'hello' | 'pong' | 'echo' | 'board' | 'items' | string;
  data?: unknown;
  ts: number;
};

type Status = 'connecting' | 'open' | 'closed' | 'error';

type Item = { id: number; name: string };

const ITEM_POOL: Item[] = [
  { id: 1, name: 'milk' },
  { id: 2, name: 'bread' },
  { id: 3, name: 'eggs' },
  { id: 4, name: 'butter' },
  { id: 5, name: 'cheese' },
  { id: 6, name: 'yogurt' },
  { id: 7, name: 'apple' },
  { id: 8, name: 'banana' },
  { id: 9, name: 'orange' },
  { id: 10, name: 'lettuce' },
  { id: 11, name: 'tomato' },
  { id: 12, name: 'onion' },
  { id: 13, name: 'potato' },
  { id: 14, name: 'rice' },
  { id: 15, name: 'pasta' },
  { id: 16, name: 'chicken' },
  { id: 17, name: 'beef' },
  { id: 18, name: 'fish' },
  { id: 19, name: 'soap' },
  { id: 20, name: 'tissue' },
];

export default function Home() {
  const [status, setStatus] = useState<Status>('connecting');
  const [events, setEvents] = useState<BoardEvent[]>([]);
  const [lastPin, setLastPin] = useState<number | null>(null);
  const blinkTimer = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${API_WS}/v1/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('open');
      // Publish item pool to backend so any connected Wails client picks it up.
      ws.send(
        JSON.stringify({
          type: 'items',
          data: ITEM_POOL,
          ts: Date.now(),
        }),
      );
    };
    ws.onclose = () => setStatus('closed');
    ws.onerror = () => setStatus('error');
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage;
        if (msg.type === 'board' && msg.data) {
          const ev = msg.data as BoardEvent;
          setEvents((prev) => [ev, ...prev].slice(0, 50));
          if (ev.kind === 'button' && ev.pin != null) {
            setLastPin(ev.pin);
            if (blinkTimer.current) window.clearTimeout(blinkTimer.current);
            blinkTimer.current = window.setTimeout(() => {
              setLastPin(null);
              blinkTimer.current = null;
            }, 10000);
          }
        }
      } catch {
        // ignore non-JSON frames
      }
    };

    return () => {
      ws.close();
      if (blinkTimer.current) window.clearTimeout(blinkTimer.current);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-zinc-50 p-8 font-mono dark:bg-black dark:text-zinc-100">
      <header className="flex w-full max-w-3xl items-center justify-between">
        <h1 className="text-2xl font-semibold">box-client board feed</h1>
        <div className="flex items-center gap-2">
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
        </div>
      </header>

      <section
        className={`flex h-40 w-full max-w-3xl flex-col items-center justify-center rounded-lg border text-center transition-all ${
          lastPin != null
            ? 'animate-pulse border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-500 dark:bg-amber-900/40 dark:text-amber-200'
            : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
        }`}
      >
        {lastPin != null ? (
          <>
            <div className="text-sm opacity-70">last button</div>
            <div className="text-5xl font-bold">pin {lastPin}</div>
          </>
        ) : (
          <div className="text-zinc-500">waiting for button press…</div>
        )}
      </section>

      <section className="w-full max-w-3xl">
        <h2 className="mb-2 text-sm uppercase tracking-wide text-zinc-500">
          item pool published ({ITEM_POOL.length})
        </h2>
        <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-300 bg-white p-3 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {ITEM_POOL.map((it) => (
            <span
              key={it.id}
              className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
            >
              #{it.id} {it.name}
            </span>
          ))}
        </div>
      </section>

      <section className="w-full max-w-3xl">
        <h2 className="mb-2 text-sm uppercase tracking-wide text-zinc-500">
          recent events
        </h2>
        <div className="max-h-96 overflow-auto rounded-lg border border-zinc-300 bg-white text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {events.length === 0 ? (
            <div className="p-4 text-zinc-500">no events yet</div>
          ) : (
            <ul>
              {events.map((ev, i) => (
                <li
                  key={i}
                  className="border-b border-zinc-200 px-3 py-1.5 last:border-b-0 dark:border-zinc-800"
                >
                  <span className="mr-2 text-zinc-500">{ev.time}</span>
                  <span className="mr-2 font-semibold uppercase">
                    {ev.kind}
                  </span>
                  {ev.kind === 'button' && (
                    <span className="text-amber-600 dark:text-amber-400">
                      pin {ev.pin}
                    </span>
                  )}
                  {ev.text && <span className="text-zinc-700 dark:text-zinc-300">{ev.text}</span>}
                  {ev.error && (
                    <span className="text-red-500"> {ev.error}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-xs text-zinc-500">ws target: {API_WS}/v1/ws</p>
    </main>
  );
}
