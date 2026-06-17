import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface SeedMechanicResult {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  specialties: string[];
}

export interface SeedMechanicOpts {
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  hireDate?: Date;
  notes?: string;
  status?: string;
}

export async function seedMechanic(
  prisma: PrismaClient,
  opts: SeedMechanicOpts,
): Promise<SeedMechanicResult> {
  const mechanic = await prisma.mechanic.create({
    data: {
      tenantId: opts.tenantId,
      firstName: opts.firstName ?? 'Test',
      lastName: opts.lastName ?? `Mechanic-${randomUUID().slice(0, 6)}`,
      email: opts.email ?? null,
      phone: opts.phone ?? null,
      specialties: opts.specialties ?? [],
      hireDate: opts.hireDate ?? null,
      notes: opts.notes ?? null,
      status: opts.status ?? 'active',
    },
  });

  return {
    id: mechanic.id,
    tenantId: mechanic.tenantId,
    firstName: mechanic.firstName,
    lastName: mechanic.lastName,
    email: mechanic.email,
    phone: mechanic.phone,
    specialties: mechanic.specialties,
  };
}

export async function truncateMechanicsTable(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE mechanics RESTART IDENTITY CASCADE');
}
