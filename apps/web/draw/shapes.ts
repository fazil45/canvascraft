export interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string | number;
  color: string;
}

export type Shape = BaseShape &
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
        points: Point[];
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

export const TEXT_FONT_SIZE = 20;
export const HIT_TOLERANCE = 6;
const ARROW_HEAD_LENGTH = 10;
const PENCIL_WIDTH = 2;
const TEXT_LINE_HEIGHT = 1.2;

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = PENCIL_WIDTH;

  switch (shape.type) {
    case "rect":
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(
        shape.centerX,
        shape.centerY,
        Math.abs(shape.radius),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
    case "pencil":
      strokePencil(ctx, shape.points);
      break;
    case "arrowPoint":
      strokeArrow(ctx, shape.startX, shape.startY, shape.endX, shape.endY);
      break;
    case "text": {
      ctx.font = `${shape.fontSize}px sans-serif`;
      const lineHeight = shape.fontSize * TEXT_LINE_HEIGHT;
      shape.content.split("\n").forEach((line, i) => {
        ctx.fillText(line, shape.x, shape.y + i * lineHeight);
      });
      break;
    }
  }

  ctx.restore();
}

export function strokePencil(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

export function strokeArrow(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const angle = Math.atan2(endY - startY, endX - startX);

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    endX - ARROW_HEAD_LENGTH * Math.cos(angle - Math.PI / 6),
    endY - ARROW_HEAD_LENGTH * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(endX, endY);
  ctx.lineTo(
    endX - ARROW_HEAD_LENGTH * Math.cos(angle + Math.PI / 6),
    endY - ARROW_HEAD_LENGTH * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
}

export function moveShapeBy(shape: Shape, dx: number, dy: number) {
  switch (shape.type) {
    case "rect":
    case "text":
      shape.x += dx;
      shape.y += dy;
      break;
    case "arrowPoint":
      shape.startX += dx;
      shape.startY += dy;
      shape.endX += dx;
      shape.endY += dy;
      break;
    case "circle":
      shape.centerX += dx;
      shape.centerY += dy;
      break;
    case "pencil":
      shape.points = shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      break;
  }
}

export function hitTestShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  x: number,
  y: number,
): boolean {
  switch (shape.type) {
    case "arrowPoint":
      return (
        pointToSegmentDistance(
          x,
          y,
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY,
        ) < HIT_TOLERANCE
      );
    case "rect": {
      const left = Math.min(shape.x, shape.x + shape.width);
      const top = Math.min(shape.y, shape.y + shape.height);
      return (
        x >= left &&
        x <= left + Math.abs(shape.width) &&
        y >= top &&
        y <= top + Math.abs(shape.height)
      );
    }
    case "circle":
      return (
        Math.hypot(x - shape.centerX, y - shape.centerY) <=
        Math.abs(shape.radius)
      );
    case "pencil":
      return shape.points.some(
        (p) => Math.hypot(p.x - x, p.y - y) < HIT_TOLERANCE,
      );
    case "text": {
      ctx.font = `${shape.fontSize}px sans-serif`;
      const lines = shape.content.split("\n");
      const width = Math.max(
        ...lines.map((line) => ctx.measureText(line).width),
        0,
      );
      const height = lines.length * shape.fontSize * TEXT_LINE_HEIGHT;
      return (
        x >= shape.x &&
        x <= shape.x + width &&
        y >= shape.y - shape.fontSize &&
        y <= shape.y - shape.fontSize + height
      );
    }
  }
}

export function isMeaningfulShape(shape: Shape): boolean {
  switch (shape.type) {
    case "rect":
      return Math.abs(shape.width) > 2 || Math.abs(shape.height) > 2;
    case "circle":
      return Math.abs(shape.radius) > 2;
    case "pencil":
      return shape.points.length >= 2;
    case "arrowPoint":
      return (
        Math.hypot(shape.endX - shape.startX, shape.endY - shape.startY) > 2
      );
    case "text":
      return shape.content.trim().length > 0;
  }
}

function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));

  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
