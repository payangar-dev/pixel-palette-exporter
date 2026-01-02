"use client";

import { useCallback, useRef } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useImageStore } from "../store/imageStore";

export default function ImageUploader() {
  const { isDragging, error, setIsDragging, setError, setImage } =
    useImageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 500 * 1024; // 500 KB in bytes

  const validateAndProcessFile = useCallback(
    (file: File) => {
      setError(null);

      // Check file type
      if (!file.type.startsWith("image/")) {
        setError("File must be an image.");
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `Image is too large (${(file.size / 1024).toFixed(
            0
          )} KB). Maximum size is 500 KB.`
        );
        return;
      }

      // Read the file
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImage(file.name, result);
        }
      };
      reader.onerror = () => {
        setError("Error reading file.");
      };
      reader.readAsDataURL(file);
    },
    [setError, setImage, MAX_FILE_SIZE]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [setIsDragging]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        validateAndProcessFile(files[0]);
      }
    },
    [validateAndProcessFile, setIsDragging]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        validateAndProcessFile(files[0]);
      }
    },
    [validateAndProcessFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          w-full max-w-2xl h-96
          border-2 border-dashed rounded-xl
          cursor-pointer transition-all duration-200
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        <svg
          className={`w-16 h-16 mb-4 transition-colors ${
            isDragging ? "text-blue-500" : "text-gray-400 dark:text-gray-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {isDragging ? "Drop your image here" : "Drag and drop an image"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          or click to select a file
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
          Maximum size: 500 KB
        </p>
      </div>

      <Dialog
        open={!!error}
        onClose={() => setError(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Error
            </DialogTitle>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              OK
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
