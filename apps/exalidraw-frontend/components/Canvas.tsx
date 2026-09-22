"use client";
import * as htmlToImage from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import {
  ArrowUpLeft,
  CaseSensitive,
  Circle,
  MousePointer,
  Pencil,
  RectangleHorizontal,
  Redo2,
  Text,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Game } from "@/draw/Game";
import { SideBar } from "./SideBar";
import axios from "axios";

export type ToolShape =
  | "mouse"
  | "circle"
  | "rect"
  | "pencil"
  | "arrowPoint"
  | "undo"
  | "redo"
  | "delete"
  | "text";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: number;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game>();
  const [showsideButton, setShowsideButton] = useState(true);
  const [isActiveTool, setIsActiveTool] = useState<ToolShape>("mouse");

  function showSideBar() {
    sidebarRef.current?.classList.toggle("flex");
    setShowsideButton((prev) => !prev);
    sidebarRef.current?.classList.toggle("hidden");
  }

  async function exportCanvas() {
    if (!canvasRef.current) {
      return;
    }
    const dataUrl = await htmlToImage.toPng(canvasRef.current);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "canva.png";
    link.click();
  }

  useEffect(() => {
    game?.setTool(isActiveTool);
  }, [isActiveTool, game]);

  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (gameRef.current) return;

    const g = new Game(canvasRef.current, roomId, socket);
    gameRef.current = g;
    setGame(g);

    return () => {
      g.destroy();
      gameRef.current = null;
    };
  }, [roomId, socket]);

  const keyDownExportHandler = (e: KeyboardEvent) => {
    const isExport = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";

    if (isExport) {
      exportCanvas();
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        height={window.innerHeight}
        width={window.innerWidth}
      ></canvas>
      <TopBar
        isActiveTool={isActiveTool}
        setIsActiveTool={setIsActiveTool}
        roomId={roomId}
        game={game}
      />
      <div className="absolute top-5 right-5">
        {showsideButton ? (
          <Text
            className="fixed top-3 right-5 z-100 cursor-pointer transition-all duration-500"
            onClick={showSideBar}
            size={"30px"}
          />
        ) : (
          <X
            className="fixed top-3 right-5 z-100 cursor-pointer transition-all duration-500"
            onClick={showSideBar}
            size={"30px"}
          />
        )}
      </div>
      <div ref={sidebarRef} className="hidden transition-all duration-500">
        {<SideBar onClick={exportCanvas} className="" />}
      </div>
    </div>
  );
}

function TopBar({
  isActiveTool,
  setIsActiveTool,
  roomId,
  game,
}: {
  isActiveTool: ToolShape;
  setIsActiveTool: (s: ToolShape) => void;
  roomId: number;
  game?: Game;
}) {
  const token = localStorage.getItem("token");
  const undoMessage = async () => {
    try {
      if (game) {
        game.undoLastShape();
      } else {
        return;
      }
    } catch (error) {}
  };
  const redoMessage = async () => {
    console.log("here");
    try {
      if (game) {
        game.redoLastShape();
      } else {
        return;
      }
    } catch (error) {}
  };

  const deleteAllMessage = async () => {
    try {
      if (game) {
        game.deleteShape();
      }
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/delete/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {}
  };

  return (
    <div className="fixed top-25 left-5 flex flex-col gap-2 rounded-lg border-2 border-cyan-500/60 p-2">
      <IconButton
        activated={isActiveTool === "mouse"}
        icon={<MousePointer />}
        onClick={() => {
          setIsActiveTool("mouse");
        }}
      />
      <IconButton
        activated={isActiveTool === "text"}
        icon={<CaseSensitive />}
        onClick={() => setIsActiveTool("text")}
      />
      <IconButton
        activated={isActiveTool === "arrowPoint"}
        icon={<ArrowUpLeft />}
        onClick={() => {
          setIsActiveTool("arrowPoint");
        }}
      />
      <IconButton
        activated={isActiveTool === "pencil"}
        icon={<Pencil />}
        onClick={() => {
          setIsActiveTool("pencil");
        }}
      />
      <IconButton
        activated={isActiveTool === "circle"}
        icon={<Circle />}
        onClick={() => {
          setIsActiveTool("circle");
        }}
      />
      <IconButton
        activated={isActiveTool === "rect"}
        icon={<RectangleHorizontal />}
        onClick={() => {
          setIsActiveTool("rect");
        }}
      />
      <IconButton
        activated={isActiveTool === "undo"}
        icon={<Undo2 className="cursor-pointer" />}
        onClick={undoMessage}
      />
      <IconButton
        activated={isActiveTool === "redo"}
        icon={<Redo2 className="cursor-pointer" />}
        onClick={redoMessage}
      />
      <IconButton
        activated={isActiveTool === "delete"}
        icon={<Trash2 className="cursor-pointer" />}
        onClick={deleteAllMessage}
      />
    </div>
  );
}
