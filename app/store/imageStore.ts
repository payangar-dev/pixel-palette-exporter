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
}));
