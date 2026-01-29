const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function debugAuth() {
    console.log('🕵️‍♀️ Starting Auth Debug...');
    const email = 'admin@npopc.gov.ng';
    const password = 'Admin@123';

    try {
        // 1. Replicate findUnique logic exactly
        console.log('1. Attempting Prisma Query...');
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log('❌ User not found by Prisma.');
            return;
        }

        console.log('✅ User found by Prisma.');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role ? user.role.name : 'NULL'}`);
        console.log(`   Permissions Count: ${user.role && user.role.permissions ? user.role.permissions.length : 'N/A'}`);
        console.log(`   IsActive: ${user.isActive}`);

        // 2. Check Active
        if (!user.isActive) {
            console.log('❌ User is inactive.');
            return;
        }

        // 3. Compare Password
        console.log('2. Comparing Password...');
        const isValid = await compare(password, user.hashedPassword);

        if (isValid) {
            console.log('✅ Password MATCHES.');
        } else {
            console.log('❌ Password mismatch.');
        }

        // 4. Test Role Logic
        if (user.role) {
            console.log('3. Testing Role Logic...');
            const roleName = user.role.name.replace(/[\s-]+/g, '_').toUpperCase();
            console.log(`   Raw Name: '${user.role.name}'`);
            console.log(`   Normalized: '${roleName}'`);

            const UserRole = {
                VIEWER: 'VIEWER',
                OPERATOR: 'OPERATOR',
                MANAGER: 'MANAGER',
                AUDITOR: 'AUDITOR',
                ADMIN: 'ADMIN',
                SUPER_ADMIN: 'SUPER_ADMIN'
            };

            const normalizedRole = roleName === 'SUPERADMIN' ? UserRole.SUPER_ADMIN : roleName;
            console.log(`   Mapped: '${normalizedRole}'`);

            const validRole = Object.values(UserRole).find(r => r === normalizedRole);
            console.log(`   Valid: ${validRole ? 'YES' : 'NO'}`);
        }

    } catch (error) {
        console.error('❌ Debug Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugAuth();
