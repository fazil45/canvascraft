import { ToolShape } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { toast } from "sonner";
import { RoomStore } from "@/store/RoomStore";
import {
  drawShape,
  hitTestShape,
  isMeaningfulShape,
  moveShapeBy,
  Shape,
  strokeArrow,
  strokePencil,
  TEXT_FONT_SIZE,
  type Point,
} from "./shapes";

type SocketMessage = {
  type: string;
  clientId?: string;
  tempId?: string | number;
  chatId?: string | number;
  message?: string;
  shape?: Shape;
  users?: { userId: string; username: string }[];
  userId?: string;
  username?: string;
};

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: WebSocket;
  private roomId: number;
  private clientId: string;

  private existingShapes: Shape[] = [];
  private undoStore: Shape[] = [];
  private points: Point[] = [];

  private color = "#ffffff";
  private isActiveTool: ToolShape = "mouse";
  private clicked = false;
  private startX = 0;
  private startY = 0;
  private selectedShapeId: Shape["id"] | null = null;

  private activeTextEl: HTMLTextAreaElement | null = null;
  private textOrigin: Point | null = null;

  constructor(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.roomId = roomId;
    this.socket = socket;
    this.clientId = crypto.randomUUID();

    void this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.initKeyboardHandlers();
    this.updateCursor();
  }

  setTool(tool: ToolShape) {
    if (this.isActiveTool === "text" && tool !== "text") {
      this.commitTextInput();
    }
    this.isActiveTool = tool;
    this.updateCursor();
  }

  setColor(color: string) {
    this.color = color;
  }

  undoLastShape() {
    const shape = this.existingShapes.pop();
    if (!shape) return;

    this.undoStore.push(shape);
    this.clearCanvas();
    this.send({
      type: "undo",
      shape,
      roomId: this.roomId,
      clientId: this.clientId,
    });
  }

  redoLastShape() {
    const shape = this.undoStore.pop();
    if (!shape) return;

    this.existingShapes.push(shape);
    this.clearCanvas();
    this.send({
      type: "redo",
      shape,
      roomId: this.roomId,
      clientId: this.clientId,
    });
  }

  deleteShape() {
    if (this.existingShapes.length === 0) return;

    this.send({
      type: "delete",
      roomId: this.roomId,
      clientId: this.clientId,
    });
    this.existingShapes = [];
    this.undoStore = [];
    this.clearCanvas();
  }

  destroy() {
    this.cancelTextInput();
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    window.removeEventListener("keydown", this.keyDownHandler);
    this.socket.onmessage = null;
    RoomStore.getState().reset();
  }

  private async init() {
    const shapes = await getExistingShapes(this.roomId);
    this.existingShapes = (shapes as Shape[]).filter(Boolean);
    this.clearCanvas();
  }

  private initHandlers() {
    this.socket.onmessage = (event) => {
      const room = RoomStore.getState();
      const message = JSON.parse(event.data) as SocketMessage;

      switch (message.type) {
        case "room-users":
          if (message.users) room.setParticipants(message.users);
          break;
        case "user-joined":
          if (message.userId && message.username) {
            room.addParticipant({
              userId: message.userId,
              username: message.username,
            });
            toast.info(`${message.username} has joined the room`);
          }
          break;
        case "user-left":
          if (message.userId) room.removeParticipant(message.userId);
          if (message.username) toast.info(`${message.username} has left`);
          break;
        case "chat":
          this.handleRemoteChat(message);
          break;
        case "move":
          this.replaceShape(message.shape);
          break;
        case "undo":
          if (message.clientId === this.clientId) return;
          this.removeShape(message.shape);
          break;
        case "redo":
          if (message.clientId === this.clientId || !message.shape) return;
          this.existingShapes.push(message.shape);
          this.clearCanvas();
          break;
        case "delete":
          this.existingShapes = [];
          this.undoStore = [];
          this.clearCanvas();
          break;
      }
    };
  }

  private handleRemoteChat(message: SocketMessage) {
    if (message.clientId === this.clientId) {
      const local = this.existingShapes.find((s) => s.id === message.tempId);
      if (local && message.chatId != null) {
        local.id = message.chatId;
      }
      return;
    }

    if (!message.message) return;

    try {
      const parsed = JSON.parse(message.message) as { shape?: Shape };
      if (!parsed.shape) return;
      this.existingShapes.push(parsed.shape);
      this.clearCanvas();
    } catch {
      return;
    }
  }

  private replaceShape(shape?: Shape) {
    if (!shape || shape.id == null) return;
    const index = this.existingShapes.findIndex((s) => s.id === shape.id);
    if (index === -1) return;
    this.existingShapes[index] = shape;
    this.clearCanvas();
  }

  private removeShape(shape?: Shape) {
    if (!shape) return;
    const index = this.existingShapes.findIndex((s) => s.id === shape.id);
    if (index === -1) return;
    const [removed] = this.existingShapes.splice(index, 1);
    this.undoStore.push(removed);
    this.clearCanvas();
  }

  private clearCanvas() {
    console.log("existingShapes:", this.existingShapes);
    this.ctx.fillStyle = "rgba(0,0,0)";
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.existingShapes.forEach((shape) => {
      if (shape) drawShape(this.ctx, shape);
    });
    if (this.clicked && this.selectedShapeId !== null) {
      const selectedShape = this.existingShapes.find(
        (shape) => shape.id === this.selectedShapeId,
      );
      if (selectedShape) this.drawSelectionBoundary(selectedShape);
    }
  }

  private keyDownHandler = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;

    const key = e.key.toLowerCase();
    const isRedo = key === "y" || (key === "z" && e.shiftKey);
    const isUndo = key === "z" && !e.shiftKey;

    if (isRedo) {
      e.preventDefault();
      this.redoLastShape();
    } else if (isUndo) {
      e.preventDefault();
      this.undoLastShape();
    }
  };

  private mouseDownHandler = (e: MouseEvent) => {
    const { x, y } = this.getPointer(e);

    if (this.isActiveTool === "text") {
      this.startTextInput(x, y, e.clientX, e.clientY);
      return;
    }

    if (this.isActiveTool === "mouse") {
      const shape = this.getShapeAtPoint(x, y);
      if (!shape) return;
      this.selectedShapeId = shape.id;
      this.clicked = true;
      this.startX = x;
      this.startY = y;
      this.updateCursor();
      return;
    }

    this.clicked = true;
    this.startX = x;
    this.startY = y;
    this.points = [{ x, y }];
  };

  private mouseUpHandler = (e: MouseEvent) => {
    if (this.isActiveTool === "mouse") {
      this.finishMove();
      return;
    }

    if (!this.clicked) return;
    this.clicked = false;
    this.updateCursor();

    const { x, y } = this.getPointer(e);
    const shape = this.createShapeFromDrag(x, y);
    if (!shape || !isMeaningfulShape(shape)) return;

    this.existingShapes.push(shape);
    this.clearCanvas();
    this.send({
      type: "chat",
      clientId: this.clientId,
      message: JSON.stringify({ shape }),
      roomId: this.roomId,
    });
  };

  private mouseMoveHandler = (e: MouseEvent) => {
    if (!this.clicked) return;

    const { x, y } = this.getPointer(e);

    if (this.isActiveTool === "mouse") {
      this.dragSelectedShape(x, y);
      return;
    }

    this.clearCanvas();
    this.drawPreview(x, y);
  };

  private finishMove() {
    if (this.selectedShapeId !== null) {
      const shape = this.existingShapes.find(
        (s) => s.id === this.selectedShapeId,
      );
      if (shape) {
        this.send({
          type: "move",
          shape,
          roomId: this.roomId,
          clientId: this.clientId,
        });
      }
    }

    this.selectedShapeId = null;
    this.clicked = false;
    this.updateCursor();
    this.clearCanvas();
  }

  private dragSelectedShape(x: number, y: number) {
    const shape = this.existingShapes.find(
      (s) => s.id === this.selectedShapeId,
    );
    if (!shape) {
      this.selectedShapeId = null;
      this.clicked = false;
      return;
    }

    moveShapeBy(shape, x - this.startX, y - this.startY);
    this.startX = x;
    this.startY = y;
    this.clearCanvas();
  }

  private createShapeFromDrag(endX: number, endY: number): Shape | null {
    const width = endX - this.startX;
    const height = endY - this.startY;
    const id = crypto.randomUUID();
    const color = this.color;

    switch (this.isActiveTool) {
      case "rect":
        return {
          type: "rect",
          id,
          color,
          x: this.startX,
          y: this.startY,
          width,
          height,
        };
      case "circle":
        return {
          type: "circle",
          id,
          color,
          radius: Math.max(width, height) / 2,
          centerX: this.startX + width / 2,
          centerY: this.startY + height / 2,
        };
      case "pencil":
        return { type: "pencil", id, color, points: [...this.points] };
      case "arrowPoint":
        return {
          type: "arrowPoint",
          id,
          color,
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
        };
      default:
        return null;
    }
  }

  private drawPreview(x: number, y: number) {
    const width = x - this.startX;
    const height = y - this.startY;

    this.ctx.save();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 2;

    switch (this.isActiveTool) {
      case "rect":
        this.ctx.strokeRect(this.startX, this.startY, width, height);
        break;
      case "circle": {
        const radius = Math.max(width, height) / 2;
        this.ctx.beginPath();
        this.ctx.arc(
          this.startX + width / 2,
          this.startY + height / 2,
          Math.abs(radius),
          0,
          Math.PI * 2,
        );
        this.ctx.stroke();
        break;
      }
      case "pencil":
        this.points.push({ x, y });
        strokePencil(this.ctx, this.points);
        break;
      case "arrowPoint":
        strokeArrow(this.ctx, this.startX, this.startY, x, y);
        break;
    }

    this.ctx.restore();
  }

  private startTextInput(
    canvasX: number,
    canvasY: number,
    clientX: number,
    clientY: number,
  ) {
    this.commitTextInput();

    const textarea = document.createElement("textarea");
    textarea.style.position = "fixed";
    textarea.style.left = `${clientX}px`;
    textarea.style.top = `${clientY - 10}px`;
    textarea.style.background = "transparent";
    textarea.style.color = this.color;
    textarea.style.font = `${TEXT_FONT_SIZE}px sans-serif`;
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.overflow = "hidden";
    textarea.style.zIndex = "1000";
    textarea.style.padding = "4px";
    textarea.rows = 1;
    textarea.style.width = "200px";

    document.body.appendChild(textarea);
    requestAnimationFrame(() => textarea.focus());

    this.activeTextEl = textarea;
    this.textOrigin = { x: canvasX, y: canvasY };

    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });

    textarea.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        this.cancelTextInput();
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.commitTextInput();
      }
    });

    textarea.addEventListener("blur", () => this.commitTextInput());
  }

  private commitTextInput() {
    const textarea = this.activeTextEl;
    const origin = this.textOrigin;
    if (!textarea || !origin) return;

    const content = textarea.value.trim();
    this.activeTextEl = null;
    this.textOrigin = null;
    if (textarea.isConnected) textarea.remove();
    if (!content) return;

    const shape: Shape = {
      id: crypto.randomUUID(),
      type: "text",
      color: this.color,
      x: origin.x,
      y: origin.y,
      content,
      fontSize: TEXT_FONT_SIZE,
    };

    this.existingShapes.push(shape);
    this.clearCanvas();
    this.send({
      type: "chat",
      clientId: this.clientId,
      message: JSON.stringify({ shape }),
      roomId: this.roomId,
    });
  }

  private cancelTextInput() {
    this.activeTextEl?.remove();
    this.activeTextEl = null;
    this.textOrigin = null;
  }

  private getShapeAtPoint(x: number, y: number): Shape | null {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
      if (hitTestShape(this.ctx, shape, x, y)) return shape;
    }
    return null;
  }

  private getPointer(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private drawSelectionBoundary(shape: Shape) {
    const bounds = this.getShapeBounds(shape);
    const padding = 6;

    this.ctx.save();
    this.ctx.strokeStyle = "#38bdf8";
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([6, 4]);
    this.ctx.strokeRect(
      bounds.left - padding,
      bounds.top - padding,
      bounds.right - bounds.left + padding * 2,
      bounds.bottom - bounds.top + padding * 2,
    );
    this.ctx.restore();
  }

  private getShapeBounds(shape: Shape) {
    switch (shape.type) {
      case "rect":
        return {
          left: Math.min(shape.x, shape.x + shape.width),
          top: Math.min(shape.y, shape.y + shape.height),
          right: Math.max(shape.x, shape.x + shape.width),
          bottom: Math.max(shape.y, shape.y + shape.height),
        };
      case "circle":
        return {
          left: shape.centerX - Math.abs(shape.radius),
          top: shape.centerY - Math.abs(shape.radius),
          right: shape.centerX + Math.abs(shape.radius),
          bottom: shape.centerY + Math.abs(shape.radius),
        };
      case "arrowPoint":
        return {
          left: Math.min(shape.startX, shape.endX),
          top: Math.min(shape.startY, shape.endY),
          right: Math.max(shape.startX, shape.endX),
          bottom: Math.max(shape.startY, shape.endY),
        };
      case "pencil":
        return shape.points.reduce(
          (bounds, point) => ({
            left: Math.min(bounds.left, point.x),
            top: Math.min(bounds.top, point.y),
            right: Math.max(bounds.right, point.x),
            bottom: Math.max(bounds.bottom, point.y),
          }),
          {
            left: shape.points[0]?.x ?? 0,
            top: shape.points[0]?.y ?? 0,
            right: shape.points[0]?.x ?? 0,
            bottom: shape.points[0]?.y ?? 0,
          },
        );
      case "text": {
        this.ctx.font = `${shape.fontSize}px sans-serif`;
        const width = Math.max(
          ...shape.content
            .split("\n")
            .map((line) => this.ctx.measureText(line).width),
          0,
        );
        return {
          left: shape.x,
          top: shape.y - shape.fontSize,
          right: shape.x + width,
          bottom: shape.y,
        };
      }
    }
  }

  private updateCursor() {
    if (this.isActiveTool !== "mouse") {
      this.canvas.style.cursor = "crosshair";
      return;
    }
    this.canvas.style.cursor = this.clicked ? "grabbing" : "grab";
  }

  private send(payload: object) {
    if (this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }

  private initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }

  private initKeyboardHandlers() {
    window.addEventListener("keydown", this.keyDownHandler);
  }
}
