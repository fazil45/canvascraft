import { ToolShape } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { toast } from "sonner";
import { RoomStore } from "@/store/RoomStore";

interface BaseShape {
  id: string;
  color: string;
}

type Shape = BaseShape &
  (
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
      }
  );

interface Point {
  x: number;
  y: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activeTextEl: HTMLTextAreaElement | null;
  private textOrigin: Point | null;
  private existingShapes: Shape[];
  private color: string;
  private roomId: number;
  private socket: WebSocket;
  private clicked: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private clientId: string;
  private isActiveTool: ToolShape = "rect";
  private points: Point[];
  private undoStore: Shape[] = [];
  private selectedShapeId: number | string | null = null;
  private dragOffset: Point = { x: 0, y: 0 };
  private redoStore: Shape[] = [];

  constructor(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket) {
    console.log("Game created");
    this.canvas = canvas;
    this.color = "";
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
    console.log("START TEXT INPUT", x, y);

    const textarea = document.createElement("textarea");
    console.log("TEXTAREA CREATED", textarea);
    textarea.style.position = "fixed";
    textarea.style.left = `${x}px`;
    textarea.style.top = `${y - 10}px`;
    textarea.style.background = "transparent";
    textarea.style.color = "white";
    textarea.style.font = "20px sans-serif";
    textarea.style.border = "1px solid #888";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.overflow = "hidden";
    textarea.style.zIndex = "1000";
    textarea.rows = 1;
    textarea.style.width = "200px";

    document.body.appendChild(textarea);

    textarea.focus();

    this.activeTextEl = textarea;
    this.textOrigin = { x, y };

    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });

    console.log(textarea.getBoundingClientRect());

    textarea.addEventListener("keydown", (e) => {
      e.stopPropagation();

      if (e.key === "Escape") {
        this.cancelTextInput();
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.commitTextInput();
      }
    });

    // textarea.addEventListener("blur", () => this.commitTextInput());
  }

  private commitTextInput() {
    if (!this.activeTextEl || !this.textOrigin) return;

    const content = this.activeTextEl.value.trim();
    const { x, y } = this.textOrigin;

    this.activeTextEl.remove();
    this.activeTextEl = null;
    this.textOrigin = null;

    if (!content) return;

    const shape: Shape = {
      id: crypto.randomUUID(),
      type: "text",
      color: this.color,
      x,
      y,
      content,
      fontSize: 20,
    };

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

  private getShapeOrigin(shape: Shape): Point {
    switch (shape.type) {
      case "arrowPoint":
        return { x: shape.startX, y: shape.startY };
      case "circle":
        return { x: shape.centerX, y: shape.centerY };
      case "pencil":
        return shape.points[0] ?? { x: 0, y: 0 };
      case "rect":
        return { x: shape.x, y: shape.y };
      case "text":
        return { x: shape.x, y: shape.y };
    }
  }

  private moveShapeBy(shape: Shape, dx: number, dy: number) {
    if (shape.type === "rect") {
      shape.x += dx;
      shape.y += dy;
    } else if (shape.type === "arrowPoint") {
      shape.startX += dx;
      shape.startY += dy;
    } else if (shape.type == "circle") {
      shape.centerX += dx;
      shape.centerY += dy;
    } else if (shape.type === "pencil") {
      shape.points = shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    } else if (shape.type === "text") {
      shape.x += dx;
      shape.y += dy;
    }
  }

  private getShapeAtPoint(x: number, y: number): number | null {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
      if (shape.type === "arrowPoint") {
        if (
          this.pointToSegmentDistance(
            x,
            y,
            shape.startX,
            shape.startY,
            shape.endX,
            shape.endY,
          ) < 6
        )
          return i;
      } else if (shape.type === "rect") {
        const rx = Math.min(shape.x, shape.x + shape.width);
        const ry = Math.min(shape.y, shape.y + shape.height);
        if (
          x >= rx &&
          x <= rx + Math.abs(shape.width) &&
          y >= ry &&
          y <= ry + Math.abs(shape.height)
        )
          return i;
      } else if (shape.type === "circle") {
        const dist = Math.hypot(x - shape.centerX, y - shape.centerY);
        if (dist <= Math.abs(shape.radius)) return i;
      } else if (shape.type === "pencil") {
        if (shape.points.some((p) => Math.hypot(p.x - x, p.y - y) < 6))
          return i;
      } else if (shape.type === "text") {
        this.ctx.font = `${shape.fontSize}pc sans-serif`;
        const w = this.ctx.measureText(shape.content).width;
        if (
          x >= shape.x &&
          x <= shape.x + w &&
          y >= shape.y - shape.fontSize &&
          y <= shape.y
        )
          return i;
      }
    }

    return null;
  }

  private pointToSegmentDistance(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) {
    const A = px - x1,
      B = py - y1,
      C = x2 - x1,
      D = y2 - y1;
    const lengSq = C * C + D * D;
    const t =
      lengSq === 0 ? 0 : Math.max(0, Math.min(1, (A * C + B * D) / lengSq));
    return Math.hypot(px - (x1 + t * C), py - (y1 + t * D));
  }

  setTool(tool: ToolShape) {
    if (this.isActiveTool === "text" && tool !== "text" && this.activeTextEl) {
      this.commitTextInput();
    }
    this.isActiveTool = tool;
  }

  setColor(color: string) {
    this.color = color;
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
    const shapes = (this.existingShapes = await getExistingShapes(this.roomId));
    console.log("EXISTING SHAPES FROM SERVER:", shapes);

    console.log(
      "INVALID SHAPES:",
      shapes.filter((shape: any) => !shape),
    );

    this.existingShapes = shapes.filter(Boolean);

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
          const local = this.existingShapes.find(
            (s) => s.id === message.tempId,
          );
          if (local) {
            local.id = message.chatId;
          }
          return;
        }
        const parsedShape = JSON.parse(message.message);
        this.existingShapes.push(parsedShape.shape);
        this.clearCanvas();
      }

      if (message.type === "move") {
        if (!message.shape || message.shape.id == null) return;
        const index = this.existingShapes.findIndex(
          (s) => s.id === message.shape.id,
        );
        if (index !== -1) {
          this.existingShapes[index] = message.shape;
          this.clearCanvas();
        }
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
    this.ctx.fillStyle = "rgba(0,0,0)";
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingShapes.map((shape) => {
      if (!shape) {
        return;
      }
      if (shape.type === "rect") {
        this.ctx.strokeStyle = shape.color;
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.strokeStyle = shape.color;
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
        this.ctx.strokeStyle = shape.color;
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
        this.ctx.strokeStyle = shape.color;
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
        this.ctx.fillStyle = this.color;
        this.ctx.font = `${shape.fontSize}px sans-serif`;
        const lineHeight = shape.fontSize * 1.2;
        shape.content.split("\n").forEach((line, i) => {
          this.ctx.fillText(line, shape.x, shape.y + i * lineHeight);
        });
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

    if (this.isActiveTool === "mouse") {
      const index = this.getShapeAtPoint(e.clientX, e.clientY);
      if (index !== null && typeof this.existingShapes[index].id === "number") {
        this.selectedShapeId = this.existingShapes[index].id;
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
      }
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
        color: this.color,
        id: crypto.randomUUID(),
        x: this.startX,
        y: this.startY,
        height,
        width,
      };
    } else if (isActiveTool === "circle") {
      const radius = Math.max(width, height) / 2;
      shape = {
        type: "circle",
        color: this.color,
        id: crypto.randomUUID(),
        radius: radius,
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
      };
    } else if (isActiveTool === "pencil") {
      shape = {
        type: "pencil",
        color: this.color,
        id: crypto.randomUUID(),
        points: [...this.points],
      };
    } else if (isActiveTool === "arrowPoint") {
      const endX = e.clientX;
      const endY = e.clientY;
      shape = {
        type: "arrowPoint",
        color: this.color,
        id: crypto.randomUUID(),
        startX: this.startX,
        startY: this.startY,
        endX: endX,
        endY: endY,
      };
    } else if (this.isActiveTool === "mouse") {
      if (this.selectedShapeId !== null) {
        const shape = this.existingShapes.find(
          (s) => s.id === this.selectedShapeId,
        );
        if (shape) {
          this.socket.send(
            JSON.stringify({
              type: "move",
              shape,
              roomId: this.roomId,
              clientId: this.clientId,
            }),
          );
        }
      }
      this.selectedShapeId = null;
      return;
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
      // this.ctx.strokeStyle = "rgba(255, 255, 255)";
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
      } else if (
        isActiveTool === "mouse" &&
        this.clicked &&
        this.selectedShapeId !== null
      ) {
        const shape = this.existingShapes.find(
          (s) => s.id === this.selectedShapeId,
        );
        if (!shape) {
          this.selectedShapeId = null;
          this.clicked = false;
          return;
        }
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        this.moveShapeBy(shape, dx, dy);
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.clearCanvas();
        return;
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
