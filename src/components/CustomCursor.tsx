"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Aperture } from "lucide-react";

const APERTURE_SIZE = 32;
const DOT_SIZE = 10;

export default function CustomCursor() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isOverPhoto, setIsOverPhoto] = useState(false);
  const hasMovedRef = useRef(false);

  const dotX = useMotionValue(0);
  const dotY = useMotionValue(0);
  const apertureX = useSpring(0, { stiffness: 500, damping: 28 });
  const apertureY = useSpring(0, { stiffness: 500, damping: 28 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setIsVisible(true);
      }
      dotX.set(e.clientX - DOT_SIZE / 2);
      dotY.set(e.clientY - DOT_SIZE / 2);
      apertureX.set(e.clientX - APERTURE_SIZE / 2);
      apertureY.set(e.clientY - APERTURE_SIZE / 2);
    },
    [dotX, dotY, apertureX, apertureY]
  );

  const handleMouseLeave = useCallback(() => {
    hasMovedRef.current = false;
    setIsVisible(false);
  }, []);

  const handleElementHover = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive =
      target.closest("a") ||
      target.closest("button") ||
      target.closest("[role='button']") ||
      target.closest("[data-cursor-hover]");
    setIsHovering(!!isInteractive);
    const overPhoto = target.closest("[data-cursor-aperture]");
    setIsOverPhoto(!!overPhoto);
  }, []);

  useEffect(() => {
    const isDesktop = window.matchMedia("(hover: hover)").matches;
    setIsEnabled(isDesktop);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    document.body.style.cursor = "none";
    document.body.classList.add("custom-cursor-active");

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseover", handleElementHover);

    return () => {
      document.body.style.cursor = "";
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseover", handleElementHover);
    };
  }, [isEnabled, handleMouseMove, handleMouseLeave, handleElementHover]);

  if (!isEnabled) return null;

  return (
    <>
      {/* Dot - instant tracking, no React re-renders on move */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white mix-blend-difference"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          x: dotX,
          y: dotY,
        }}
        animate={{
          opacity: isVisible ? (isOverPhoto ? 1 : 0.85) : 0,
          scale: isOverPhoto ? 1 : 1,
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />

      {/* Aperture icon - only over photos, snappier spring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center mix-blend-difference"
        style={{
          width: APERTURE_SIZE,
          height: APERTURE_SIZE,
          x: apertureX,
          y: apertureY,
        }}
        animate={{
          opacity: isVisible && isOverPhoto ? 1 : 0,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Aperture className="h-full w-full text-white" strokeWidth={1.5} />
      </motion.div>
    </>
  );
}
