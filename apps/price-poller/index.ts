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
  await redisPublisher.connect(); 

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

    const interval = '1m';
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${market}@kline_${interval}`);


    ws.onmessage = (event) => {
      const message = JSON.parse(event.data.toString());
    
      if (message.e !== 'kline') return;
    
      const kline = message.k;
      const symbol = kline.s.toUpperCase();
    
      // Only publish closed candles
      if (kline.x) {
        const candlestickData = {
          symbol,
          interval: kline.i,
          open: kline.o,
          high: kline.h,
          low: kline.l,
          close: kline.c,
          volume: kline.v,
          timestamp: kline.t,
        };
    
        redisPublisher.publish('candles', JSON.stringify(candlestickData));
        console.log(`📊 Candle ${symbol} [${interval}]:`, candlestickData);
      }
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
