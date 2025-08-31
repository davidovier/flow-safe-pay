import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const brandUser = await prisma.user.upsert({
    where: { email: 'brand@example.com' },
    update: {},
    create: {
      email: 'brand@example.com',
      hashedPassword,
      role: 'BRAND',
      country: 'US',
      kycStatus: 'APPROVED',
      stripeAccountId: 'acct_demo_brand',
    },
  });

  const creatorUser = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      email: 'creator@example.com',
      hashedPassword,
      role: 'CREATOR',
      country: 'US',
      kycStatus: 'APPROVED',
      stripeAccountId: 'acct_demo_creator',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@flowpay.com' },
    update: {},
    create: {
      email: 'admin@flowpay.com',
      hashedPassword,
      role: 'ADMIN',
      country: 'US',
      kycStatus: 'APPROVED',
    },
  });

  console.log('✅ Created demo users:', {
    brand: brandUser.email,
    creator: creatorUser.email,
    admin: adminUser.email,
  });

  // Create demo project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      brandId: brandUser.id,
      title: 'Summer Collection Launch',
      description: 'Promote our new summer collection with authentic lifestyle content',
      status: 'active',
    },
  });

  console.log('✅ Created demo project:', project.title);

  // Create demo deal with milestones
  const deal = await prisma.deal.upsert({
    where: { id: 'demo-deal-1' },
    update: {},
    create: {
      id: 'demo-deal-1',
      projectId: project.id,
      creatorId: creatorUser.id,
      currency: 'usd',
      amountTotal: 250000, // $2,500 in cents
      escrowId: 'pi_demo_escrow_123',
      state: 'FUNDED',
      acceptedAt: new Date(),
      fundedAt: new Date(),
    },
  });

  // Create milestones
  const milestone1 = await prisma.milestone.upsert({
    where: { id: 'demo-milestone-1' },
    update: {},
    create: {
      id: 'demo-milestone-1',
      dealId: deal.id,
      title: 'Instagram Reel Creation',
      description: 'Create and post Instagram Reel featuring the summer collection',
      amount: 150000, // $1,500 in cents
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      state: 'PENDING',
    },
  });

  const milestone2 = await prisma.milestone.upsert({
    where: { id: 'demo-milestone-2' },
    update: {},
    create: {
      id: 'demo-milestone-2',
      dealId: deal.id,
      title: 'TikTok Video Campaign',
      description: 'Create TikTok video with branded hashtag and product showcase',
      amount: 100000, // $1,000 in cents
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      state: 'PENDING',
    },
  });

  console.log('✅ Created demo deal with milestones:', {
    dealId: deal.id,
    totalAmount: '$' + (deal.amountTotal / 100),
    milestones: [milestone1.title, milestone2.title],
  });

  // Create some demo events for audit trail
  await prisma.event.createMany({
    data: [
      {
        actorUserId: brandUser.id,
        type: 'user.registered',
        payload: { userId: brandUser.id, role: 'BRAND' },
      },
      {
        actorUserId: creatorUser.id,
        type: 'user.registered',
        payload: { userId: creatorUser.id, role: 'CREATOR' },
      },
      {
        actorUserId: brandUser.id,
        type: 'project.created',
        payload: { projectId: project.id, title: project.title },
      },
      {
        actorUserId: brandUser.id,
        type: 'deal.created',
        payload: { 
          dealId: deal.id, 
          projectId: project.id,
          creatorId: creatorUser.id,
          totalAmount: deal.amountTotal,
        },
      },
      {
        actorUserId: creatorUser.id,
        type: 'deal.accepted',
        payload: { dealId: deal.id },
      },
      {
        actorUserId: brandUser.id,
        type: 'deal.funded',
        payload: { 
          dealId: deal.id, 
          amount: deal.amountTotal,
          escrowId: deal.escrowId,
        },
      },
    ],
  });

  console.log('✅ Created demo audit events');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('Brand User: brand@example.com / password123');
  console.log('Creator User: creator@example.com / password123');
  console.log('Admin User: admin@flowpay.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });