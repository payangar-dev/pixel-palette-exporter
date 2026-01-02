"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useImageStore } from "../store/imageStore";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  exportAsGPL,
  exportAsJSON,
  exportAsKPL,
  downloadFile,
} from "../utils/paletteExport";
import { Trash2, ChevronDown, X } from "lucide-react";

export default function PaletteDisplay() {
  const {
    palette,
    hoveredColor,
    selectedColors,
    setHoveredColor,
    setSelectedColors,
    toggleColorSelection,
    selectColorRange,
    removeSelectedColors,
    imageData,
    fileName,
  } = useImageStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null);
  const [lastClickedColor, setLastClickedColor] = useState<string | null>(null);

  const handleColorClick = useCallback(
    (color: string, event: React.MouseEvent) => {
      if (event.shiftKey && lastClickedColor && palette) {
        // Shift+click: select range from last clicked to current
        selectColorRange(lastClickedColor, color);
      } else if (event.ctrlKey || event.metaKey) {
        // Ctrl+click: toggle individual selection
        const isCurrentlySelected = selectedColors.includes(color);
        toggleColorSelection(color);
        setLastClickedColor(color);
        // If deselecting, clear hover to update visualization immediately
        if (isCurrentlySelected) {
          setHoveredColor(null);
        }
      } else {
        // Normal click: select only this color
        setSelectedColors([color]);
        setLastClickedColor(color);
      }
    },
    [
      lastClickedColor,
      palette,
      selectColorRange,
      toggleColorSelection,
      setSelectedColors,
      selectedColors,
      setHoveredColor,
    ]
  );

  const handleDeselectAll = useCallback(() => {
    setSelectedColors([]);
    setLastClickedColor(null);
    setHoveredColor(null);
  }, [setSelectedColors, setHoveredColor]);

  // Get active colors for visualization (selected + hovered if selection exists)
  const activeColors = useMemo(() => {
    if (!palette) return [];

    // Filter to only include colors that still exist in the palette
    const validSelectedColors = selectedColors.filter((color) =>
      palette.includes(color)
    );

    if (validSelectedColors.length > 0) {
      // If there's a selection, show selected colors + hovered color if any
      const validHovered = hoveredColor && palette.includes(hoveredColor);
      return validHovered && !validSelectedColors.includes(hoveredColor)
        ? [...validSelectedColors, hoveredColor]
        : validSelectedColors;
    }
    // No selection: show only hovered color if it exists in palette
    return hoveredColor && palette.includes(hoveredColor) ? [hoveredColor] : [];
  }, [selectedColors, hoveredColor, palette]);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(
    async (format: "gpl" | "kpl" | "json") => {
      if (!palette) return;

      setExporting(true);

      try {
        const paletteName = fileName
          ? fileName.replace(/\.[^/.]+$/, "")
          : "palette"; // Remove file extension

        switch (format) {
          case "gpl": {
            const gplContent = exportAsGPL(palette, paletteName);
            downloadFile(gplContent, `${paletteName}.gpl`, "text/plain");
            break;
          }
          case "kpl": {
            const kplBlob = await exportAsKPL(palette, paletteName);
            downloadFile(kplBlob, `${paletteName}.kpl`, "application/zip");
            break;
          }
          case "json": {
            const jsonContent = exportAsJSON(palette, paletteName);
            downloadFile(
              jsonContent,
              `${paletteName}.json`,
              "application/json"
            );
            break;
          }
        }
      } catch (error) {
        console.error("Export failed:", error);
      } finally {
        setExporting(false);
      }
    },
    [palette, fileName]
  );

  // Draw the original image on the canvas when palette is available
  useEffect(() => {
    if (!imageData || !palette) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Calculate scale factor
      const maxDisplayWidth = 400;
      const maxDisplayHeight = 400;
      let displayScale = Math.min(
        maxDisplayWidth / img.width,
        maxDisplayHeight / img.height
      );

      // For pixel art, ensure minimum scale
      if (img.width < 64 || img.height < 64) {
        displayScale = Math.max(displayScale, 4);
      }

      canvas.width = img.width * displayScale;
      canvas.height = img.height * displayScale;

      // Create a temporary canvas to process the image
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      // Draw original image
      tempCtx.drawImage(img, 0, 0);
      const imageDataObj = tempCtx.getImageData(0, 0, img.width, img.height);
      const pixels = imageDataObj.data;

      // Create palette color set for fast lookup
      const paletteSet = new Set(
        palette.map((color) => {
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return `${r},${g},${b}`;
        })
      );

      // Filter pixels: make transparent pixels that don't match palette colors
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip already transparent pixels
        if (a === 0) continue;

        const colorKey = `${r},${g},${b}`;
        if (!paletteSet.has(colorKey)) {
          // Make this pixel transparent if its color is not in the palette
          pixels[i + 3] = 0;
        }
      }

      // Put the filtered image back
      tempCtx.putImageData(imageDataObj, 0, 0);

      // Draw scaled filtered image to main canvas
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        tempCanvas,
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
  }, [imageData, palette]);

  // Highlight pixels with the selected/hovered colors
  useEffect(() => {
    if (!imageData || activeColors.length === 0) {
      // Clear highlight canvas
      const highlightCanvas = highlightCanvasRef.current;
      if (highlightCanvas) {
        const ctx = highlightCanvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    const highlightCanvas = highlightCanvasRef.current;
    if (!canvas || !highlightCanvas) return;

    const img = new Image();
    img.onload = () => {
      // Match canvas dimensions
      highlightCanvas.width = canvas.width;
      highlightCanvas.height = canvas.height;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(img, 0, 0);
      const imageDataObj = tempCtx.getImageData(0, 0, img.width, img.height);
      const pixels = imageDataObj.data;

      // Convert active colors to RGB
      const targetColors = activeColors.map((color) => ({
        r: parseInt(color.slice(1, 3), 16),
        g: parseInt(color.slice(3, 5), 16),
        b: parseInt(color.slice(5, 7), 16),
      }));

      // Create highlight overlay
      const highlightCtx = highlightCanvas.getContext("2d");
      if (!highlightCtx) return;

      highlightCtx.clearRect(
        0,
        0,
        highlightCanvas.width,
        highlightCanvas.height
      );
      highlightCtx.imageSmoothingEnabled = false;

      const scale = canvas.width / img.width;

      // Draw semi-transparent overlay for all pixels
      highlightCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
      highlightCtx.fillRect(
        0,
        0,
        highlightCanvas.width,
        highlightCanvas.height
      );

      // Clear pixels that match any of the active colors
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a === 0) continue;

          // Check if this pixel matches any of the active colors
          const matches = targetColors.some(
            (target) => r === target.r && g === target.g && b === target.b
          );

          if (matches) {
            // Clear the dark overlay for this pixel (make it visible)
            highlightCtx.clearRect(
              Math.floor(x * scale),
              Math.floor(y * scale),
              Math.ceil(scale),
              Math.ceil(scale)
            );
          }
        }
      }
    };
    img.src = imageData;
  }, [imageData, activeColors]);

  if (!palette || palette.length === 0) return null;

  const hasSelection = selectedColors.length > 0;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mt-8">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Color Palette ({palette.length} colors)
          </h2>

          {/* Export Menu */}
          <Menu as="div" className="relative">
            <MenuButton
              disabled={exporting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              {exporting ? "Exporting..." : "Export Palette"}
              <ChevronDown className="w-4 h-4" />
            </MenuButton>

            <MenuItems className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={() => handleExport("gpl")}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      focus ? "bg-gray-100 dark:bg-gray-700" : ""
                    } text-gray-900 dark:text-gray-100`}
                  >
                    Export as GPL (GIMP)
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={() => handleExport("kpl")}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      focus ? "bg-gray-100 dark:bg-gray-700" : ""
                    } text-gray-900 dark:text-gray-100`}
                  >
                    Export as KPL (Krita)
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={() => handleExport("json")}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      focus ? "bg-gray-100 dark:bg-gray-700" : ""
                    } text-gray-900 dark:text-gray-100`}
                  >
                    Export as JSON
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>

        {/* Selection Actions Bar */}
        {hasSelection && (
          <div className="flex items-center gap-2 w-full">
            <div className="bg-transparent text-blue-600 dark:text-blue-400 font-semibold">
              {selectedColors.length} selected
            </div>
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Deselect All
            </button>
            <button
              onClick={removeSelectedColors}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selection
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-8 w-full">
        {/* Image preview with hover highlight */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="relative inline-block">
            {/* Base image canvas */}
            <canvas
              ref={canvasRef}
              className="relative rounded-lg"
              style={
                {
                  imageRendering: "pixelated",
                } as React.CSSProperties
              }
            />

            {/* Highlight overlay canvas */}
            <canvas
              ref={highlightCanvasRef}
              className="absolute top-0 left-0 rounded-lg pointer-events-none"
              style={
                {
                  imageRendering: "pixelated",
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        {/* Palette grid */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-8 gap-3">
            {palette.map((color) => {
              const isSelected = selectedColors.includes(color);
              const isHovered = hoveredColor === color;

              return (
                <div key={color} className="relative group z-0 hover:z-50">
                  <button
                    onMouseEnter={() => setHoveredColor(color)}
                    onMouseLeave={() => setHoveredColor(null)}
                    onClick={(e) => handleColorClick(color, e)}
                    className={`w-full aspect-square rounded-lg transition-all hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 ${
                      isSelected
                        ? "border-blue-500 scale-110 ring-2 ring-blue-400"
                        : isHovered
                        ? "border-gray-400 dark:border-gray-500"
                        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <span className="text-xs font-mono bg-gray-900 dark:bg-gray-800 text-white px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      {color}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
