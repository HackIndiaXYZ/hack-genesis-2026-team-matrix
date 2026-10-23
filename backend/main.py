from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(
    title="Aqua Sonar Network Security System Backend API's",
    description="Aqua Sonar Network Security System API",
    version="1.2.0",
)

# -----------------------------
# CORS configuration
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Data models
# -----------------------------

class Telemetry(BaseModel):
    node_id: str = Field(min_length=1, max_length=64)
    temperature: Optional[float] = None
    sonar_range: Optional[float] = Field(default=None, ge=0)
    signal_strength: Optional[float] = None


# -----------------------------
# Temporary in-memory storage
# -----------------------------

latest_telemetry: dict[str, dict] = {}

connected_clients: set[WebSocket] = set()

alerts: list[dict] = []

# -----------------------------
# Telemetry history configuration
# -----------------------------

TELEMETRY_HISTORY_SECONDS = 60 * 60  # 1 hour

# Stores timestamped readings separately for each node.
telemetry_history: dict[str, list[dict]] = {}

# -----------------------------
# Helper functions
# -----------------------------

def utc_now() -> datetime:
    """Return the current UTC time."""
    return datetime.now(timezone.utc)


def make_payload(telemetry: Telemetry) -> dict:
    """Convert telemetry into a timestamped dictionary."""
    payload = telemetry.model_dump()
    payload["timestamp"] = utc_now().isoformat()

    return payload

def prune_telemetry_history(node_id: str) -> None:
    """Remove readings older than one hour for a node."""

    cutoff = utc_now() - timedelta(
        seconds=TELEMETRY_HISTORY_SECONDS
    )

    readings = telemetry_history.get(node_id, [])

    telemetry_history[node_id] = [
        reading
        for reading in readings
        if datetime.fromisoformat(reading["timestamp"]) >= cutoff
    ]


def store_telemetry_history(payload: dict) -> None:
    """Store a telemetry reading and retain only the last hour."""

    node_id = payload["node_id"]

    if node_id not in telemetry_history:
        telemetry_history[node_id] = []

    telemetry_history[node_id].append(payload.copy())

    prune_telemetry_history(node_id)

def get_node_health(payload: dict) -> str:
    """
    Determine node health from the latest telemetry timestamp.

    online:  0-30 seconds
    stale:   >30-60 seconds
    offline: >60 seconds
    unknown: invalid, missing, or future timestamp
    """

    try:
        timestamp_value = payload.get("timestamp")

        if not timestamp_value:
            return "unknown"

        timestamp = datetime.fromisoformat(timestamp_value)

        # Treat timestamps without timezone information as UTC.
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)

        age = (utc_now() - timestamp).total_seconds()

        # Future timestamps cannot establish reliable node health.
        if age < 0:
            return "unknown"

        if age <= 30:
            return "online"

        if age <= 60:
            return "stale"

        return "offline"

    except (ValueError, TypeError, AttributeError):
        return "unknown"


def node_is_online(payload: dict) -> bool:
    """Return True only when the node is currently online."""
    return get_node_health(payload) == "online"


def add_node_health(payload: dict) -> dict:
    """Return telemetry with its current health information."""
    health = get_node_health(payload)

    return {
        **payload,
        "health": health,
        "online": health == "online",
    }


def get_node_counts(nodes: list[dict]) -> dict:
    """Calculate node counts by health state."""

    return {
        "total_nodes": len(nodes),
        "online_nodes": sum(
            node["health"] == "online" for node in nodes
        ),
        "stale_nodes": sum(
            node["health"] == "stale" for node in nodes
        ),
        "offline_nodes": sum(
            node["health"] == "offline" for node in nodes
        ),
        "unknown_nodes": sum(
            node["health"] == "unknown" for node in nodes
        ),
    }


# -----------------------------
# Alert generation
# -----------------------------

def generate_alerts(payload: dict) -> None:
    node_id = payload["node_id"]

    temperature = payload.get("temperature")
    sonar_range = payload.get("sonar_range")
    signal_strength = payload.get("signal_strength")
    
    # Remove previously generated temperature alerts for this node.
    alerts[:] = [
        alert
        for alert in alerts
        if not (
            alert["node_id"] == node_id
            and alert["type"] in {
                "HIGH_TEMPERATURE",
                "LOW_TEMPERATURE",
            }
        )
    ]

    if temperature is not None and temperature > 35:
        alerts.insert(
            0,
            {
                "id": f"{node_id}-high-temperature",
                "node_id": node_id,
                "type": "HIGH_TEMPERATURE",
                "severity": "warning",
                "message": (
                    f"Temperature reading is {temperature:.1f} °C."
                ),
                "timestamp": payload["timestamp"],
            },
        )

    elif temperature is not None and temperature < 0:
        alerts.insert(
            0,
            {
                "id": f"{node_id}-low-temperature",
                "node_id": node_id,
                "type": "LOW_TEMPERATURE",
                "severity": "warning",
                "message": (
                    f"Temperature reading is {temperature:.1f} °C."
                ),
                "timestamp": payload["timestamp"],
            },
        )

    # A missing sonar measurement is not a detection alert.
    if sonar_range is None:
        pass
    
    # Remove the previous Wi-Fi signal alert for this node.
    alerts[:] = [
        alert
        for alert in alerts
        if not (
            alert["node_id"] == node_id
            and alert["type"] == "WEAK_WIFI_SIGNAL"
        )
    ]

    # Generate a warning when Wi-Fi signal is weaker than -70 dBm.
    if signal_strength is not None and signal_strength < -70:
        alerts.insert(
            0,
            {
                "id": f"{node_id}-weak-wifi",
                "node_id": node_id,
                "type": "WEAK_WIFI_SIGNAL",
                "severity": "warning",
                "message": (
                    f"Wi-Fi signal is weak at {signal_strength} dBm."
                ),
                "timestamp": payload["timestamp"],
            },
        )

# -----------------------------
# WebSocket broadcasting
# -----------------------------

async def broadcast(message: dict) -> None:
    """Send a message to every connected WebSocket client."""

    disconnected = []

    for websocket in connected_clients.copy():
        try:
            await websocket.send_json(message)

        except Exception:
            disconnected.append(websocket)

    for websocket in disconnected:
        connected_clients.discard(websocket)


# -----------------------------
# Telemetry ingestion
# -----------------------------

async def ingest_telemetry(telemetry: Telemetry) -> dict:
    """Store telemetry, generate alerts, and broadcast updates."""

    payload = make_payload(telemetry)

    latest_telemetry[telemetry.node_id] = payload

    store_telemetry_history(payload)

    generate_alerts(payload)
    # Add health data to the WebSocket event.
    enriched_payload = add_node_health(payload)

    await broadcast(
        {
            "type": "telemetry",
            "data": enriched_payload,
        }
    )

    return payload


# -----------------------------
# General and health endpoints
# -----------------------------

@app.get("/")
async def root():
    return {
        "system": "Aqua Sonar Network Security System",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
    }


# -----------------------------
# Node endpoints
# -----------------------------

@app.get("/api/nodes")
@app.get("/api/v1/nodes")
def get_nodes():

    nodes = [
        add_node_health(
            {
                **payload,
                "node_id": node_id,
            }
        )
        for node_id, payload in latest_telemetry.items()
    ]

    counts = get_node_counts(nodes)

    return {
        **counts,
        "nodes": nodes,
    }


# -----------------------------
# Alert endpoints
# -----------------------------

@app.get("/api/alerts")
@app.get("/api/v1/alerts")
async def get_alerts():
    return {
        "alerts": alerts,
    }


# -----------------------------
# Telemetry endpoints
# -----------------------------

@app.post("/api/telemetry")
@app.post("/api/v1/telemetry")
async def receive_telemetry(telemetry: Telemetry):

    payload = await ingest_telemetry(telemetry)

    return {
        "status": "accepted",
        "data": payload,
    }

@app.get("/api/v1/telemetry/history")
async def get_telemetry_history(
    node_id: Optional[str] = None,
):
    """
    Return telemetry history from the last hour.

    Optionally filter by node_id.
    """

    # Remove expired readings before returning history.
    node_ids = (
        [node_id]
        if node_id
        else list(telemetry_history.keys())
    )

    result = []

    for current_node_id in node_ids:
        prune_telemetry_history(current_node_id)

        readings = telemetry_history.get(current_node_id, [])
        result.extend(readings)

    # Sort readings chronologically.
    result.sort(key=lambda reading: reading["timestamp"])

    return {
        "period_seconds": TELEMETRY_HISTORY_SECONDS,
        "total_readings": len(result),
        "nodes": list(
            dict.fromkeys(
                reading["node_id"] for reading in result
            )
        ),
        "readings": result,
    }
# -----------------------------
# WebSocket handler
# -----------------------------

async def websocket_handler(websocket: WebSocket):

    await websocket.accept()

    connected_clients.add(websocket)

    try:
        # Send current node data when a dashboard connects.
        snapshot = [
            add_node_health(payload)
            for payload in latest_telemetry.values()
        ]

        await websocket.send_json(
            {
                "type": "snapshot",
                "data": snapshot,
            }
        )

        # Keep the connection alive.
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass

    finally:
        connected_clients.discard(websocket)


# -----------------------------
# WebSocket endpoints
# -----------------------------

@app.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await websocket_handler(websocket)


@app.websocket("/ws/sonar")
async def sonar_websocket(websocket: WebSocket):
    await websocket_handler(websocket)