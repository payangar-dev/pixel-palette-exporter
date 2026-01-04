"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
}

export default function ZoomableImage({ src, alt }: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1); // This is now relative to baseScale
  const [baseScale, setBaseScale] = useState(1); // The calculated initial scale
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate base scale based on image size
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const containerWidth = 1100;
      const containerHeight = 500;

      let calculatedScale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height
      );

      // For very small images (pixel art), ensure minimum scale
      if (img.width < 64 || img.height < 64) {
        calculatedScale = Math.max(calculatedScale, 4);
      }

      // Cap maximum initial scale
      calculatedScale = Math.min(calculatedScale, 8);

      setBaseScale(calculatedScale);
      setZoom(1); // Start at 100% of the base scale
    };
    img.src = src;
  }, [src]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.min(Math.max(0.5, prev + delta), 10));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        // Left click only
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
            title="Reset view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Scroll to zoom • Drag to pan
        </p>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative"
        style={{
          height: "500px",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${
              zoom * baseScale
            })`,
            transformOrigin: "center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-none"
            style={{
              imageRendering: "pixelated",
              pointerEvents: "none",
              userSelect: "none",
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
