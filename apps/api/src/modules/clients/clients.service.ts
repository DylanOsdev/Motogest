import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateClientDto) {
    // Check uniqueness within tenant
    if (dto.email) {
      const existing = await this.prisma.client.findFirst({
        where: { tenantId, email: dto.email },
      });
      if (existing) {
        throw new ConflictException('EMAIL_ALREADY_EXISTS');
      }
    }
    if (dto.phone) {
      const existing = await this.prisma.client.findFirst({
        where: { tenantId, phone: dto.phone },
      });
      if (existing) {
        throw new ConflictException('PHONE_ALREADY_EXISTS');
      }
    }

    return this.prisma.withRlsTransaction(async (tx) => {
      return (tx as unknown as PrismaService).client.create({
        data: {
          tenantId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          address: dto.address ?? null,
          notes: dto.notes ?? null,
        },
      });
    });
  }

  async findAll(tenantId: string, query: QueryClientDto) {
    const {
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields = ['firstName', 'lastName', 'email', 'createdAt'];
    const orderByField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { tenantId, id },
    });
    if (!client) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }
    return client;
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    // Check if client exists
    const existing = await this.prisma.client.findFirst({
      where: { tenantId, id },
    });
    if (!existing) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    // Check email uniqueness if changing
    if (dto.email && dto.email !== existing.email) {
      const duplicate = await this.prisma.client.findFirst({
        where: { tenantId, email: dto.email },
      });
      if (duplicate) {
        throw new ConflictException('EMAIL_ALREADY_EXISTS');
      }
    }

    // Check phone uniqueness if changing
    if (dto.phone && dto.phone !== existing.phone) {
      const duplicate = await this.prisma.client.findFirst({
        where: { tenantId, phone: dto.phone },
      });
      if (duplicate) {
        throw new ConflictException('PHONE_ALREADY_EXISTS');
      }
    }

    return this.prisma.withRlsTransaction(async (tx) => {
      return (tx as unknown as PrismaService).client.update({
        where: { id, tenantId },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.client.findFirst({
      where: { tenantId, id },
    });
    if (!existing) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    // Check if client has vehicles
    const vehicleCount = await this.prisma.vehicle.count({
      where: { clientId: id, tenantId },
    });
    if (vehicleCount > 0) {
      throw new ConflictException('CLIENT_HAS_VEHICLES');
    }

    return this.prisma.withRlsTransaction(async (tx) => {
      return (tx as unknown as PrismaService).client.update({
        where: { id, tenantId },
        data: { status: 'inactive' },
      });
    });
  }
}
