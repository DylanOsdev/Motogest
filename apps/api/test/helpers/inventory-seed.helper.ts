import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface SeedSparePartResult {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
}

export interface SeedSparePartOpts {
  tenantId: string;
  code?: string;
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  costPrice?: number;
  salePrice?: number;
  supplier?: string;
  notes?: string;
  status?: string;
}

export async function seedSparePart(
  prisma: PrismaClient,
  opts: SeedSparePartOpts,
): Promise<SeedSparePartResult> {
  const part = await prisma.sparePart.create({
    data: {
      tenantId: opts.tenantId,
      code: opts.code ?? `PART-${randomUUID().slice(0, 8).toUpperCase()}`,
      name: opts.name ?? `Test Part ${randomUUID().slice(0, 6)}`,
      description: opts.description ?? null,
      category: opts.category ?? null,
      unit: opts.unit ?? 'unit',
      currentStock: opts.currentStock ?? 0,
      minStock: opts.minStock ?? 0,
      maxStock: opts.maxStock ?? 0,
      costPrice: opts.costPrice != null ? opts.costPrice : null,
      salePrice: opts.salePrice != null ? opts.salePrice : null,
      supplier: opts.supplier ?? null,
      notes: opts.notes ?? null,
      status: opts.status ?? 'active',
    },
  });

  return {
    id: part.id,
    tenantId: part.tenantId,
    code: part.code,
    name: part.name,
    currentStock: part.currentStock,
    minStock: part.minStock,
    maxStock: part.maxStock,
  };
}

export async function truncateSparePartsTable(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE spare_parts RESTART IDENTITY CASCADE',
  );
}
