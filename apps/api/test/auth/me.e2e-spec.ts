import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { createSeedPrismaClient } from '../helpers/tenant-seed.helper';
import {
  truncateAuthTables,
  seedActiveUserWithTenant,
} from '../helpers/auth-seed.helper';
import { signTestJwt } from '../helpers/jwt.helper';

describe('GET /auth/me (e2e)', () => {
  let app: INestApplication;
  let seedPrisma: PrismaClient;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    seedPrisma = createSeedPrismaClient();
  });

  beforeEach(async () => {
    await truncateAuthTables(seedPrisma);
  });

  afterAll(async () => {
    await truncateAuthTables(seedPrisma);
    await seedPrisma.$disconnect();
    await app.close();
  });

  it('returns the authenticated user profile with tenantId and role', async () => {
    const seeded = await seedActiveUserWithTenant(seedPrisma, {
      email: 'me@taller.test',
      fullName: 'Me User',
      tenantName: 'Me Tenant',
      tenantSlug: 'me-tenant',
      role: 'admin_taller',
    });

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${seeded.accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      id: seeded.userId,
      email: 'me@taller.test',
      fullName: 'Me User',
      role: 'admin_taller',
      tenantId: seeded.tenantId,
    });
  });

  it('rejects requests without a Bearer token with 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('rejects requests with an invalid token signature with 401', async () => {
    const tamperedToken =
      signTestJwt(
        { sub: 'ghost-user', tenantId: 'ghost-tenant', role: 'admin_taller' },
        { expiresInSeconds: 60 },
      ).slice(0, -5) + 'XXXXX';

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);
  });

  it('returns 404 when the JWT references a user that no longer exists', async () => {
    const seeded = await seedActiveUserWithTenant(seedPrisma, {
      email: 'gone@taller.test',
    });

    // Delete the user after issuing the token
    await seedPrisma.userTenant.deleteMany({
      where: { userId: seeded.userId },
    });
    await seedPrisma.refreshToken.deleteMany({
      where: { userId: seeded.userId },
    });
    await seedPrisma.emailVerification.deleteMany({
      where: { userId: seeded.userId },
    });
    await seedPrisma.user.delete({ where: { id: seeded.userId } });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${seeded.accessToken}`)
      .expect(404);
  });
});
