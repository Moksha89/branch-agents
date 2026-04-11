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

  console.log('Seeded admin user:', { id: admin.id, username: admin.username, role: admin.role });

  // Seed demo branches
  const branchData = [
    { name: 'Hyderabad Branch', code: 'HYD-001' },
    { name: 'Mumbai Branch', code: 'MUM-001' },
    { name: 'Delhi Branch', code: 'DEL-001' },
    { name: 'Bangalore Branch', code: 'BLR-001' },
    { name: 'Chennai Branch', code: 'CHN-001' },
  ];

  const branches: { id: string; name: string }[] = [];
  for (const b of branchData) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: {},
      create: b,
    });
    branches.push(branch);
    console.log('Seeded branch:', branch.name);
  }

  // Seed demo bank accounts
  const demoAccounts = [
    {
      fullName: 'Ravi Kumar',
      mobileNumber: '9876543210',
      aadharLinkedNumber: '9876543210',
      bankName: 'State Bank of India',
      accountNumber: '30245678901234',
      ifscCode: 'SBIN0001234',
      bankBranch: 'Ameerpet Branch',
      aadharNumber: '234567890123',
      panCardNumber: 'ABCDE1234F',
      debitCardNumber: '4111111111111111',
      debitCardExpiry: '12/28',
      debitCardCvv: '123',
      netbankingUsername: 'ravikumar_sbi',
      netbankingPassword: 'demo1234',
      bankBalance: 125000,
      branchIndex: 0,
    },
    {
      fullName: 'Priya Sharma',
      mobileNumber: '9988776655',
      aadharLinkedNumber: '9988776655',
      bankName: 'HDFC Bank',
      accountNumber: '50100456789012',
      ifscCode: 'HDFC0001234',
      bankBranch: 'Banjara Hills',
      aadharNumber: '345678901234',
      panCardNumber: 'FGHIJ5678K',
      debitCardNumber: '5500000000000004',
      debitCardExpiry: '06/27',
      debitCardCvv: '456',
      netbankingUsername: 'priyasharma_hdfc',
      netbankingPassword: 'demo5678',
      bankBalance: 87500,
      branchIndex: 0,
    },
    {
      fullName: 'Amit Patel',
      mobileNumber: '9112233445',
      aadharLinkedNumber: '9112233445',
      bankName: 'ICICI Bank',
      accountNumber: '00201234567890',
      ifscCode: 'ICIC0001234',
      bankBranch: 'Andheri West',
      aadharNumber: '456789012345',
      panCardNumber: 'KLMNO9012P',
      debitCardNumber: '4012888888881881',
      debitCardExpiry: '03/29',
      debitCardCvv: '789',
      netbankingUsername: 'amitpatel_icici',
      netbankingPassword: 'demo9012',
      bankBalance: 250000,
      branchIndex: 1,
    },
    {
      fullName: 'Sneha Reddy',
      mobileNumber: '9556677889',
      aadharLinkedNumber: '9556677889',
      bankName: 'Axis Bank',
      accountNumber: '91701234567890',
      ifscCode: 'UTIB0001234',
      bankBranch: 'Koramangala',
      aadharNumber: '567890123456',
      panCardNumber: 'QRSTU3456V',
      debitCardNumber: '6011000000000004',
      debitCardExpiry: '09/26',
      debitCardCvv: '321',
      netbankingUsername: 'snehareddy_axis',
      netbankingPassword: 'demo3456',
      bankBalance: 43000,
      branchIndex: 3,
    },
    {
      fullName: 'Rajesh Verma',
      mobileNumber: '9334455667',
      aadharLinkedNumber: '9334455667',
      bankName: 'Punjab National Bank',
      accountNumber: '0156001234567890',
      ifscCode: 'PUNB0123400',
      bankBranch: 'Connaught Place',
      aadharNumber: '678901234567',
      panCardNumber: 'WXYZ7890A',
      debitCardNumber: '4917610000000000',
      debitCardExpiry: '01/28',
      debitCardCvv: '654',
      netbankingUsername: 'rajeshverma_pnb',
      netbankingPassword: 'demo7890',
      bankBalance: 178000,
      branchIndex: 2,
    },
    {
      fullName: 'Kavitha Nair',
      mobileNumber: '9445566778',
      aadharLinkedNumber: '9445566778',
      bankName: 'Bank of Baroda',
      accountNumber: '34560012345678',
      ifscCode: 'BARB0CHENNA',
      bankBranch: 'T Nagar',
      aadharNumber: '789012345678',
      panCardNumber: 'BCDEF2345G',
      debitCardNumber: '5425233430109903',
      debitCardExpiry: '11/27',
      debitCardCvv: '987',
      netbankingUsername: 'kavithanair_bob',
      netbankingPassword: 'demo2345',
      bankBalance: 56200,
      branchIndex: 4,
    },
    {
      fullName: 'Vikram Singh',
      mobileNumber: '9223344556',
      aadharLinkedNumber: '9223344556',
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '78901234567890',
      ifscCode: 'KKBK0001234',
      bankBranch: 'Jubilee Hills',
      aadharNumber: '890123456789',
      panCardNumber: 'HIJKL6789M',
      debitCardNumber: '4532015112830366',
      debitCardExpiry: '05/29',
      debitCardCvv: '246',
      netbankingUsername: 'vikramsingh_kotak',
      netbankingPassword: 'demo6789',
      bankBalance: 320000,
      branchIndex: 0,
    },
    {
      fullName: 'Deepika Joshi',
      mobileNumber: '9667788990',
      aadharLinkedNumber: '9667788990',
      bankName: 'Union Bank of India',
      accountNumber: '51020034567890',
      ifscCode: 'UBIN0531234',
      bankBranch: 'Powai',
      aadharNumber: '901234567890',
      panCardNumber: 'NOPQR0123S',
      debitCardNumber: '4916338506082832',
      debitCardExpiry: '08/26',
      debitCardCvv: '135',
      netbankingUsername: 'deepikajoshi_ubi',
      netbankingPassword: 'demo0123',
      bankBalance: 91500,
      branchIndex: 1,
    },
  ];

  for (const acc of demoAccounts) {
    const { branchIndex, ...accountData } = acc;
    const existing = await prisma.bankAccount.findFirst({
      where: { accountNumber: accountData.accountNumber },
    });
    if (!existing) {
      await prisma.bankAccount.create({
        data: {
          ...accountData,
          branchId: branches[branchIndex].id,
          createdById: admin.id,
        },
      });
      console.log('Seeded bank account:', accountData.fullName, '→', branches[branchIndex].name);
    } else {
      console.log('Bank account already exists:', accountData.fullName);
    }
  }

  console.log('\nDemo data seeding complete!');
  console.log(`  - 1 admin user`);
  console.log(`  - ${branches.length} branches`);
  console.log(`  - ${demoAccounts.length} bank accounts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
