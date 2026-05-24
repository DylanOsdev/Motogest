import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: 'EMAIL_SERVICE', useValue: { sendVerificationEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const dto = {
      email: 'test@example.com',
      password: 'Str0ng!Pass',
      fullName: 'Test User',
      tenantName: 'Test Tenant',
      tenantSlug: 'test-tenant',
    };

    it('creates Tenant+User+UserTenant+Subscription atomically', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
          user: { create: jest.fn().mockResolvedValue({ id: 'user-1' }) },
          emailVerification: { create: jest.fn().mockResolvedValue({ token: 'tok' }) },
          $executeRawUnsafe: jest.fn(),
          userTenant: { create: jest.fn().mockResolvedValue({}) },
          subscription: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const result = await service.signup(dto);

      expect(result).toEqual({ message: 'verify_email_sent' });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException on duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.signup(dto)).rejects.toThrow(ConflictException);
    });
  });
});
