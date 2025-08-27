'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('✅ Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      console.log('📈 Live trade data:', trade);
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };

    socket.onclose = () => {
      console.warn('🔌 WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <main>
      <h1>📊 Live Trade Stream</h1>
      <p>Open your browser console to see real-time trade data from Binance via WebSocket.</p>
    </main>
  );
}
