import {
  RADIUS,
  NODE_COLOR,
  LINK_COLOR,
  LINE_WIDTH,
  NODE,
  DIRECTED
} from "./constant";

export function drawCircle(
  ctx,
  x,
  y,
  radius,
  fill,
  stroke,
  strokeWidth,
  name,
  selected
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  if (fill) {
    if (selected) {
      ctx.fillStyle = "blue";
      ctx.strokeStyle = "pink";
      ctx.lineWidth = "10";
      ctx.stroke();
      ctx.lineWidth = LINE_WIDTH;
    } else {
      ctx.fillStyle = fill;
    }
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.strokeWidth = strokeWidth;
    ctx.stroke();
  }

  ctx.font = "12pt Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(name, x, y);
}

function lineToAngle(x1, y1, length, angle) {
  const x2 = x1 + length * Math.cos(angle),
    y2 = y1 + length * Math.sin(angle);

  return { x: x2, y: y2 };
}

function lineDistance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function drawLine(ctx, start, end, directed) {
  const isAutoLink = start.id === end.id;
  if (isAutoLink) {
    const s = start.x - RADIUS;
    const e = start.x + RADIUS;
    // This is magic for now...
    const angle = 121.3;
    const headlen = 10;
    let cp1 = { x: s - RADIUS, y: start.y - 2.4 * RADIUS };
    let cp2 = { x: e + RADIUS, y: start.y - 2.4 * RADIUS };
    ctx.strokeStyle = LINK_COLOR;
    ctx.beginPath();
    ctx.beginPath();
    ctx.moveTo(s, start.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, e, start.y);
    ctx.lineTo(
      e - headlen * Math.cos(angle - Math.PI / 6),
      start.y - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(e, start.y);
    ctx.lineTo(
      e - headlen * Math.cos(angle + Math.PI / 6),
      start.y - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
    return;
  }
  const headlen = 10;
  const tox = end.x;
  const toy = end.y;
  const fromx = start.x;
  const fromy = start.y;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const angle = Math.atan2(dy, dx);
  const { x: x1, y: y1 } = lineToAngle(fromx, fromy, RADIUS, angle);
  const { x: x2, y: y2 } = lineToAngle(
    fromx,
    fromy,
    lineDistance(start, end) - RADIUS,
    angle
  );
  ctx.beginPath();
  ctx.strokeStyle = LINK_COLOR;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  if (directed) {
    ctx.lineTo(
      x2 - headlen * Math.cos(angle - Math.PI / 6),
      y2 - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(x2, y2);
    ctx.lineTo(
      x2 - headlen * Math.cos(angle + Math.PI / 6),
      y2 - headlen * Math.sin(angle + Math.PI / 6)
    );
  }

  ctx.stroke();
}

export function draw(ctx, appState, w, h) {
  const { elements, selectedElementIds, selectedNode, graphType } = appState;
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = LINE_WIDTH;
  elements.forEach((el) => {
    if (el.type === NODE) {
      const isSelected = selectedElementIds.find((e) => e === el.id);
      const isFocused = selectedNode?.id === el.id;
      drawCircle(
        ctx,
        el.x,
        el.y,
        RADIUS,
        NODE_COLOR,
        isSelected && "red",
        1,
        el.name,
        isFocused
      );
    } else {
      const start = elements.find((e1) => e1.id === el.start);
      const end = elements.find((e1) => e1.id === el.end);

      drawLine(ctx, start, end, graphType === DIRECTED);
    }
  });
}

// x,y is the point to test
// cx, cy is circle center, and radius is circle radius
export function pointInCircle(x, y, cx, cy, radius) {
  const distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  return distancesquared <= radius * radius;
}

export function getCoordinatesFromEvent(e, canvas) {
  const mouseX = parseInt(e.nativeEvent.offsetX - canvas.clientLeft, 10);
  const mouseY = parseInt(e.nativeEvent.offsetY - canvas.clientTop, 10);
  return [mouseX, mouseY];
}
