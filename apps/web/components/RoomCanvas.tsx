"use client";

import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import Cookies from "js-cookie";
import MobileUnsupported from "./MobileDisplay";

export default function RoomCanvas({ roomId }: { roomId: number }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {

    const token = Cookies.get("token");
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_BACKEND_URL}?token=${token}`,
    );

    console.log(ws);
    ws.onopen = () => {
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

    ws.onclose = (e) => {
      console.log(e.reason, "WebSocket disconnected", e.code);
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  if (!socket) {
    return <div>Connecting to server...</div>;
  }

  return (
    <>
      <div className="block md:hidden">
        <MobileUnsupported />
      </div>
      <div className="hidden md:block">
        <Canvas roomId={roomId} socket={socket} />
      </div>
    </>
  );
}
