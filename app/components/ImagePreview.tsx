"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useImageStore } from "../store/imageStore";

export default function ImagePreview() {
  const {
    imageData,
    fileName,
    resetImage,
    setPalette,
    isGeneratingPalette,
    setIsGeneratingPalette,
    setError,
  } = useImageStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [scale, setScale] = useState(4);

  const generatePalette = useCallback(async () => {
    if (!imageData) return;

    setIsGeneratingPalette(true);
    setError(null);

    try {
      const response = await fetch("/api/extract-palette", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract palette");
      }

      const data = await response.json();
      setPalette(data.colors);
    } catch (error) {
      console.error("Error generating palette:", error);
      setError("Failed to generate palette");
      setIsGeneratingPalette(false);
    }
  }, [imageData, setPalette, setIsGeneratingPalette, setError]);

  useEffect(() => {
    if (!imageData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });

      // Calculate scale factor to fit the preview area
      const maxDisplayWidth = 600;
      const maxDisplayHeight = 600;
      let displayScale = Math.min(
        maxDisplayWidth / img.width,
        maxDisplayHeight / img.height
      );

      // For very small images (pixel art), ensure minimum scale
      if (img.width < 64 || img.height < 64) {
        displayScale = Math.max(displayScale, 4);
      }

      setScale(Math.floor(displayScale));

      // Set canvas size to scaled dimensions
      canvas.width = img.width * displayScale;
      canvas.height = img.height * displayScale;

      // Disable image smoothing for pixel-perfect rendering
      ctx.imageSmoothingEnabled = false;

      // Draw the image scaled up
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };
    img.src = imageData;
  }, [imageData]);

  if (!imageData || !fileName) return null;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
      {/* Preview Area */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-800">
        <div className="relative inline-block">
          {/* Checkerboard background for transparency */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
              `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          />

          <canvas
            ref={canvasRef}
            className="relative rounded-lg"
            style={
              {
                imageRendering: "pixelated",
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      {/* Image Info */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {fileName}
        </p>
        {dimensions && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {dimensions.width} × {dimensions.height} pixels • Scale: {scale}×
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={resetImage}
          className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors font-medium"
        >
          Change Image
        </button>
        <button
          onClick={generatePalette}
          disabled={isGeneratingPalette}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isGeneratingPalette ? "Generating..." : "Generate Palette"}
        </button>
      </div>
    </div>
  );
}
