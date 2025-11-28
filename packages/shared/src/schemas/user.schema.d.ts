import { z } from 'zod';
export declare const UserRoleSchema: z.ZodEnum<["USER", "ADMIN"]>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<["USER", "ADMIN"]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
    createdAt: Date;
    updatedAt: Date;
}, {
    id: string;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name?: string | undefined;
}, {
    email: string;
    password: string;
    name?: string | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodOptional<z.ZodEnum<["USER", "ADMIN"]>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | null | undefined;
    role?: "USER" | "ADMIN" | undefined;
}, {
    email?: string | undefined;
    name?: string | null | undefined;
    role?: "USER" | "ADMIN" | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
