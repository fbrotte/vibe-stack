import { z } from 'zod'

export const UserRoleSchema = z.enum(['USER', 'ADMIN'])

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: UserRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().nullable().optional(),
  role: UserRoleSchema.optional(),
})

export type User = z.infer<typeof UserSchema>
export type UserRole = z.infer<typeof UserRoleSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
