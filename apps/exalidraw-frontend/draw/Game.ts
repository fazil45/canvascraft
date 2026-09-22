import { ToolShape } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { toast } from "sonner";
import { RoomStore } from "@/store/RoomStore";
import { number } from "zod";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "pencil";
      points: { x: number; y: number }[];
    }
  | {
      type: "arrowPoint";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      content: string;
      fontSize: number;
    };

interface Point {
  x: number;
  y: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activeTextEl: HTMLInputElement | null;
  private textOrigin: Point | null;
  private existingShapes: Shape[];
  private roomId: number;
  private socket: WebSocket;
  private clicked: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private clientId: string;
  private isActiveTool: ToolShape = "rect";
  private points: Point[];
  private undoStore: Shape[] = [];
  private redoStore: Shape[] = [];

  constructor(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket) {
    console.log("Game created");
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.activeTextEl = null;
    this.textOrigin = null;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.points = [];
    this.clientId = crypto.randomUUID();
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.initKeyboardHandlers();
    this.socket.onopen = () => {
      this.socket.send(
        JSON.stringify({
          type: "join_room",
          roomId: this.roomId,
        }),
      );
    };
  }

  private startTextInput(x: number, y: number) {
    this.commitTextInput();

    const input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.left = `${x}px`;
    input.style.top = `${y - 10}px`;
    input.style.background = "transparent";
    input.style.color = "white";
    input.style.font = "20 sans-serif";
    input.style.border = "1px dashed #888";
    input.style.outline = "none";
    input.style.zIndex = "10000";

    this.canvas.parentElement!.appendChild(input);
    input.focus();

    this.activeTextEl = input;
    this.textOrigin = { x, y };

    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        this.commitTextInput();
      } else if (e.key === "Escape") {
        this.cancelTextInput();
      }
    });
  }

  private commitTextInput() {
    if (!this.activeTextEl || !this.textOrigin) return;

    const content = this.activeTextEl.value.trim();
    const { x, y } = this.textOrigin;

    this.activeTextEl.remove();
    this.activeTextEl = null;
    this.textOrigin = null;

    if (!content) return;

    const shape: Shape = { type: "text", x, y, content, fontSize: 20 };

    this.existingShapes.push(shape);
    this.clearCanvas();

    this.socket.send(
      JSON.stringify({
        type: "chat",
        clientId: this.clientId,
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
      }),
    );
  }

  private cancelTextInput() {
    this.activeTextEl?.remove();
    this.activeTextEl = null;
    this.textOrigin = null;
  }

  setTool(tool: ToolShape) {
    this.isActiveTool = tool;
  }

  undoLastShape() {
    if (this.existingShapes.length === 0) {
      return;
    }
    console.log("third");
    const shape = this.existingShapes.pop();
    if (!shape) {
      return;
    }
    this.undoStore.push(shape);
    this.redoStore = [];
    this.clearCanvas();

    this.socket.send(
      JSON.stringify({
        type: "undo",
        shape,
        roomId: this.roomId,
        clientId: this.clientId,
      }),
    );
  }

  redoLastShape() {
    if (this.undoStore.length === 0) {
      return;
    }

    const shape = this.undoStore.pop();
    if (!shape) {
      return;
    }
    console.log("second");
    this.existingShapes.push(shape);
    this.clearCanvas();

    this.socket.send(
      JSON.stringify({
        type: "redo",
        shape,
        roomId: this.roomId,
        clientId: this.clientId,
      }),
    );
  }

  deleteShape() {
    if (this.existingShapes.length === 0) {
      return;
    }
    this.socket.send(
      JSON.stringify({
        type: "delete",
        roomId: this.roomId,
        clientId: this.clientId,
      }),
    );
    this.existingShapes.splice(0, this.existingShapes.length);
    this.clearCanvas();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    window.removeEventListener("keydown", this.keyDownUndoHandler);
    window.removeEventListener("keydown", this.keyDownRedoHandler);
    RoomStore.getState().reset();
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const room = RoomStore.getState();
      const message = JSON.parse(event.data);

      if (message.type === "room-users") {
        room.setParticipants(message.users);
      }

      if (message.type === "user-joined") {
        room.addParticipant({
          userId: message.userId,
          username: message.username,
        });
        toast.info(`${message.username} has joined the room`);
      }

      if (message.type === "user-left") {
        room.removeParticipant(message.userId);
        toast.info(`${message.username} has left`);
      }

      if (message.type === "chat") {
        if (message.clientId === this.clientId) {
          return;
        }
        const parsedShape = JSON.parse(message.message);
        this.existingShapes.push(parsedShape.shape);
        console.log("socket shape", parsedShape.shape);
        this.clearCanvas();
      }

      if (message.type === "undo") {
        if (message.clientId === this.clientId) return;

        const index = this.existingShapes.findIndex(
          (s) => JSON.stringify(s) === JSON.stringify(message.shape),
        );

        if (index !== -1) {
          const [removed] = this.existingShapes.splice(index, 1);
          this.undoStore.push(removed);
          this.clearCanvas();
        }
      }

      if (message.type === "redo") {
        if (message.clientId === this.clientId) return;

        this.existingShapes.push(message.shape);
        this.clearCanvas();
      }

      if (message.type === "delete") {
        this.existingShapes.splice(0, this.existingShapes.length);
        this.clearCanvas();
      }
    };
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0,0,0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingShapes.map((shape) => {
      if (shape.type === "rect") {
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2,
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil") {
        if (shape.points.length < 2) return;
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length - 1; i++) {
          const midX = (shape.points[i].x + shape.points[i + 1].x) / 2;
          const midY = (shape.points[i].y + shape.points[i + 1].y) / 2;
          this.ctx.quadraticCurveTo(
            shape.points[i].x,
            shape.points[i].y,
            midX,
            midY,
          );
          this.ctx.lineWidth = 2;
        }

        this.ctx.stroke();
      } else if (shape.type === "arrowPoint") {
        const dx = shape.endX - shape.startX;
        const dy = shape.endY - shape.startY;
        const headLength = 10;
        const angle = Math.atan2(dy, dx);
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(
          shape.endX - headLength * Math.cos(angle - Math.PI / 6),
          shape.endY - headLength * Math.sin(angle - Math.PI / 6),
        );
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.lineTo(
          shape.endX - headLength * Math.cos(angle + Math.PI / 6),
          shape.endY - headLength * Math.sin(angle + Math.PI / 6),
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "text") {
        this.ctx.fillStyle = "rgba(255,255,255)";
        this.ctx.font = `${shape.fontSize}px sans-serif`;
        this.ctx.fillText(shape.content, shape.x, shape.y);
      }
    });
  }

  keyDownUndoHandler = (e: KeyboardEvent) => {
    const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";

    if (isUndo) {
      e.preventDefault(); // prevent browser undo
      this.undoLastShape();
    }
  };

  keyDownRedoHandler = (e: KeyboardEvent) => {
    const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y";

    if (isUndo) {
      e.preventDefault(); // prevent browser undo
      this.redoLastShape();
    }
  };

  mouseDownHandler = (e: MouseEvent) => {
    if (this.isActiveTool === "text") {
      this.startTextInput(e.clientX, e.clientY);
      return;
    }
    this.clicked = true;

    const x = e.clientX;
    const y = e.clientY;

    this.startX = x;
    this.startY = y;
    this.points = [{ x: e.clientX, y: e.clientY }];
  };
  mouseUpHandler = (e: MouseEvent) => {
    this.clicked = false;
    const width = e.clientX - this.startX;
    const height = e.clientY - this.startY;

    const isActiveTool = this.isActiveTool;
    let shape: Shape | null = null;
    if (isActiveTool === "rect") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        height,
        width,
      };
    } else if (isActiveTool === "circle") {
      const radius = Math.max(width, height) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
      };
    } else if (isActiveTool === "pencil") {
      shape = {
        type: "pencil",
        points: [...this.points],
      };
    } else if (isActiveTool === "arrowPoint") {
      const endX = e.clientX;
      const endY = e.clientY;
      shape = {
        type: "arrowPoint",
        startX: this.startX,
        startY: this.startY,
        endX: endX,
        endY: endY,
      };
    }

    if (!shape) {
      return;
    }
    this.existingShapes.push(shape);

    this.socket.send(
      JSON.stringify({
        type: "chat",
        clientId: this.clientId,
        message: JSON.stringify({
          shape,
        }),
        roomId: this.roomId,
      }),
    );
  };
  mouseMoveHandler = (e: MouseEvent) => {
    if (this.clicked) {
      const width = e.clientX - this.startX;
      const height = e.clientY - this.startY;
      this.clearCanvas();
      this.ctx.strokeStyle = "rgba(255, 255, 255)";
      const isActiveTool = this.isActiveTool;
      if (isActiveTool === "rect") {
        this.ctx.strokeRect(this.startX, this.startY, width, height);
      } else if (isActiveTool === "circle") {
        const radius = Math.max(width, height) / 2;
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (isActiveTool === "pencil") {
        const points = { x: e.clientX, y: e.clientY };
        this.points.push(points);
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length - 1; i++) {
          const midX = (this.points[i].x + this.points[i + 1].x) / 2;
          const midY = (this.points[i].y + this.points[i + 1].y) / 2;
          this.ctx.quadraticCurveTo(
            this.points[i].x,
            this.points[i].y,
            midX,
            midY,
          );
          this.ctx.lineWidth = 2;
        }
        this.ctx.stroke();
      } else if (isActiveTool === "arrowPoint") {
        const endX = e.clientX;
        const endY = e.clientY;
        const dx = endX - this.startX;
        const dy = endY - this.startY;
        const headLength = 10;
        const angle = Math.atan2(dy, dx);
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(
          endX - headLength * Math.cos(angle - Math.PI / 6),
          endY - headLength * Math.sin(angle - Math.PI / 6),
        );
        this.ctx.lineTo(endX, endY);
        this.ctx.lineTo(
          endX - headLength * Math.cos(angle + Math.PI / 6),
          endY - headLength * Math.sin(angle + Math.PI / 6),
        );
        this.ctx.stroke();
        this.ctx.closePath();
      }
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
  initKeyboardHandlers() {
    window.addEventListener("keydown", this.keyDownUndoHandler);
    window.addEventListener("keydown", this.keyDownRedoHandler);
  }
}
