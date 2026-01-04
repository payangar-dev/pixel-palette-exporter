import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// Calculate color distance using Euclidean distance in RGB space
function calculateColorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
  );
}

// Convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error("Invalid hex color");
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Find the closest color in the target palette
function findClosestColor(
  r: number,
  g: number,
  b: number,
  targetPalette: { r: number; g: number; b: number }[]
): { r: number; g: number; b: number } {
  let closestColor = targetPalette[0];
  let minDistance = calculateColorDistance(
    r,
    g,
    b,
    closestColor.r,
    closestColor.g,
    closestColor.b
  );

  for (let i = 1; i < targetPalette.length; i++) {
    const color = targetPalette[i];
    const distance = calculateColorDistance(r, g, b, color.r, color.g, color.b);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, targetPalette, colorMapping } = body;

    if (!imageData || !targetPalette || !Array.isArray(targetPalette)) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Convert target palette hex colors to RGB
    const targetPaletteRgb = targetPalette.map((hex: string) => hexToRgb(hex));

    // Load image with sharp
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Invalid image");
    }

    // Get raw pixel data
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels; // Should be 4 (RGBA)

    // Extract unique colors from source image
    const uniqueColorsSet = new Set<string>();
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 0) {
        uniqueColorsSet.add(rgbToHex(r, g, b));
      }
    }
    const sourcePalette = Array.from(uniqueColorsSet);

    // Create initial color mapping if not provided
    const initialMapping: Record<string, string> = {};
    if (!colorMapping) {
      sourcePalette.forEach((sourceHex) => {
        const sourceRgb = hexToRgb(sourceHex);
        const closest = findClosestColor(
          sourceRgb.r,
          sourceRgb.g,
          sourceRgb.b,
          targetPaletteRgb
        );
        initialMapping[sourceHex] = rgbToHex(closest.r, closest.g, closest.b);
      });
    }

    // Use provided mapping or initial mapping
    const activeMapping = colorMapping || initialMapping;

    // Process each pixel and replace with mapped color
    const newData = Buffer.alloc(data.length);

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // If pixel is transparent, keep it transparent
      if (a === 0) {
        newData[i] = 0;
        newData[i + 1] = 0;
        newData[i + 2] = 0;
        newData[i + 3] = 0;
        continue;
      }

      // Get source color as hex
      const sourceHex = rgbToHex(r, g, b);
      // Get mapped target color
      const targetHex = activeMapping[sourceHex];

      if (targetHex) {
        const targetRgb = hexToRgb(targetHex);
        newData[i] = targetRgb.r;
        newData[i + 1] = targetRgb.g;
        newData[i + 2] = targetRgb.b;
        newData[i + 3] = a; // Keep original alpha
      } else {
        // Fallback: keep original color if no mapping found
        newData[i] = r;
        newData[i + 1] = g;
        newData[i + 2] = b;
        newData[i + 3] = a;
      }
    }

    // Create new image from modified pixel data
    const resultImage = await sharp(newData, {
      raw: {
        width,
        height,
        channels,
      },
    })
      .png()
      .toBuffer();

    // Convert to base64
    const resultBase64 = `data:image/png;base64,${resultImage.toString(
      "base64"
    )}`;

    return NextResponse.json({
      imageData: resultBase64,
      sourcePalette,
      colorMapping: activeMapping,
    });
  } catch (error) {
    console.error("Error replacing colors:", error);
    return NextResponse.json(
      { error: "Failed to replace colors" },
      { status: 500 }
    );
  }
}
