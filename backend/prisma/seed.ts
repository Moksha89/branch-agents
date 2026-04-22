import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Sarkar@00', 12);

  // Seed admin user
  const admin = await prisma.user.upsert({
    where: { username: 'sarkar' },
    update: {},
    create: {
      username: 'sarkar',
      password: hashedPassword,
      fullName: 'Sarkar Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Admin user ready:', { id: admin.id, username: admin.username, role: admin.role });
  console.log('\nProduction seed complete. No demo data created.');
  console.log('Log in at your portal URL with username: sarkar');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
