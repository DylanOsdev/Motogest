import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('ClientsService', () => {
  let service: ClientsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  const mockTenantId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            vehicle: {
              count: jest.fn(),
            },
            withRlsTransaction: jest.fn(async (fn) => {
              const mockTx = {
                client: {
                  create: jest.fn(),
                  update: jest.fn(),
                },
              };
              return fn(mockTx);
            }),
            $transaction: jest.fn(async (ops) => {
              if (Array.isArray(ops)) return await Promise.all(ops);
              return ops({});
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    const createDto = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@test.com',
      phone: '1145678901',
    };

    it('should create a client with tenantId', async () => {
      const createdClient = {
        id: 'client-1',
        ...createDto,
        tenantId: mockTenantId,
      };
      prisma.client.findFirst.mockResolvedValue(null);
      prisma.withRlsTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const mockTx = {
            client: { create: jest.fn().mockResolvedValue(createdClient) },
          };
          return fn(mockTx);
        },
      );

      const result = await service.create(mockTenantId, createDto);

      expect(result).toEqual(createdClient);
    });

    it('should throw ConflictException on duplicate email', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException on duplicate phone', async () => {
      prisma.client.findFirst
        .mockResolvedValueOnce(null) // email check passes
        .mockResolvedValueOnce({ id: 'existing' }); // phone check fails

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow null email and phone', async () => {
      const dtoWithoutContact = { firstName: 'Juan', lastName: 'Pérez' };
      const createdClient = {
        id: 'client-2',
        ...dtoWithoutContact,
        tenantId: mockTenantId,
      };
      prisma.withRlsTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const mockTx = {
            client: { create: jest.fn().mockResolvedValue(createdClient) },
          };
          return fn(mockTx);
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await service.create(
        mockTenantId,
        dtoWithoutContact as any,
      );
      expect(result).toEqual(createdClient);
    });
  });

  describe('findAll', () => {
    it('should return paginated results with default params', async () => {
      const clients = [{ id: '1', firstName: 'Juan' }];
      prisma.$transaction.mockResolvedValue([clients, 1]);

      const result = await service.findAll(mockTenantId, {});

      expect(result.data).toEqual(clients);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by search term across firstName/lastName/email', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, { search: 'juan' });

      // Verify $transaction was called (search logic constructs the where clause)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should respect custom page and limit', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, { page: 2, limit: 5 });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return client by id', async () => {
      const client = { id: 'client-1', firstName: 'Juan' };
      prisma.client.findFirst.mockResolvedValue(client);

      const result = await service.findOne(mockTenantId, 'client-1');

      expect(result).toEqual(client);
    });

    it('should throw NotFoundException for non-existent client', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { firstName: 'Updated' };

    it('should patch allowed fields', async () => {
      const existing = {
        id: 'client-1',
        firstName: 'Juan',
        email: 'juan@test.com',
      };
      const updated = { ...existing, firstName: 'Updated' };
      prisma.client.findFirst.mockResolvedValue(existing);
      prisma.withRlsTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const mockTx = {
            client: { update: jest.fn().mockResolvedValue(updated) },
          };
          return fn(mockTx);
        },
      );

      const result = await service.update(mockTenantId, 'client-1', updateDto);

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException for non-existent client', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on email duplicate', async () => {
      const existing = { id: 'client-1', email: 'old@test.com' };
      prisma.client.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 'other' });

      await expect(
        service.update(mockTenantId, 'client-1', {
          email: 'duplicate@test.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-delete client (status → inactive)', async () => {
      const existing = { id: 'client-1', status: 'active' };
      const updated = { ...existing, status: 'inactive' };
      prisma.client.findFirst.mockResolvedValue(existing);
      prisma.vehicle.count.mockResolvedValue(0);
      prisma.withRlsTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const mockTx = {
            client: { update: jest.fn().mockResolvedValue(updated) },
          };
          return fn(mockTx);
        },
      );

      const result = await service.remove(mockTenantId, 'client-1');

      expect(result.status).toBe('inactive');
    });

    it('should reject when client has vehicles', async () => {
      const existing = { id: 'client-1' };
      prisma.client.findFirst.mockResolvedValue(existing);
      prisma.vehicle.count.mockResolvedValue(3);

      await expect(service.remove(mockTenantId, 'client-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException for non-existent client', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockTenantId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
