import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const INPUT = 'public/logo.png';
const OUT_DIR = 'public/icons';

await mkdir(OUT_DIR, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const s of sizes) {
  await sharp(INPUT)
    .resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(`${OUT_DIR}/icon-${s}x${s}.png`);
  console.log(`Generated icon-${s}x${s}.png`);
}

for (const s of [192, 512]) {
  await sharp(INPUT)
    .resize(s, s, { fit: 'contain', background: { r: 5, g: 150, b: 105, alpha: 1 } })
    .png()
    .toFile(`${OUT_DIR}/icon-maskable-${s}x${s}.png`);
  console.log(`Generated icon-maskable-${s}x${s}.png`);
}

console.log('All icons generated successfully!');
