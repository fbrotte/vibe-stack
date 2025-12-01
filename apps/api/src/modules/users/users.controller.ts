import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth';
import { UpdateUserDto, ApiErrorDto } from '../../common/dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ApiErrorDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ApiErrorDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ApiErrorDto })
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ApiErrorDto })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
