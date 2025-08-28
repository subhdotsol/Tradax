// apps/price-poller/index.ts
import WebSocket from 'ws';
import { createClient } from 'redis';
import { markets } from '@repo/constants/markets';

const redisPublisher = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisPublisher.on('error', (err) => {
  console.error('Redis publisher error', err);
});

async function start() {
  await redisPublisher.connect();

  // candles , trade , bookticker

  const streams = markets.map((s) => `${s}@bookTicker`).join("/");
  const binanceWS = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

  interface BinanceBookTicker {
    stream: string;
    data: {
      e: "bookTicker"; // Event type
      u: number;       // Order book updateId
      s: string;       // Symbol
      b: string;       // Best bid price
      B: string;       // Best bid qty
      a: string;       // Best ask price
      A: string;       // Best ask qty
    };
  }

  binanceWS.onmessage = (event) => {
    const message: BinanceBookTicker = JSON.parse(event.data.toString());
    if (!message.data || message.data.e !== "bookTicker") return;

    const bookTickerData = {
      symbol: message.data.s,
      bidPrice: message.data.b,
      bidQty: message.data.B,
      askPrice: message.data.a,
      askQty: message.data.A,
      updateId: message.data.u,
    };

    // Publish to Redis
    redisPublisher.publish("book_ticker", JSON.stringify(bookTickerData));
    console.log(`BookTicker ${message.data.s}:`, bookTickerData);
  };

  binanceWS.onopen = () => {
    console.log(`Connected to Binance bookTicker streams: ${markets.join(", ")}`);
  };

  binanceWS.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
}

start().catch(console.error);
