# Pixel Palette Exporter

A web application for extracting and managing color palettes from pixel art images.

## Features

- **Image Upload**: Drag and drop support for image files (max 500KB)
- **Automatic Palette Extraction**: Detects all unique colors in your pixel art
- **Color Visualization**: Highlight pixels by color on hover or selection
- **Multi-Selection**: Select multiple colors using Ctrl+click or Shift+click
- **Palette Management**: Remove unwanted colors from your palette
- **Export Options**: Export palettes in multiple formats:
  - GPL (GIMP Palette)
  - KPL (Krita Palette)
  - JSON

## Getting Started

### Prerequisites

- Node.js 18+ installed on your system
- npm or your preferred package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pixel-palette-exporter
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Upload an image by dragging and dropping or clicking the upload area
2. Click "Generate Palette" to extract colors
3. Hover over colors to see which pixels use them
4. Select colors using:
   - Click: Select single color
   - Ctrl+Click: Toggle multiple selections
   - Shift+Click: Select range
5. Delete unwanted colors using the "Delete Selection" button
6. Export your palette in your preferred format

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Zustand (State Management)
- Sharp (Image Processing)
- Headless UI
- Lucide React (Icons)

## Credits

Created by Payangar

Support: https://ko-fi.com/payangar

## License

This project is open source and available under the MIT License.

