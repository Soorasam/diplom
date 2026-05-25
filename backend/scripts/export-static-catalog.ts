import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

import {
  SEED_CATEGORIES,
  SEED_PRODUCT_DEFS,
} from '../prisma/lib/seed-products';

const REPO_ROOT = path.join(__dirname, '..', '..');
const ASSETS_DIR = path.join(__dirname, '..', 'prisma', 'seed-assets', 'products');
const OUT_DIR = path.join(REPO_ROOT, 'frontend', 'public', 'catalog');
const IMG_DIR = path.join(OUT_DIR, 'images');

function stableId(prefix: string, key: string): string {
  const hex = createHash('sha256').update(`${prefix}:${key}`).digest('hex');
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

function resolveImageExt(slug: string): string | null {
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
    if (existsSync(path.join(ASSETS_DIR, `${slug}${ext}`))) return ext;
  }
  return null;
}

const categories = SEED_CATEGORIES.map((cat) => ({
  id: stableId('cat', cat.title),
  title: cat.title,
  hint: cat.hint,
  sortOrder: cat.sortOrder,
}));

const products = SEED_PRODUCT_DEFS.map((def) => {
  const ext = resolveImageExt(def.slug);
  const imageUrl = ext
    ? `/diplom/catalog/images/${def.slug}${ext}`
    : null;
  return {
    id: stableId('prod', def.slug),
    categoryId: categories[def.categoryIndex].id,
    name: def.name,
    description: def.description,
    unit: def.unit,
    priceEstimate: def.priceEstimate,
    weightKg: def.weightKg,
    requiresPrescription: def.requiresPrescription ?? false,
    imageUrl,
    slug: def.slug,
  };
});

mkdirSync(IMG_DIR, { recursive: true });

let copied = 0;
for (const def of SEED_PRODUCT_DEFS) {
  const ext = resolveImageExt(def.slug);
  if (!ext) continue;
  const src = path.join(ASSETS_DIR, `${def.slug}${ext}`);
  cpSync(src, path.join(IMG_DIR, `${def.slug}${ext}`));
  copied += 1;
}

writeFileSync(
  path.join(OUT_DIR, 'data.json'),
  JSON.stringify({ categories, products }, null, 2),
  'utf8',
);

console.log(
  `Статический каталог: ${products.length} товаров, ${copied} изображений → frontend/public/catalog`,
);
