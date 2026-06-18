import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface SeedWorkOrderResult {
  id: string;
  tenantId: string;
  vehicleId: string;
  clientId: string;
  milestone: string;
}

export interface SeedWorkOrderOpts {
  tenantId: string;
  vehicleId: string;
  clientId: string;
  description?: string;
  priority?: string;
  milestone?: string;
}

export async function seedWorkOrder(
  prisma: PrismaClient,
  opts: SeedWorkOrderOpts,
): Promise<SeedWorkOrderResult> {
  const workOrder = await prisma.workOrder.create({
    data: {
      tenantId: opts.tenantId,
      vehicleId: opts.vehicleId,
      clientId: opts.clientId,
      description: opts.description ?? `Work order ${randomUUID().slice(0, 6)}`,
      priority: opts.priority ?? 'normal',
      milestone: opts.milestone ?? 'created',
    },
  });

  return {
    id: workOrder.id,
    tenantId: workOrder.tenantId,
    vehicleId: workOrder.vehicleId,
    clientId: workOrder.clientId,
    milestone: workOrder.milestone,
  };
}

export async function truncateWorkOrdersTable(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE work_order_mechanics, work_orders RESTART IDENTITY CASCADE',
  );
}
