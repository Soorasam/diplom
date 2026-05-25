import { PrismaClient } from '@prisma/client';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { uploadFromAsset, publicObjectUrl } from './minio-seed';
import {
  SEED_CATEGORIES,
  SEED_PRODUCT_DEFS,
  SLUG_LEGACY_NAMES,
  seedProductAssetFile,
  seedProductObjectKey,
} from './seed-products';
const ASSETS_DIR = path.join(process.cwd(), 'prisma', 'seed-assets', 'products');

function resolveAssetFile(slug: string): string | null {
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
    const file = `${slug}${ext}`;
    if (existsSync(path.join(ASSETS_DIR, file))) return file;
  }
  return null;
}

export async function ensureSeedCategories(prisma: PrismaClient) {
  const categories = [];
  for (const cat of SEED_CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { title: cat.title },
      create: cat,
      update: { hint: cat.hint, sortOrder: cat.sortOrder },
    });
    categories.push(row);
  }
  return categories;
}

export async function ensureSeedProducts(prisma: PrismaClient) {
  const categories = await ensureSeedCategories(prisma);

  for (const def of SEED_PRODUCT_DEFS) {
    const legacyName = SLUG_LEGACY_NAMES[def.slug];
    if (legacyName && legacyName !== def.name) {
      await prisma.product.deleteMany({ where: { name: legacyName } });
    }

    const data = {
      categoryId: categories[def.categoryIndex].id,
      name: def.name,
      description: def.description,
      unit: def.unit,
      priceEstimate: def.priceEstimate,
      weightKg: def.weightKg,
      requiresPrescription: def.requiresPrescription ?? false,
      isActive: true,
    };
    const existing = await prisma.product.findFirst({ where: { name: def.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }

  return categories;
}

export async function uploadSeedProductImages(prisma: PrismaClient) {
  let minioOk = true;
  let uploaded = 0;
  let missing = 0;

  for (const def of SEED_PRODUCT_DEFS) {
    const assetFile = resolveAssetFile(def.slug) ?? seedProductAssetFile(def.slug);
    const filePath = path.join(ASSETS_DIR, assetFile);

    if (!existsSync(filePath)) {
      missing += 1;
      continue;
    }

    try {
      const objectKey = seedProductObjectKey(def.slug);
      const imageUrl = await uploadFromAsset(assetFile, objectKey);
      await prisma.product.updateMany({
        where: { name: def.name },
        data: { imageUrl },
      });
      console.log(`  фото: ${def.name} ← ${assetFile}`);
      uploaded += 1;
    } catch {
      if (minioOk) {
        console.warn('MinIO недоступен — картинки не загружены. docker compose up -d');
        minioOk = false;
      }
      break;
    }
  }

  if (missing > 0 && minioOk) {
    console.log(`  без файла в seed-assets: ${missing} товар(ов) — см. README.md в папке products`);
  }

  return { uploaded, missing, minioOk };
}


export function placeholderImageUrl(slug: string): string {
  return publicObjectUrl(seedProductObjectKey(slug));
}
