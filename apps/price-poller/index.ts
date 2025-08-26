// apps/price-poller/index.ts
import WebSocket from 'ws';
import { markets } from '@repo/constants/markets';
import { createClient } from 'redis';

const redisPublisher = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisPublisher.on('error', (err) => {
  console.error('Redis publisher error', err);
});

async function start() {
  await redisPublisher.connect(); // <-- Important!

  // Interface of the Binance trade
  interface BinanceTrade {
    e: "trade";
    E: number;     // Event time
    s: string;     // Symbol
    t: number;     // Trade ID
    p: string;     // Price
    q: string;     // Quantity
    T: number;     // Trade time
    m: boolean;    // Is buyer the market maker?
    M: boolean;    // Ignore
  }

  const tradeQueues: Record<string, BinanceTrade[]> = {};

  markets.forEach((market) => {
    tradeQueues[market.toUpperCase()] = [];

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${market}@trade`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data.toString());

      const symbol = data.s.toUpperCase();

      if (tradeQueues[symbol]) {
        tradeQueues[symbol].push(data);
      }

      redisPublisher.publish('trades', JSON.stringify(data));

      console.log(`Trade Data for ${symbol}:`, data);
    };

    ws.onopen = () => {
      console.log(`Connected to market ${market}`);
    };

    ws.onerror = (err) => {
      console.error(`WebSocket error for ${market}:`, err);
    };
  });

  // Your batch upload and interval code here (unchanged)...
}

// Run the async start function
start().catch(console.error);
