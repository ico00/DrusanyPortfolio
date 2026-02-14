"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useSpring } from "framer-motion";
import { Aperture } from "lucide-react";

const APERTURE_SIZE = 32;
const DOT_SIZE = 10;

export default function CustomCursor() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isOverPhoto, setIsOverPhoto] = useState(false);
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });

  const apertureX = useSpring(0, { stiffness: 400, damping: 30 });
  const apertureY = useSpring(0, { stiffness: 400, damping: 30 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setIsVisible(true);
      setDotPos({ x: e.clientX, y: e.clientY });
      apertureX.set(e.clientX);
      apertureY.set(e.clientY);
    },
    [apertureX, apertureY]
  );

  const handleMouseLeave = useCallback(() => {
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
      {/* Dot - subtle when not over photo, mix-blend-difference for artistic invert */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white mix-blend-difference"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          x: dotPos.x - DOT_SIZE / 2,
          y: dotPos.y - DOT_SIZE / 2,
        }}
        animate={{
          opacity: isVisible ? (isOverPhoto ? 1 : 0.85) : 0,
          scale: isOverPhoto ? 1 : 1,
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />

      {/* Aperture icon - only over photos */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center mix-blend-difference"
        style={{
          width: APERTURE_SIZE,
          height: APERTURE_SIZE,
          x: apertureX,
          y: apertureY,
          translateX: -APERTURE_SIZE / 2,
          translateY: -APERTURE_SIZE / 2,
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
