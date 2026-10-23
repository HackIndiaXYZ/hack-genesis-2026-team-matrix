import { useEffect, useState } from "react";

const WS_URL = "ws://localhost:8000/ws/sonar";

export interface NodeTelemetry {
  node_id: string;
  temperature: number | null;
  sonar_range: number | null;
  signal_strength: number | null;
  timestamp: string;
  online?: boolean;
}

interface TelemetryMessage {
  type: "snapshot" | "telemetry";
  data: NodeTelemetry | NodeTelemetry[];
}

export function useTelemetry(nodeId = "ASNSS-NODE-001") {
  const [telemetry, setTelemetry] = useState<NodeTelemetry | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let retryDelay = 1000;
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        if (disposed) return;

        setConnected(true);
        retryDelay = 1000;
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const message = JSON.parse(event.data) as TelemetryMessage;

          if (message.type === "snapshot" && Array.isArray(message.data)) {
            const node = message.data.find(
              (item) => item.node_id === nodeId
            );

            if (node) setTelemetry(node);
          }

          if (
            message.type === "telemetry" &&
            !Array.isArray(message.data) &&
            message.data.node_id === nodeId
          ) {
            setTelemetry(message.data);
          }
        } catch (error) {
          console.error("Invalid ASNSS telemetry message:", error);
        }
      };

      socket.onclose = () => {
        if (disposed) return;

        setConnected(false);

        reconnectTimer = window.setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 10000);
          connect();
        }, retryDelay);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      disposed = true;

      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
      }

      socket?.close();
    };
  }, [nodeId]);

  const lastSeen = telemetry?.timestamp
    ? new Date(telemetry.timestamp).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      }) + " IST"
    : null;

  return {
    telemetry,
    connected,
    lastSeen,
  };
}