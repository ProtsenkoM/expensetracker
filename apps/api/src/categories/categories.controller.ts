import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { PublicUser } from '../users/contracts/users.contracts.js';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Post() create(
    @CurrentUser() user: PublicUser,
    @Body() body: CreateCategoryDto,
  ) {
    return this.categories.create(user.id, body);
  }
  @Get() findAll(@CurrentUser() user: PublicUser) {
    return this.categories.findAll(user.id);
  }
  @Patch(':id') update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categories.update(user.id, id, body);
  }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categories.remove(user.id, id);
  }
}
