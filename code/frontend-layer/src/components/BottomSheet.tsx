"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  accentColor?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, accentColor, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(100); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartTranslate = useRef(0);

  useEffect(() => {
    if (open) {
      // Slide in to 40% from top (60% height)
      requestAnimationFrame(() => setTranslateY(40));
    } else {
      setTranslateY(100);
    }
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartTranslate.current = translateY;
  }, [translateY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newTranslate = Math.max(0, dragStartTranslate.current + deltaPercent);
    setTranslateY(newTranslate);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (translateY > 60) {
      // Dismiss
      onClose();
    } else if (translateY < 15) {
      // Snap to full screen
      setTranslateY(0);
    } else {
      // Snap to 60% height
      setTranslateY(40);
    }
  }, [translateY, onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open && translateY >= 100) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: open ? 1 : 0,
        }}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 rounded-t-2xl overflow-hidden"
        style={{
          height: "100%",
          transform: `translateY(${translateY}%)`,
          transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          background: "var(--color-surface)",
          borderTop: `2px solid ${accentColor || "var(--color-accent)"}`,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--color-text-secondary)", opacity: 0.4 }}
          />
        </div>

        {/* Accent header bar */}
        {title && (
          <div
            className="px-4 py-2 mb-2"
            style={{
              background: `${accentColor || "var(--color-accent)"}15`,
              borderBottom: `1px solid ${accentColor || "var(--color-accent)"}30`,
            }}
          >
            <h2 className="text-sm font-semibold" style={{ color: accentColor || "var(--color-accent)" }}>
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: "calc(100% - 60px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
