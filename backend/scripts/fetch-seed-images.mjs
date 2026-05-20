/**
 * Скачивает демо-картинки товаров в prisma/seed-assets/products/
 * Запуск: node scripts/fetch-seed-images.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'prisma', 'seed-assets', 'products');

/** placehold.co — стабильные плейсхолдеры без блокировок */
const items = [
  { file: 'grechka.jpg', url: 'https://placehold.co/480x480/0d9488/fff/jpeg?text=Grechka' },
  { file: 'condensed-milk.jpg', url: 'https://placehold.co/480x480/2563eb/fff/jpeg?text=Milk' },
  { file: 'laundry-powder.jpg', url: 'https://placehold.co/480x480/7c3aed/fff/jpeg?text=Powder' },
  { file: 'paracetamol.jpg', url: 'https://placehold.co/480x480/dc2626/fff/jpeg?text=Meds' },
  { file: 'sealant.jpg', url: 'https://placehold.co/480x480/ca8a04/fff/jpeg?text=Sealant' },
];

await mkdir(outDir, { recursive: true });

for (const { file, url } of items) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(outDir, file), buf);
  console.log('OK', file);
}

console.log(`Saved to ${outDir}`);
