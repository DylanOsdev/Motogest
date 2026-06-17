import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface SeedClientResult {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export interface SeedClientOpts {
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: string;
}

export async function seedClient(
  prisma: PrismaClient,
  opts: SeedClientOpts,
): Promise<SeedClientResult> {
  const client = await prisma.client.create({
    data: {
      tenantId: opts.tenantId,
      firstName: opts.firstName ?? 'Test',
      lastName: opts.lastName ?? `Client-${randomUUID().slice(0, 6)}`,
      email: opts.email ?? null,
      phone: opts.phone ?? null,
      address: opts.address ?? null,
      notes: opts.notes ?? null,
      status: opts.status ?? 'active',
    },
  });

  return {
    id: client.id,
    tenantId: client.tenantId,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
  };
}

export async function truncateClientsTable(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE clients RESTART IDENTITY CASCADE');
}
