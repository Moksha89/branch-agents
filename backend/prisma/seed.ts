import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Sarkar@00', 12);

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

  console.log('Seeded admin user:', { id: admin.id, username: admin.username, role: admin.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
