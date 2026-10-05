"use client";

import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import Cookies from "js-cookie";

export default function RoomCanvas({ roomId }: { roomId: number }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    console.log("token", token);
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_BACKEND_URL}?token=${token}`,
    );

    console.log(ws)
    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws);
      console.log("Is Connected till now 1");
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        }),
      );
    };

    console.log("Is Connected till now 2");

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (e) => {
      console.log(  e.reason, "WebSocket disconnected",e.code );
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
