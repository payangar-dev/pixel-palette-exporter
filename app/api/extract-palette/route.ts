import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();

    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    // Remove data URL prefix to get base64 string
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Extract colors from image buffer
    const colors = await extractColorsFromImage(buffer);

    return NextResponse.json({ colors });
  } catch (error) {
    console.error("Error extracting palette:", error);
    return NextResponse.json(
      { error: "Failed to extract palette" },
      { status: 500 }
    );
  }
}

async function extractColorsFromImage(buffer: Buffer): Promise<string[]> {
  // Get image metadata
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image dimensions");
  }

  // Extract raw pixel data
  const { data } = await image
    .ensureAlpha() // Ensure we have an alpha channel
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Extract unique colors
  const colorSet = new Set<string>();

  // data is a buffer with RGBA values (4 bytes per pixel)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip fully transparent pixels
    if (a === 0) continue;

    // Convert to hex color
    const hex = rgbToHex(r, g, b);
    colorSet.add(hex);
  }

  // Convert to array and sort by luminance (dark to light)
  const colors = Array.from(colorSet);
  colors.sort((a, b) => {
    const lumA = getLuminance(a);
    const lumB = getLuminance(b);
    return lumA - lumB;
  });

  return colors;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate relative luminance
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
