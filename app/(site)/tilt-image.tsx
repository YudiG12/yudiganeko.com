"use client";

import Image, { type ImageProps } from "next/image";
import { useRef } from "react";

const MAX_TILT = 12;

export default function TiltImage({ className, ...props }: ImageProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.transform = `perspective(800px) rotateX(${(0.5 - y) * MAX_TILT * 2}deg) rotateY(${(x - 0.5) * MAX_TILT * 2}deg) scale(1.03)`;
  }

  function handleLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="shrink-0 transition-transform duration-200 ease-out will-change-transform motion-reduce:!transform-none"
      style={{ transformStyle: "preserve-3d" }}
    >
      <Image className={className} {...props} />
    </div>
  );
}
