
import { prisma } from '@/lib/db'
import UsersManagementClient from './users-client'

export const dynamic = 'force-dynamic'

export default async function UsersManagementPage() {
  // Fetch users with roles and permissions, ordered by creation date
  const usersData = await prisma.user.findMany({
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Fetch all roles for the dropdowns
  const rolesData = await prisma.userRole.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  // Transform data to match the Client Component interface
  const users = usersData.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
    roleId: user.roleId,
    isActive: user.isActive,
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    permissions: user.role.permissions.map(rp => rp.permission.name),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }))

  const roles = rolesData.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description
  }))

  return <UsersManagementClient initialUsers={users} roles={roles} />
}
