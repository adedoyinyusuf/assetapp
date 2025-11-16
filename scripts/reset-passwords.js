const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  const updates = [
    { email: 'super.admin@npopc.gov.ng', password: 'SuperAdmin@123' },
    { email: 'admin@npopc.gov.ng', password: 'Admin@123' },
    { email: 'manager@npopc.gov.ng', password: 'Manager@123' },
    { email: 'operator@npopc.gov.ng', password: 'Operator@123' },
    { email: 'viewer@npopc.gov.ng', password: 'Viewer@123' },
  ];

  for (const { email, password } of updates) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`Skip: user not found -> ${email}`);
      continue;
    }

    const hashed = await hash(password, 12);
    await prisma.user.update({ where: { email }, data: { hashedPassword: hashed } });
    console.log(`✅ Updated password for ${email}`);
  }
}

run()
  .catch((e) => {
    console.error('Error resetting passwords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });