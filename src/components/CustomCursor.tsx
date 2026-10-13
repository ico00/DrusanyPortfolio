"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue } from "framer-motion";

const DOT_SIZE = 10;

export default function CustomCursor() {
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasMovedRef = useRef(false);

  const dotX = useMotionValue(0);
  const dotY = useMotionValue(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setIsVisible(true);
      }
      dotX.set(e.clientX - DOT_SIZE / 2);
      dotY.set(e.clientY - DOT_SIZE / 2);
    },
    [dotX, dotY]
  );

  const handleMouseLeave = useCallback(() => {
    hasMovedRef.current = false;
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const isDesktop = window.matchMedia("(hover: hover)").matches;
    setIsEnabled(isDesktop);
  }, []);

  useEffect(() => {
    if (!isEnabled || pathname?.startsWith("/admin")) return;

    document.body.style.cursor = "none";
    document.body.classList.add("custom-cursor-active");

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.body.style.cursor = "";
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isEnabled, pathname, handleMouseMove, handleMouseLeave]);

  if (!isEnabled) return null;

  // Admin stranice – isključi custom cursor radi performansi (galerija s puno thumbnails)
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Dot - instant tracking, no React re-renders on move */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[999999] rounded-full bg-white mix-blend-difference"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          x: dotX,
          y: dotY,
        }}
        animate={{
          opacity: isVisible ? 0.85 : 0,
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
    </>
  );
}
