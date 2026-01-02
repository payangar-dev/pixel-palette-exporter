/**
 * Utility functions for exporting color palettes in various formats
 */

import JSZip from "jszip";

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/**
 * Export palette as GPL (GIMP Palette) format
 */
export function exportAsGPL(
  colors: string[],
  paletteName: string = "Palette"
): string {
  let gpl = "GIMP Palette\n";
  gpl += `Name: ${paletteName}\n`;
  gpl += "Columns: 8\n";
  gpl += "#\n";

  colors.forEach((hex) => {
    const { r, g, b } = hexToRgb(hex);
    // Format: R G B\tColorName
    gpl += `${r.toString().padStart(3)} ${g.toString().padStart(3)} ${b
      .toString()
      .padStart(3)}\t${hex}\n`;
  });

  return gpl;
}

/**
 * Export palette as KPL (Krita Palette) format
 * Returns a Blob containing the ZIP file
 *
 * KPL Format Specification (v2.0):
 * - ZIP archive with mimetype and colorset.xml
 * - mimetype MUST be stored UNCOMPRESSED (STORE method)
 * - mimetype content: "application/x-krita-palette"
 * - colorset.xml contains palette data with sRGB values in 0.0-1.0 range
 */
export async function exportAsKPL(
  colors: string[],
  paletteName: string = "Palette"
): Promise<Blob> {
  const zip = new JSZip();

  // CRITICAL: Add mimetype file FIRST and UNCOMPRESSED
  // This is how Krita identifies the file type
  zip.file("mimetype", "application/x-krita-palette", {
    compression: "STORE",
    // Ensure it's literally the first file
    date: new Date(0),
  });

  // Generate the colorset.xml content
  const colorsetXml = generateKPLColorsetXML(colors, paletteName);

  // Add colorset.xml to the ZIP with compression
  zip.file("colorset.xml", colorsetXml, {
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  // Generate the ZIP file as a Blob
  // streamFiles option ensures mimetype is written first
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    streamFiles: true,
  });

  return blob;
}

/**
 * Generate colorset.xml content for KPL format
 * Based on official Krita KPL specification v2.0
 */
function generateKPLColorsetXML(colors: string[], paletteName: string): string {
  const columns = 8;
  const rows = Math.ceil(colors.length / columns);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  // Note: Root element is "Colorset" (capital C, lowercase s) - this is critical!
  xml += `<Colorset version="2.0" name="${escapeXml(
    paletteName
  )}" comment="Exported from Pixel Palette Exporter" columns="${columns}" rows="${rows}">\n`;

  colors.forEach((hex, index) => {
    const { r, g, b } = hexToRgb(hex);
    const row = Math.floor(index / columns);
    const column = index % columns;

    // Convert RGB 0-255 to 0.0-1.0 range for sRGB
    const rNorm = (r / 255).toFixed(6);
    const gNorm = (g / 255).toFixed(6);
    const bNorm = (b / 255).toFixed(6);

    xml += `  <ColorSetEntry name="${hex}" id="color-${index}" spot="false" bitdepth="U8">\n`;
    xml += `    <sRGB r="${rNorm}" g="${gNorm}" b="${bNorm}"/>\n`;
    xml += `    <Position row="${row}" column="${column}"/>\n`;
    xml += `  </ColorSetEntry>\n`;
  });

  xml += "</Colorset>\n";

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Export palette as JSON format
 */
export function exportAsJSON(
  colors: string[],
  paletteName: string = "Palette"
): string {
  const palette = {
    name: paletteName,
    description: "Exported from Pixel Palette Exporter",
    colors: colors.map((hex) => {
      const { r, g, b } = hexToRgb(hex);
      return {
        name: hex,
        hex: hex,
        rgb: { r, g, b },
      };
    }),
  };

  return JSON.stringify(palette, null, 2);
}

/**
 * Download a file with the given content
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = "text/plain"
) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
