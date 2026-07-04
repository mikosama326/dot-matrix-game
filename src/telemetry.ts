const API_BASE_URL = import.meta.env.VITE_ANALYTICS_API_BASE_URL ?? "http://localhost:3000";
const API_KEY = import.meta.env.VITE_ANALYTICS_API_KEY;
const sessionId = crypto.randomUUID();

type ItemTelemetryProperties = {
  item_id: string | undefined;
  item_name: string;
  item_kind: "producer" | "consumer";
  item_width: number;
  item_height: number;
  item_level: number;
  item_cost: number;
  dots_available: number;
  grid_x: number;
  grid_y: number;
};

type HeartbeatTelemetryProperties = {
  dot_count: number;
  dot_production_rate: number;
  dot_consumption_rate: number;
};

function getPlayerId(): string {
  let playerId = localStorage.getItem("dot_matrix_player_id");

  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem("dot_matrix_player_id", playerId);
  }

  return playerId;
}

function getSessionId(): string {
  return sessionId;
}

export async function logEvent(eventName: string, properties: Record<string, unknown> = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (API_KEY) {
    headers["X-Dot-Matrix-Api-Key"] = API_KEY;
  }

  try {
    await fetch(`${API_BASE_URL}/api/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        player_id: getPlayerId(),
        session_id: getSessionId(),
        event_name: eventName,
        properties,
      }),
    });
  } catch (error) {
    console.warn("Failed to send telemetry event", eventName, error);
  }
}

export const telemetry = {
  gameStarted() {
    return logEvent("game_started");
  },

  heartbeat(openSeconds: number, properties: HeartbeatTelemetryProperties) {
    return logEvent("heartbeat", {
      open_seconds: openSeconds,
      ...properties,
    });
  },

  itemPlaced(properties: ItemTelemetryProperties) {
    return logEvent("item_placed", properties);
  },

  itemDeleted(properties: ItemTelemetryProperties) {
    return logEvent("item_deleted", properties);
  },

  gameEnded(openSeconds: number, totalDotsProduced: number, totalDotsConsumed: number) {
    return logEvent("game_ended", {
      open_seconds: openSeconds,
      total_dots_produced: totalDotsProduced,
      total_dots_consumed: totalDotsConsumed,
    });
  },
};
