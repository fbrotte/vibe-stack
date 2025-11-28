import { createZodDto } from 'nestjs-zod';
import {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
} from '@template-dev/shared';

export class UserDto extends createZodDto(UserSchema) {}
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
