from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import auth_router, account_router
from .routers import transaction_router
from .routers import ws_router
from .routers import profile_router
from .routers import fixed_deposits_router
from .routers import loans_router
from .routers import cards_router
from .routers import dashboard_router
from .routers import users_router
from .routers import admin_router
from .routers import notification_router
from .routers import qr_router
import threading
import asyncio
import websockets
import json
import os
from dotenv import load_dotenv
from .rabbitmq_ws_listener import rabbitmq_ws_listener
from . import config

load_dotenv()
FINNHUB_KEY = os.getenv("FINNHUB_KEY")

# In-memory latest prices
latest_prices = {
    "AAPL": None,
    "NVDA": None
}





Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dynamic CORS configuration driven by environment variables to avoid hardcoding.
_cors_origins = config.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(account_router.router)
app.include_router(transaction_router.router)
app.include_router(ws_router.router)
app.include_router(profile_router.router)
app.include_router(fixed_deposits_router.router)
app.include_router(loans_router.router)
app.include_router(cards_router.router)
app.include_router(dashboard_router.router)
app.include_router(users_router.router)
app.include_router(admin_router.router)
app.include_router(notification_router.router)
app.include_router(qr_router.router)


async def stock_streamer():
    """Background task: Connect to Finnhub WebSocket and update prices"""
    url = f"wss://ws.finnhub.io?token={FINNHUB_KEY}"

    while True:
        try:
            async with websockets.connect(url) as ws:
                await ws.send(json.dumps({"type": "subscribe", "symbol": "AAPL"}))
                await ws.send(json.dumps({"type": "subscribe", "symbol": "NVDA"}))

                print("Subscribed to AAPL & NVDA")

                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)

                    if "data" in data:
                        for tick in data["data"]:
                            symbol = tick["s"]
                            price = tick["p"]
                            latest_prices[symbol] = price
                            print(symbol, price)

        except Exception as e:
            print("WebSocket error:", e)
            print("Reconnecting in 3 seconds...")
            await asyncio.sleep(3)  # auto reconnect


@app.get("/stocks/{symbol}")
def get_stock(symbol: str):
    symbol = symbol.upper()
    return {
        "symbol": symbol,
        "price": latest_prices.get(symbol)
    }


@app.on_event("startup")
async def start_background_tasks():
    # Start WebSocket listener
    thread = threading.Thread(
        target=lambda: asyncio.run(rabbitmq_ws_listener()),
        daemon=True
    )
    thread.start()
    
    # Start stock streamer
    asyncio.create_task(stock_streamer())