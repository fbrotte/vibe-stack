"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvSchema = void 0;
const zod_1 = require("zod");
exports.EnvSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    LITELLM_BASE_URL: zod_1.z.string().url().optional(),
    LITELLM_MASTER_KEY: zod_1.z.string().optional(),
    ANTHROPIC_API_KEY: zod_1.z.string().optional(),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    LANGFUSE_PUBLIC_KEY: zod_1.z.string().optional(),
    LANGFUSE_SECRET_KEY: zod_1.z.string().optional(),
    LANGFUSE_HOST: zod_1.z.string().url().optional(),
    QUEUE_ENABLED: zod_1.z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    PORT: zod_1.z.string().default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
});
//# sourceMappingURL=env.schema.js.map