// Builds optimized images from _src/ (the owner's uploaded renders) into public/img.
// Run once: npm run assets. NOTE: the _src renders are AI-generated concept art, not photos.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/img', { recursive: true });
const photos = {
  'render-drinks': [29, 1280], 'render-sunrise': [35, 720], 'render-baguio': [33, 720], 'render-dawn': [31, 720],
  'pour-sunrise': [25, 720], 'pour-baguio': [23, 720], 'pour-dawn': [21, 720], 'pour-amber': [27, 720],
  'render-mix': [20, 720], 'render-how': [7, 720],
};
for (const [name, [n, w]] of Object.entries(photos)) {
  await sharp(`_src/${n}.webp`).resize({ width: w }).webp({ quality: 76 }).toFile(`public/img/${name}.webp`);
}
await sharp('_src/17.webp').resize({ width: 640 }).webp({ quality: 90 }).toFile('public/img/logo.webp');

// Transparent sticker version of the logo: flood-fill the white background from the edges, then add a white sticker rim.
{
  const { data, info } = await sharp('_src/17.webp').resize({ width: 900 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const white = (i) => data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238;
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop();
    if (seen[p] || !white(p * 4)) continue;
    seen[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W); if (y < H - 1) stack.push(p + W);
  }
  for (let p = 0; p < W * H; p++) if (seen[p]) data[p * 4 + 3] = 0;
  const art = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  // rim: blurred, thresholded alpha painted white behind the art
  const mask = await sharp(art).extractChannel(3).blur(9).threshold(20).raw().toBuffer();
  const rimRaw = Buffer.alloc(W * H * 4, 255);
  for (let p = 0; p < W * H; p++) rimRaw[p * 4 + 3] = mask[p];
  const rim = await sharp(rimRaw, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const merged = await sharp(rim).composite([{ input: art }]).png().toBuffer();
  await sharp(merged).trim().png({ compressionLevel: 9 }).toFile('public/img/logo-sticker.png');
}

await sharp('_src/29.webp').resize(1200, 630, { fit: 'cover', position: 'centre' }).png({ palette: true, quality: 82 }).toFile('public/og-image.png');
console.log('assets done');
