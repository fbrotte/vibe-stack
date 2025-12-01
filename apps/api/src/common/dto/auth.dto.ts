import { createZodDto } from 'nestjs-zod'
import {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
  AuthResponseSchema,
} from '@template-dev/shared'

export class LoginDto extends createZodDto(LoginSchema) {}
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}
