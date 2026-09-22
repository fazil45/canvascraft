"use client";

import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

export default function RoomCanvas({
  roomId,
}: {
  roomId: number;
}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_BACKEND_URL}?token=${token}`,
    );

    ws.onopen = () => {
      console.log("WebSocket connected");

      setSocket(ws);

      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        }),
      );
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  if (!socket) {
    return <div>Connecting to server...</div>;
  }

  return <Canvas roomId={roomId} socket={socket} />;
}