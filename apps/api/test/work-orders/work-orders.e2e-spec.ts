import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { createSeedPrismaClient } from '../helpers/tenant-seed.helper';
import {
  seedActiveUserWithTenant,
  truncateAuthTables,
} from '../helpers/auth-seed.helper';
import {
  seedClient,
  truncateClientsTable,
} from '../helpers/client-seed.helper';
import {
  seedVehicle,
  truncateVehiclesTable,
} from '../helpers/vehicle-seed.helper';
import {
  seedMechanic,
  truncateMechanicsTable,
} from '../helpers/mechanic-seed.helper';
import {
  seedWorkOrder,
  truncateWorkOrdersTable,
} from '../helpers/work-order-seed.helper';

describe('WorkOrdersController (e2e)', () => {
  let app: INestApplication;
  let seedPrisma: PrismaClient;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    seedPrisma = createSeedPrismaClient();
  }, 30000);

  afterAll(async () => {
    await truncateWorkOrdersTable(seedPrisma);
    await truncateMechanicsTable(seedPrisma);
    await truncateVehiclesTable(seedPrisma);
    await truncateClientsTable(seedPrisma);
    await truncateAuthTables(seedPrisma);
    await seedPrisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await truncateWorkOrdersTable(seedPrisma);
    await truncateMechanicsTable(seedPrisma);
    await truncateVehiclesTable(seedPrisma);
    await truncateClientsTable(seedPrisma);
    await truncateAuthTables(seedPrisma);
  });

  describe('POST /work-orders', () => {
    it('should create a work order', async () => {
      const { accessToken, tenantId } =
        await seedActiveUserWithTenant(seedPrisma);
      const client = await seedClient(seedPrisma, { tenantId });
      const vehicle = await seedVehicle(seedPrisma, {
        tenantId,
        clientId: client.id,
      });

      const createDto = {
        vehicleId: vehicle.id,
        clientId: client.id,
        description: 'Test work order',
        priority: 'normal',
      };

      const response = await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.vehicleId).toBe(vehicle.id);
      expect(response.body.clientId).toBe(client.id);
      expect(response.body.milestone).toBe('created');
    });

    it('should reject if vehicle does not belong to client', async () => {
      const { accessToken, tenantId } =
        await seedActiveUserWithTenant(seedPrisma);
      const client1 = await seedClient(seedPrisma, { tenantId });
      const client2 = await seedClient(seedPrisma, { tenantId });
      const vehicle = await seedVehicle(seedPrisma, {
        tenantId,
        clientId: client1.id,
      });

      const createDto = {
        vehicleId: vehicle.id,
        clientId: client2.id,
        description: 'Test work order',
      };

      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /work-orders', () => {
    it('should return paginated work orders', async () => {
      const { accessToken, tenantId } =
        await seedActiveUserWithTenant(seedPrisma);
      const client = await seedClient(seedPrisma, { tenantId });
      const vehicle = await seedVehicle(seedPrisma, {
        tenantId,
        clientId: client.id,
      });

      await seedWorkOrder(seedPrisma, {
        tenantId,
        vehicleId: vehicle.id,
        clientId: client.id,
      });
      await seedWorkOrder(seedPrisma, {
        tenantId,
        vehicleId: vehicle.id,
        clientId: client.id,
      });

      const response = await request(app.getHttpServer())
        .get('/work-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBe(2);
      expect(response.body.meta.page).toBe(1);
    });
  });

  describe('POST /work-orders/:id/mechanics', () => {
    it('should assign mechanics and auto-transition to assigned', async () => {
      const { accessToken, tenantId } =
        await seedActiveUserWithTenant(seedPrisma);
      const client = await seedClient(seedPrisma, { tenantId });
      const vehicle = await seedVehicle(seedPrisma, {
        tenantId,
        clientId: client.id,
      });
      const workOrder = await seedWorkOrder(seedPrisma, {
        tenantId,
        vehicleId: vehicle.id,
        clientId: client.id,
      });
      const mechanic = await seedMechanic(seedPrisma, { tenantId });

      const assignDto = {
        mechanicIds: [mechanic.id],
        primaryMechanicId: mechanic.id,
      };

      const response = await request(app.getHttpServer())
        .post(`/work-orders/${workOrder.id}/mechanics`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(assignDto)
        .expect(201);

      expect(response.body.milestone).toBe('assigned');
      expect(response.body.mechanics).toHaveLength(1);
      expect(response.body.mechanics[0].mechanicId).toBe(mechanic.id);
    });
  });

  describe('PATCH /work-orders/:id/transition', () => {
    it('should transition to in_progress and set startedAt', async () => {
      const { accessToken, tenantId } =
        await seedActiveUserWithTenant(seedPrisma);
      const client = await seedClient(seedPrisma, { tenantId });
      const vehicle = await seedVehicle(seedPrisma, {
        tenantId,
        clientId: client.id,
      });
      const workOrder = await seedWorkOrder(seedPrisma, {
        tenantId,
        vehicleId: vehicle.id,
        clientId: client.id,
        milestone: 'assigned',
      });

      const transitionDto = {
        milestone: 'in_progress',
      };

      const response = await request(app.getHttpServer())
        .patch(`/work-orders/${workOrder.id}/transition`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transitionDto)
        .expect(200);

      expect(response.body.milestone).toBe('in_progress');
      expect(response.body.startedAt).toBeDefined();
    });

    it('should reject invalid transition', async () => {
      const { accessToken, tenantId } =
        await seedActiveUserWithTenant(seedPrisma);
      const client = await seedClient(seedPrisma, { tenantId });
      const vehicle = await seedVehicle(seedPrisma, {
        tenantId,
        clientId: client.id,
      });
      const workOrder = await seedWorkOrder(seedPrisma, {
        tenantId,
        vehicleId: vehicle.id,
        clientId: client.id,
        milestone: 'created',
      });

      const transitionDto = {
        milestone: 'completed',
      };

      await request(app.getHttpServer())
        .patch(`/work-orders/${workOrder.id}/transition`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transitionDto)
        .expect(400);
    });
  });

  // TODO: Fix RBAC tests - throttle limit (5 requests per 60s) causes failures
  // These tests need to be refactored to work within throttle constraints
  // or use a separate test suite with higher throttle limits
  /*
  describe('RBAC', () => {
    it('should allow mecanico to see only assigned work orders', async () => {
      const { accessToken, tenantId } = await seedActiveUserWithTenant(seedPrisma, {
        role: 'mecanico',
      });
      const client = await seedClient(seedPrisma, { tenantId });
      const vehicle = await seedVehicle(seedPrisma, {
        tenantId,
        clientId: client.id,
      });
      const workOrder1 = await seedWorkOrder(seedPrisma, {
        tenantId,
        vehicleId: vehicle.id,
        clientId: client.id,
      });
      const workOrder2 = await seedWorkOrder(seedPrisma, {
        tenantId,
        vehicleId: vehicle.id,
        clientId: client.id,
      });

      // Assign mecanico to workOrder1 only
      await seedPrisma.workOrderMechanic.create({
        data: {
          tenantId,
          workOrderId: workOrder1.id,
          mechanicId: accessToken, // This is wrong, need actual mechanic ID
          isPrimary: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/work-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(workOrder1.id);
    });
  });
  */
});
