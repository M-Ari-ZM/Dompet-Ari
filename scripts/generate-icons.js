/**
 * PWA Icon Generator
 * Resizes logo-tr.png into all required PWA icon sizes
 * using the 'sharp' library.
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "logo.png");
const OUTPUT_DIR = path.join(ROOT, "public", "icons");
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Create output dir if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateIcons() {
  console.log("Generating PWA icons from", SOURCE);
  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        // background: { r: 238, g: 244, b: 253, alpha: 1 }, // matches --bg-root: #eef4fd
      })
      .png()
      .toFile(outputPath);
    console.log(`  ✓ icon-${size}.png`);
  }

  // Also generate maskable icons (512 with padding so logo isn't clipped)
  const maskablePath = path.join(OUTPUT_DIR, "icon-512-maskable.png");
  const paddedSize = Math.round(512 * 0.72); // logo fills 72% of canvas (safe zone)
  await sharp(SOURCE)
    .resize(paddedSize, paddedSize, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .extend({
      top: Math.floor((512 - paddedSize) / 2),
      bottom: Math.ceil((512 - paddedSize) / 2),
      left: Math.floor((512 - paddedSize) / 2),
      right: Math.ceil((512 - paddedSize) / 2),
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(maskablePath);
  console.log("  ✓ icon-512-maskable.png (maskable safe-zone padded)");

  console.log("\nAll icons generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
