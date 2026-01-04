import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, type } = body;

    let palette: string[] = [];

    if (type === "json") {
      // Parse JSON palette
      const data = JSON.parse(content);
      if (Array.isArray(data.palette)) {
        palette = data.palette;
      } else if (Array.isArray(data.colors)) {
        palette = data.colors;
      } else if (Array.isArray(data)) {
        palette = data;
      }
    } else if (type === "gpl") {
      // Parse GPL (GIMP Palette) format
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip comments and headers
        if (
          trimmed.startsWith("#") ||
          trimmed.startsWith("GIMP") ||
          trimmed.startsWith("Name:") ||
          trimmed.startsWith("Columns:") ||
          trimmed === ""
        ) {
          continue;
        }

        // Parse RGB values (format: "R G B Name")
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
          const r = parseInt(parts[0]);
          const g = parseInt(parts[1]);
          const b = parseInt(parts[2]);

          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            const hex = `#${r.toString(16).padStart(2, "0")}${g
              .toString(16)
              .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
            palette.push(hex);
          }
        }
      }
    } else if (type === "kpl") {
      // Parse KPL (Krita Palette) format - it's a ZIP file
      try {
        // Convert base64 or ArrayBuffer to Buffer
        const buffer = Buffer.from(content, "base64");
        const zip = await JSZip.loadAsync(buffer);

        // Find colorset.xml file
        const colorsetFile = zip.file("colorset.xml");
        if (!colorsetFile) {
          throw new Error("No colorset.xml found in KPL file");
        }

        const xmlContent = await colorsetFile.async("text");

        // Parse XML to extract colors
        // Format: <ColorSetEntry ... sRGB="r,g,b"/>
        const colorMatches = xmlContent.matchAll(
          /sRGB="([0-9.]+),([0-9.]+),([0-9.]+)"/g
        );

        for (const match of colorMatches) {
          // sRGB values are in 0.0-1.0 range
          const r = Math.round(parseFloat(match[1]) * 255);
          const g = Math.round(parseFloat(match[2]) * 255);
          const b = Math.round(parseFloat(match[3]) * 255);

          const hex = `#${r.toString(16).padStart(2, "0")}${g
            .toString(16)
            .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
          palette.push(hex);
        }
      } catch (error) {
        console.error("Error parsing KPL file:", error);
        throw new Error("Invalid KPL file format");
      }
    }

    if (palette.length === 0) {
      return NextResponse.json(
        { error: "No colors found in palette file" },
        { status: 400 }
      );
    }

    return NextResponse.json({ palette });
  } catch (error) {
    console.error("Error parsing palette:", error);
    return NextResponse.json(
      { error: "Failed to parse palette file" },
      { status: 500 }
    );
  }
}
