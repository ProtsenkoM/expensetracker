import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { CategoriesRepository } from './categories.repository.js';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}
  create(userId: string, data: CreateCategoryDto) {
    return this.repository.create(userId, data);
  }
  findAll(userId: string) {
    return this.repository.findAll(userId);
  }
  async update(userId: string, id: string, data: UpdateCategoryDto) {
    if (!Object.values(data).some((value) => value !== undefined))
      throw new BadRequestException('Update must include a field');
    const [category] = await this.repository.update(userId, id, data);
    if (!category) throw new NotFoundException();
    return category;
  }
  async remove(userId: string, id: string) {
    let result;
    try {
      result = await this.repository.remove(userId, id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      )
        throw new ConflictException('Category has transactions');
      throw error;
    }
    if (!result.count) throw new NotFoundException();
  }
}
