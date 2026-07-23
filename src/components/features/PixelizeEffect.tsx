"use client";

import { useEffect, useRef } from "react";

const IN_STAGES  = [2, 10, 25, 50, 100];   // fine → coarse
const IN_STAGE_MS = 300;

const OUT_STAGES  = [100, 50, 25, 10, 2];  // coarse → fine
const OUT_STAGE_MS = 300;

const VARIATION = 10; // ±value per RGB channel per block

interface PixelizeEffectProps {
  /** Landing page snapshot — plays fine→coarse while API runs */
  snapshotUrl: string;
  /** Dashboard snapshot — when set, immediately switches to coarse→fine reveal */
  targetSnapshotUrl?: string | null;
  /** Called when the coarse→fine reveal finishes */
  onComplete?: () => void;
  /** Called 50ms before onComplete */
  onBeforeComplete?: () => void;
}

function drawPixelated(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  blockSize: number,
) {
  const w = canvas.width;
  const h = canvas.height;
  const smallW = Math.max(1, Math.ceil(w / blockSize));
  const smallH = Math.max(1, Math.ceil(h / blockSize));

  const off = document.createElement("canvas");
  off.width  = smallW;
  off.height = smallH;
  const offCtx = off.getContext("2d")!;
  offCtx.drawImage(img, 0, 0, smallW, smallH);

  const id = offCtx.getImageData(0, 0, smallW, smallH);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i]   = Math.min(255, Math.max(0, d[i]   + Math.round((Math.random() - 0.5) * VARIATION * 2)));
    d[i+1] = Math.min(255, Math.max(0, d[i+1] + Math.round((Math.random() - 0.5) * VARIATION * 2)));
    d[i+2] = Math.min(255, Math.max(0, d[i+2] + Math.round((Math.random() - 0.5) * VARIATION * 2)));
  }
  offCtx.putImageData(id, 0, 0);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, w, h);
}

export function PixelizeEffect({ snapshotUrl, targetSnapshotUrl, onComplete, onBeforeComplete }: PixelizeEffectProps) {
  const canvasRef           = useRef<HTMLCanvasElement>(null);
  const onCompleteRef       = useRef(onComplete);
  const onBeforeCompleteRef = useRef(onBeforeComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onBeforeCompleteRef.current = onBeforeComplete; }, [onBeforeComplete]);

  // All active timers — cancelled whenever the "out" phase takes over
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Phase "in": fine → coarse (runs on mount with landing snapshot) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    canvas.style.opacity    = "1";
    canvas.style.transition = "none";

    const img = new Image();
    img.src = snapshotUrl;
    img.onload = () => {
      IN_STAGES.forEach((blockSize, i) => {
        const t = setTimeout(() => drawPixelated(ctx, canvas, img, blockSize), i * IN_STAGE_MS);
        timersRef.current.push(t);
      });
      // holds at max after the last stage — no shimmer
    };

    return () => {
      window.removeEventListener("resize", setSize);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [snapshotUrl]);

  // ── Phase "out": coarse → fine → fade (runs when dashboard snapshot arrives) ──
  useEffect(() => {
    if (!targetSnapshotUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cancel any pending "in" timers so we take over the canvas immediately
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const img = new Image();
    img.src = targetSnapshotUrl;
    img.onload = () => {
      // Draw max-block first frame instantly (seamless from where "in" ended)
      drawPixelated(ctx, canvas, img, OUT_STAGES[0]);

      OUT_STAGES.forEach((blockSize, i) => {
        const t = setTimeout(() => {
          drawPixelated(ctx, canvas, img, blockSize);

          if (i === OUT_STAGES.length - 1) {
            // Final stage — fade canvas out, then call onComplete
            const fadeTimer = setTimeout(() => {
              canvas.style.transition = "opacity 350ms ease";
              canvas.style.opacity    = "0";
              const beforeTimer = setTimeout(() => onBeforeCompleteRef.current?.(), 300);
              timersRef.current.push(beforeTimer);
              const doneTimer = setTimeout(() => onCompleteRef.current?.(), 400);
              timersRef.current.push(doneTimer);
            }, 80);
            timersRef.current.push(fadeTimer);
          }
        }, i * OUT_STAGE_MS);
        timersRef.current.push(t);
      });
    };
    img.onerror = () => {
      const t = setTimeout(() => onCompleteRef.current?.(), 500);
      timersRef.current.push(t);
    };
  }, [targetSnapshotUrl]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[200] pointer-events-none"
      aria-hidden="true"
    />
  );
}
