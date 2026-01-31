'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { z } from 'zod'
import { UserRole } from '@/lib/auth/roles'
import { hash } from 'bcryptjs'

// Validation Schemas
const createUserSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    roleId: z.number().int().positive('Role is required'),
    isActive: z.boolean().default(true),
    password: z.string().min(6).optional(),
})

const updateUserSchema = z.object({
    userId: z.number().int().positive(),
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    roleId: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
})

export async function createUser(data: z.infer<typeof createUserSchema>) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)) {
            return { success: false, error: 'Unauthorized' }
        }

        const validation = createUserSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: 'Validation failed', details: validation.error.issues }
        }

        const { firstName, lastName, email, roleId, isActive, password } = validation.data

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return { success: false, error: 'Email already registered' }
        }

        const role = await prisma.userRole.findUnique({ where: { id: roleId } })
        if (!role) {
            return { success: false, error: 'Invalid role selected' }
        }

        const initialPassword = password || 'Password@123'
        const hashedPassword = await hash(initialPassword, 12)

        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                roleId,
                isActive,
                hashedPassword,
            },
            include: { role: true },
        })

        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id, 10),
                action: 'CREATE_USER',
                entityType: 'User',
                entityId: newUser.id,
                newValues: {
                    firstName,
                    lastName,
                    email,
                    role: role.name,
                    isActive,
                },
            },
        })

        revalidatePath('/admin/users')
        return { success: true, message: 'User created successfully', user: newUser }
    } catch (error) {
        console.error('Error creating user:', error)
        return { success: false, error: 'Failed to create user' }
    }
}

export async function updateUser(data: z.infer<typeof updateUserSchema>) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)) {
            return { success: false, error: 'Unauthorized' }
        }

        const validation = updateUserSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: 'Validation failed', details: validation.error.issues }
        }

        const { userId, firstName, lastName, email, roleId, isActive } = validation.data

        const existingUser = await prisma.user.findUnique({ where: { id: userId } })
        if (!existingUser) {
            return { success: false, error: 'User not found' }
        }

        const updateData: any = { updatedAt: new Date() }
        const logChanges: any = { oldValues: {}, newValues: {} }

        if (firstName && firstName !== existingUser.firstName) {
            updateData.firstName = firstName
            logChanges.oldValues.firstName = existingUser.firstName
            logChanges.newValues.firstName = firstName
        }

        if (lastName && lastName !== existingUser.lastName) {
            updateData.lastName = lastName
            logChanges.oldValues.lastName = existingUser.lastName
            logChanges.newValues.lastName = lastName
        }

        if (email && email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({ where: { email } })
            if (emailTaken && emailTaken.id !== userId) {
                return { success: false, error: 'Email already in use' }
            }
            updateData.email = email
            logChanges.oldValues.email = existingUser.email
            logChanges.newValues.email = email
        }

        if (isActive !== undefined && isActive !== existingUser.isActive) {
            updateData.isActive = isActive
            logChanges.oldValues.isActive = existingUser.isActive
            logChanges.newValues.isActive = isActive
        }

        if (roleId && roleId !== existingUser.roleId) {
            const role = await prisma.userRole.findUnique({ where: { id: roleId } })
            if (!role) {
                return { success: false, error: 'Role not found' }
            }
            updateData.roleId = roleId
            logChanges.oldValues.roleId = existingUser.roleId
            logChanges.newValues.roleId = roleId
            logChanges.newValues.roleName = role.name
        }

        if (Object.keys(updateData).length <= 1) {
            return { success: true, message: 'No changes detected' }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { role: true },
        })

        if (Object.keys(logChanges.newValues).length > 0) {
            await prisma.auditLog.create({
                data: {
                    userId: parseInt(session.user.id, 10),
                    action: 'UPDATE_USER',
                    entityType: 'User',
                    entityId: user.id,
                    oldValues: logChanges.oldValues,
                    newValues: logChanges.newValues,
                },
            })
        }

        revalidatePath('/admin/users')
        return { success: true, message: 'User updated successfully', user }
    } catch (error) {
        console.error('Error updating user:', error)
        return { success: false, error: 'Failed to update user' }
    }
}

export async function deleteUser(id: number) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
            return { success: false, error: 'Unauthorized' }
        }

        const user = await prisma.user.findUnique({
            where: { id },
            include: { role: true },
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        if (user.id === parseInt(session.user.id, 10)) {
            return { success: false, error: 'Cannot delete your own account' }
        }

        if (user.role?.name === UserRole.SUPER_ADMIN) {
            return { success: false, error: 'Cannot delete super admin user' }
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        })

        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id, 10),
                action: 'DELETE_USER',
                entityType: 'User',
                entityId: user.id,
                oldValues: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isActive: true,
                    roleId: user.roleId,
                    role: user.role?.name || 'USER',
                },
            },
        })

        revalidatePath('/admin/users')
        return { success: true, message: 'User deleted successfully' }
    } catch (error) {
        console.error('Error deleting user:', error)
        return { success: false, error: 'Failed to delete user' }
    }
}
