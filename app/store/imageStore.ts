import { create } from "zustand";

interface ImageState {
  fileName: string | null;
  imageData: string | null;
  isDragging: boolean;
  error: string | null;
  palette: string[] | null;
  isGeneratingPalette: boolean;
  hoveredColor: string | null;
  selectedColors: string[];
  // Color replacement state
  sourceImageData: string | null;
  sourceFileName: string | null;
  sourcePalette: string[] | null;
  targetPalette: string[] | null;
  targetPaletteFileName: string | null;
  colorMapping: Record<string, string> | null;
  replacedImageData: string | null;
  isReplacingColors: boolean;
  setImage: (fileName: string, imageData: string) => void;
  resetImage: () => void;
  setIsDragging: (isDragging: boolean) => void;
  setError: (error: string | null) => void;
  setPalette: (palette: string[]) => void;
  setIsGeneratingPalette: (isGenerating: boolean) => void;
  setHoveredColor: (color: string | null) => void;
  setSelectedColors: (colors: string[]) => void;
  toggleColorSelection: (color: string) => void;
  selectColorRange: (fromColor: string, toColor: string) => void;
  removeSelectedColors: () => void;
  // Color replacement actions
  setSourceImage: (fileName: string, imageData: string) => void;
  setSourcePalette: (palette: string[]) => void;
  setTargetPalette: (palette: string[], fileName?: string) => void;
  setColorMapping: (mapping: Record<string, string>) => void;
  updateColorMapping: (sourceColor: string, targetColor: string) => void;
  setReplacedImageData: (imageData: string | null) => void;
  setIsReplacingColors: (isReplacing: boolean) => void;
  resetReplacement: () => void;
}

export const useImageStore = create<ImageState>((set) => ({
  fileName: null,
  imageData: null,
  isDragging: false,
  error: null,
  palette: null,
  isGeneratingPalette: false,
  hoveredColor: null,
  selectedColors: [],
  // Color replacement state
  sourceImageData: null,
  sourceFileName: null,
  sourcePalette: null,
  targetPalette: null,
  targetPaletteFileName: null,
  colorMapping: null,
  replacedImageData: null,
  isReplacingColors: false,
  setImage: (fileName, imageData) =>
    set({ fileName, imageData, error: null, palette: null }),
  resetImage: () =>
    set({
      fileName: null,
      imageData: null,
      palette: null,
      hoveredColor: null,
      selectedColors: [],
    }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setError: (error) => set({ error }),
  setPalette: (palette) => set({ palette, isGeneratingPalette: false }),
  setIsGeneratingPalette: (isGeneratingPalette) => set({ isGeneratingPalette }),
  setHoveredColor: (hoveredColor) => set({ hoveredColor }),
  setSelectedColors: (selectedColors) => set({ selectedColors }),
  toggleColorSelection: (color) =>
    set((state) => ({
      selectedColors: state.selectedColors.includes(color)
        ? state.selectedColors.filter((c) => c !== color)
        : [...state.selectedColors, color],
    })),
  selectColorRange: (fromColor, toColor) =>
    set((state) => {
      if (!state.palette) return state;
      const fromIndex = state.palette.indexOf(fromColor);
      const toIndex = state.palette.indexOf(toColor);
      if (fromIndex === -1 || toIndex === -1) return state;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangeColors = state.palette.slice(start, end + 1);

      // Combine existing selection with new range
      const newSelection = Array.from(
        new Set([...state.selectedColors, ...rangeColors])
      );
      return { selectedColors: newSelection };
    }),
  removeSelectedColors: () =>
    set((state) => {
      if (!state.palette || state.selectedColors.length === 0) return state;
      const newPalette = state.palette.filter(
        (color) => !state.selectedColors.includes(color)
      );
      // Also clear hoveredColor if it was one of the deleted colors
      const newHoveredColor =
        state.hoveredColor && state.selectedColors.includes(state.hoveredColor)
          ? null
          : state.hoveredColor;
      return {
        palette: newPalette,
        selectedColors: [],
        hoveredColor: newHoveredColor,
      };
    }),
  // Color replacement actions
  setSourceImage: (fileName, imageData) =>
    set({ sourceFileName: fileName, sourceImageData: imageData, error: null }),
  setSourcePalette: (palette) => set({ sourcePalette: palette }),
  setTargetPalette: (palette, fileName) =>
    set({ targetPalette: palette, targetPaletteFileName: fileName || null }),
  setColorMapping: (mapping) => set({ colorMapping: mapping }),
  updateColorMapping: (sourceColor, targetColor) =>
    set((state) => ({
      colorMapping: {
        ...(state.colorMapping || {}),
        [sourceColor]: targetColor,
      },
    })),
  setReplacedImageData: (imageData) => set({ replacedImageData: imageData }),
  setIsReplacingColors: (isReplacing) =>
    set({ isReplacingColors: isReplacing }),
  resetReplacement: () =>
    set({
      sourceImageData: null,
      sourceFileName: null,
      sourcePalette: null,
      targetPalette: null,
      targetPaletteFileName: null,
      colorMapping: null,
      replacedImageData: null,
      isReplacingColors: false,
    }),
}));
