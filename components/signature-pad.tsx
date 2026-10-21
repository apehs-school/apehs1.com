"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function SignaturePad({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ink = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.scale(ratio, ratio);
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#0b1f3a";
    context.clearRect(0, 0, width, height);
    if (!value) return;
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, width, height);
    image.src = value;
  }, [value]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const cursor = point(event);
    context.beginPath();
    context.moveTo(cursor.x, cursor.y);
    ink.current = true;
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!ink.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const cursor = point(event);
    context.lineTo(cursor.x, cursor.y);
    context.stroke();
  }

  function finish(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!ink.current) return;
    ink.current = false;
    onChange(event.currentTarget.toDataURL("image/png"));
  }

  return (
    <div className="apply-sign">
      <span>{label}</span>
      <canvas
        ref={canvasRef}
        aria-label={label}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerLeave={finish}
      />
      <Button type="button" variant="outline" onClick={() => onChange("")}>Clear signature</Button>
    </div>
  );
}
