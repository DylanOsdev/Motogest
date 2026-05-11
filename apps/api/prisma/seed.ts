import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo tenant for development
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-taller' },
    update: {},
    create: {
      name: 'Taller Demo',
      slug: 'demo-taller',
      subdomain: 'demo-taller',
      status: 'active',
      country: 'AR',
      plan: 'premium',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // Create demo admin user (password: Demo123456!)
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo-taller.com' },
    update: {},
    create: {
      email: 'admin@demo-taller.com',
      passwordHash: '$2b$12$LJ3m4sMKfRzG8J3xK5v5XOqZqKzYp5v5XOqZqKzYp5v5XOqZqKzY', // placeholder
      fullName: 'Admin Demo',
      phone: '+5491155551234',
      status: 'active',
      emailVerified: true,
    },
  });

  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: 'admin_taller',
    },
  });

  console.log(`✅ User created: ${user.email} (role: admin_taller)`);

  // Create subscription
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      plan: 'premium',
      status: 'active',
      billingCycle: 'monthly',
    },
  });

  console.log('✅ Subscription created: premium/monthly');
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
