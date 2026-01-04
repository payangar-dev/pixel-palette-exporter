"use client";

import { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import ImagePreview from "./components/ImagePreview";
import PaletteDisplay from "./components/PaletteDisplay";
import ColorReplacementTab from "./components/ColorReplacementTab";
import { useImageStore } from "./store/imageStore";
import { Heart } from "lucide-react";
import { siGithub } from "simple-icons";

export default function Home() {
  const { imageData } = useImageStore();
  const [activeTab, setActiveTab] = useState<"extract" | "replace">("extract");

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Pixel Palette Exporter
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Extract color palettes from your pixel art
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab("extract")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === "extract"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Extract Palette
            </button>
            <button
              onClick={() => setActiveTab("replace")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === "replace"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Replace Colors
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center gap-8">
          {activeTab === "extract" ? (
            !imageData ? (
              <ImageUploader />
            ) : (
              <>
                <ImagePreview />
                <PaletteDisplay />
              </>
            )
          ) : (
            <ColorReplacementTab />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Support Button */}
            <a
              href="https://ko-fi.com/payangar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full font-medium transition-all transform hover:scale-105 shadow-lg"
            >
              <Heart className="w-5 h-5 fill-white" />
              Support me on Ko-fi
            </a>

            {/* Credits and Links */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="flex items-center gap-1">
                Created with{" "}
                <Heart className="inline w-3.5 h-3.5 text-red-500 fill-red-500" />{" "}
                by{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  Payangar
                </span>
              </p>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-700">
                •
              </span>
              <a
                href="https://github.com/payangar-dev/pixel-palette-exporter"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 dark:text-white transition-colors"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={siGithub.path} />
                </svg>
                <span>View source</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
