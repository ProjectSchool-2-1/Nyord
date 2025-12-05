import asyncio
import websockets
import json
import os
from dotenv import load_dotenv

load_dotenv()

FINNHUB_KEY = os.getenv("FINNHUB_KEY")

# store latest prices in memory
latest_prices = {
    "AAPL": None,
    "NVDA": None
}

async def start_stream():
    url = f"wss://ws.finnhub.io?token={FINNHUB_KEY}"

    async with websockets.connect(url) as ws:
        # subscribe
        await ws.send(json.dumps({"type": "subscribe", "symbol": "AAPL"}))
        await ws.send(json.dumps({"type": "subscribe", "symbol": "NVDA"}))

        print("Streaming AAPL & NVDA...")

        while True:
            msg = await ws.recv()
            data = json.loads(msg)

            if "data" in data:
                for tick in data["data"]:
                    symbol = tick["s"]
                    price = tick["p"]

                    latest_prices[symbol] = price
                    print(symbol, price)


# run WebSocket forever
if __name__ == "__main__":
    asyncio.run(start_stream())