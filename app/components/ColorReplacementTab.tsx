"use client";

import { useImageStore } from "../store/imageStore";
import { Upload, FileText, Download, Check, ChevronDown } from "lucide-react";
import { useRef, useState, useCallback, Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import ZoomableImage from "./ZoomableImage";

export default function ColorReplacementTab() {
  const {
    sourceImageData,
    sourceFileName,
    sourcePalette,
    targetPalette,
    targetPaletteFileName,
    colorMapping,
    replacedImageData,
    isReplacingColors,
    setSourceImage,
    setSourcePalette,
    setTargetPalette,
    setColorMapping,
    updateColorMapping,
    setError,
    setReplacedImageData,
    setIsReplacingColors,
  } = useImageStore();

  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const paletteFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingPalette, setIsLoadingPalette] = useState(false);
  const [isDraggingSource, setIsDraggingSource] = useState(false);
  const [isDraggingPalette, setIsDraggingPalette] = useState(false);

  const handleSourceImageUpload = useCallback(
    (file: File) => {
      // Validate file size (500KB)
      if (file.size > 500 * 1024) {
        setError("Image must be smaller than 500KB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSourceImage(file.name, result);
        setError(null);
      };
      reader.onerror = () => {
        console.error("Error reading file");
        setError("Error reading file");
      };
      reader.readAsDataURL(file);
    },
    [setError, setSourceImage]
  );

  const handleSourceImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleSourceImageUpload(file);
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = "";
  };

  const handleSourceDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingSource(true);
    },
    []
  );

  const handleSourceDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingSource(false);
    },
    []
  );

  const handleSourceDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingSource(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleSourceImageUpload(files[0]);
      }
    },
    [handleSourceImageUpload]
  );

  const handlePaletteFile = useCallback(
    async (file: File) => {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      // If it's an image, extract palette from it
      if (file.type.startsWith("image/")) {
        setIsLoadingPalette(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = e.target?.result as string;
          try {
            // Call API to extract palette from image
            const response = await fetch("/api/extract-palette", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageData: result }),
            });

            if (!response.ok) throw new Error("Failed to extract palette");

            const data = await response.json();
            const palette = data.palette || data.colors; // Support both formats
            setTargetPalette(palette, file.name);
            setError(null);
          } catch (error) {
            console.error("Error extracting palette:", error);
            setError("Failed to extract palette from image");
          } finally {
            setIsLoadingPalette(false);
          }
        };
        reader.readAsDataURL(file);
      } else if (
        fileExtension === "gpl" ||
        fileExtension === "kpl" ||
        fileExtension === "json"
      ) {
        // Parse palette file
        setIsLoadingPalette(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          try {
            const response = await fetch("/api/parse-palette", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content,
                type: fileExtension,
              }),
            });

            if (!response.ok) throw new Error("Failed to parse palette");

            const data = await response.json();
            setTargetPalette(data.palette, file.name);
            setError(null);
          } catch (error) {
            setError(`Failed to parse ${fileExtension.toUpperCase()} file`);
            console.error(error);
          } finally {
            setIsLoadingPalette(false);
          }
        };

        if (fileExtension === "kpl") {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      } else {
        setError(
          "Please upload a GPL, KPL, JSON file, or an image to extract palette"
        );
      }
    },
    [setError, setTargetPalette]
  );

  const handlePaletteFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePaletteFile(file);
    }
  };

  const handlePaletteDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingPalette(true);
    },
    []
  );

  const handlePaletteDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingPalette(false);
    },
    []
  );

  const handlePaletteDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingPalette(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handlePaletteFile(files[0]);
      }
    },
    [handlePaletteFile]
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Image Upload */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            1. Source Image
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload the image whose colors you want to replace
          </p>

          {!sourceImageData ? (
            <div
              onClick={() => sourceFileInputRef.current?.click()}
              onDragOver={handleSourceDragOver}
              onDragLeave={handleSourceDragLeave}
              onDrop={handleSourceDrop}
              className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                isDraggingSource
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600"
              }`}
            >
              <Upload
                className={`w-12 h-12 mb-3 transition-colors ${
                  isDraggingSource
                    ? "text-blue-500"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                {isDraggingSource
                  ? "Drop your image here"
                  : "Drag and drop an image"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                or click to select a file
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">
                Maximum size: 500 KB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center max-h-80 overflow-hidden">
                <canvas
                  ref={(canvas) => {
                    if (!canvas || !sourceImageData) return;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    const img = new Image();
                    img.onload = () => {
                      // Calculate scale factor with height limit
                      const maxDisplayWidth = 500;
                      const maxDisplayHeight = 300;
                      let displayScale = Math.min(
                        maxDisplayWidth / img.width,
                        maxDisplayHeight / img.height
                      );

                      // For very small images (pixel art), ensure minimum scale
                      if (img.width < 64 || img.height < 64) {
                        displayScale = Math.max(displayScale, 4);
                      }

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
                    img.src = sourceImageData;
                  }}
                  style={{ imageRendering: "pixelated" } as React.CSSProperties}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {sourceFileName}
                </p>
                <button
                  onClick={() => sourceFileInputRef.current?.click()}
                  className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          <input
            ref={sourceFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSourceImageChange}
            className="hidden"
          />
        </div>

        {/* Target Palette Upload */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            2. Target Palette
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload a palette file (GPL, KPL, JSON) or an image
          </p>

          {!targetPalette ? (
            <div
              onClick={() =>
                !isLoadingPalette && paletteFileInputRef.current?.click()
              }
              onDragOver={handlePaletteDragOver}
              onDragLeave={handlePaletteDragLeave}
              onDrop={handlePaletteDrop}
              className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all duration-200 ${
                isLoadingPalette
                  ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  : isDraggingPalette
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 cursor-pointer"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer"
              }`}
            >
              {isLoadingPalette ? (
                <>
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    Loading palette...
                  </p>
                </>
              ) : (
                <>
                  <FileText
                    className={`w-12 h-12 mb-3 transition-colors ${
                      isDraggingPalette
                        ? "text-blue-500"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  />
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                    {isDraggingPalette
                      ? "Drop your palette file here"
                      : "Drag and drop a palette"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    or click to select a file
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">
                    GPL, KPL, JSON, or Image
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Palette Grid */}
              <div className="grid grid-cols-8 gap-3">
                {targetPalette.map((color, index) => (
                  <div key={index} className="relative">
                    <div
                      className="w-full aspect-square rounded-lg border-2 border-transparent transition-all"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  </div>
                ))}
              </div>

              {/* Palette Info */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {targetPalette.length} colors
                  </p>
                  {targetPaletteFileName && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                      {targetPaletteFileName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => paletteFileInputRef.current?.click()}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          <input
            ref={paletteFileInputRef}
            type="file"
            accept=".gpl,.kpl,.json,image/*"
            onChange={handlePaletteFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Replace Button and Result */}
      {sourceImageData && targetPalette && (
        <div className="mt-6">
          <div className="text-center mb-6">
            <button
              disabled={isReplacingColors}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              onClick={async () => {
                setIsReplacingColors(true);
                try {
                  const response = await fetch("/api/replace-colors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      imageData: sourceImageData,
                      targetPalette,
                      colorMapping, // Send existing mapping if any
                    }),
                  });

                  if (!response.ok) throw new Error("Failed to replace colors");

                  const data = await response.json();
                  setReplacedImageData(data.imageData);

                  // Store source palette and color mapping if this is the first replacement
                  if (
                    !colorMapping &&
                    data.sourcePalette &&
                    data.colorMapping
                  ) {
                    setSourcePalette(data.sourcePalette);
                    setColorMapping(data.colorMapping);
                  }

                  setError(null);
                } catch (error) {
                  setError("Failed to replace colors");
                  console.error(error);
                } finally {
                  setIsReplacingColors(false);
                }
              }}
            >
              {isReplacingColors ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Replace Colors"
              )}
            </button>
          </div>

          {/* Color Mapping Editor and Result Image */}
          {replacedImageData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Color Mapping Editor */}
              {colorMapping && sourcePalette && (
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Color Mapping
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Fine-tune the color replacements. Changes update in
                    real-time.
                  </p>
                  <div className="space-y-3 max-h-150 overflow-y-auto pr-2">
                    {sourcePalette.map((sourceColor) => (
                      <div
                        key={sourceColor}
                        className="flex gap-2 p-3 items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 shrink-0"
                            style={{ backgroundColor: sourceColor }}
                            title={sourceColor}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                            {sourceColor}
                          </span>
                        </div>
                        <span className="text-gray-400 dark:text-gray-500 text-sm">
                          →
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Listbox
                              value={colorMapping[sourceColor]}
                              onChange={async (newTargetColor) => {
                                updateColorMapping(sourceColor, newTargetColor);

                                // Regenerate image with new mapping
                                setIsReplacingColors(true);
                                try {
                                  const updatedMapping = {
                                    ...colorMapping,
                                    [sourceColor]: newTargetColor,
                                  };

                                  const response = await fetch(
                                    "/api/replace-colors",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        imageData: sourceImageData,
                                        targetPalette,
                                        colorMapping: updatedMapping,
                                      }),
                                    }
                                  );

                                  if (!response.ok)
                                    throw new Error("Failed to replace colors");

                                  const data = await response.json();
                                  setReplacedImageData(data.imageData);
                                  setError(null);
                                } catch (error) {
                                  setError("Failed to update color mapping");
                                  console.error(error);
                                } finally {
                                  setIsReplacingColors(false);
                                }
                              }}
                            >
                              <div className="relative">
                                <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-700 py-2.5 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="w-6 h-6 shrink-0 rounded border border-gray-300 dark:border-gray-600"
                                      style={{
                                        backgroundColor:
                                          colorMapping[sourceColor],
                                      }}
                                    />
                                    <span className="text-sm font-mono text-gray-900 dark:text-white block overflow-hidden text-ellipsis">
                                      {colorMapping[sourceColor]}
                                    </span>
                                  </span>
                                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  </span>
                                </ListboxButton>
                                <Transition
                                  as={Fragment}
                                  leave="transition ease-in duration-100"
                                  leaveFrom="opacity-100"
                                  leaveTo="opacity-0"
                                >
                                  <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    {targetPalette.map((targetColor) => (
                                      <ListboxOption
                                        key={targetColor}
                                        value={targetColor}
                                        className={({ active }) =>
                                          `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                            active
                                              ? "bg-blue-100 dark:bg-blue-900"
                                              : ""
                                          }`
                                        }
                                      >
                                        {({ selected }) => (
                                          <>
                                            <span className="flex items-center gap-2">
                                              <span
                                                className="inline-block w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600"
                                                style={{
                                                  backgroundColor: targetColor,
                                                }}
                                              />
                                              <span className="text-xs font-mono text-gray-900 dark:text-white">
                                                {targetColor}
                                              </span>
                                            </span>
                                            {selected && (
                                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 dark:text-blue-400">
                                                <Check className="h-4 w-4" />
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </ListboxOption>
                                    ))}
                                  </ListboxOptions>
                                </Transition>
                              </div>
                            </Listbox>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result Image */}
              <div
                className={`${
                  colorMapping && sourcePalette
                    ? "lg:col-span-2"
                    : "lg:col-span-3"
                } bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Result
                  </h2>
                  <a
                    href={replacedImageData}
                    download="replaced-colors.png"
                    className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Download result"
                  >
                    <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </a>
                </div>
                <ZoomableImage src={replacedImageData} alt="Result" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
