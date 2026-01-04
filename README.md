# Pixel Palette Exporter

A web application for extracting, managing, and replacing color palettes in pixel art images.

## Features

### Palette Extraction
- **Image Upload**: Drag and drop support for image files (max 500KB)
- **Automatic Palette Extraction**: Detects all unique colors in your pixel art
- **Color Visualization**: Highlight pixels by color on hover or selection
- **Multi-Selection**: Select multiple colors using Ctrl+click or Shift+click
- **Palette Management**: Remove unwanted colors from your palette
- **Export Options**: Export palettes in multiple formats:
  - GPL (GIMP Palette)
  - KPL (Krita Palette)
  - JSON

### Color Replacement
- **Intelligent Color Mapping**: Replace image colors with closest colors from a target palette
- **Multiple Input Formats**: Load target palettes from:
  - GPL files (GIMP Palette)
  - KPL files (Krita Palette)
  - JSON files
  - Images (automatic palette extraction)
- **Real-Time Editing**: Fine-tune color mappings with visual feedback
- **Interactive Mapping Editor**: 
  - Visual color preview in dropdowns
  - Side-by-side comparison (mapping editor + result)
  - Instant preview when changing mappings
- **Zoomable Result Viewer**:
  - Zoom from 50% to 1000%
  - Pan with drag
  - Intelligent default zoom for pixel art
- **Export Result**: Download the recolored image as PNG

## Getting Started

### Prerequisites

- Node.js 18+ installed on your system
- pnpm, npm, or your preferred package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pixel-palette-exporter
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Run the development server:
```bash
pnpm dev
# or
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Extract Palette

1. Upload an image by dragging and dropping or clicking the upload area
2. Click "Generate Palette" to extract colors
3. Hover over colors to see which pixels use them
4. Select colors using:
   - Click: Select single color
   - Ctrl+Click: Toggle multiple selections
   - Shift+Click: Select range
5. Delete unwanted colors using the "Delete Selection" button
6. Export your palette in your preferred format

### Replace Colors

1. Upload a source image whose colors you want to replace
2. Upload a target palette (GPL/KPL/JSON file or image)
3. Click "Replace Colors" to generate the initial mapping
4. Fine-tune the color mappings:
   - Each source color shows its matched target color
   - Click any mapping to change it to a different palette color
   - Changes apply instantly with real-time preview
5. Use the zoomable viewer to inspect the result
6. Download the recolored image

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Zustand (State Management)
- Sharp (Server-side Image Processing)
- JSZip (KPL File Parsing)
- Headless UI (Accessible Components)
- Lucide React (Icons)
- simple-icons (Brand Icons)

## Algorithm Details

### Color Replacement
The color replacement algorithm uses Euclidean distance in RGB color space to find the closest matching color:

```
distance = √[(r₂-r₁)² + (g₂-g₁)² + (b₂-b₁)²]
```

- Initial mapping: Each source color is mapped to its closest target color
- Custom mapping: Users can override any mapping for fine-tuned control
- Real-time processing: Changes are applied server-side for optimal performance

## Credits

Created by Payangar

Website: https://pixel.payangar.io

Support: https://ko-fi.com/payangar

## License

This project is open source and available under the MIT License.

