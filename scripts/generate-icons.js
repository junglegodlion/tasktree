const fs = require('fs');
const path = require('path');

async function main() {
  const sharp = require('sharp');
  const pngToIco = require('png-to-ico');

  const root = path.join(__dirname, '..');
  const svgPath = path.join(root, 'src', 'icon.svg');
  const outDir = path.join(root, 'build');
  const pngPath = path.join(outDir, 'icon.png');
  const icoPath = path.join(outDir, 'icon.ico');

  if (!fs.existsSync(svgPath)) {
    throw new Error(`Missing icon source: ${svgPath}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  // Render SVG -> PNG (256x256, transparent background allowed)
  const svgBuf = fs.readFileSync(svgPath);
  await sharp(svgBuf, { density: 256 })
    .resize(256, 256)
    .png({ compressionLevel: 9 })
    .toFile(pngPath);

  // Build a multi-size ICO from PNG-derived buffers.
  // Electron/Windows taskbar prefers an .ico containing multiple sizes.
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map((s) =>
      sharp(svgBuf, { density: 256 })
        .resize(s, s)
        .png({ compressionLevel: 9 })
        .toBuffer()
    )
  );

  const icoBuf = await pngToIco(pngBuffers);
  fs.writeFileSync(icoPath, icoBuf);

  console.log(`Generated:\n- ${path.relative(root, pngPath)}\n- ${path.relative(root, icoPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

