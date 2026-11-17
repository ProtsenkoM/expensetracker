import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(userId: string, data: CreateCategoryDto) {
    return this.prisma.category.create({ data: { ...data, userId } });
  }
  findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }
  update(userId: string, id: string, data: UpdateCategoryDto) {
    return this.prisma.category.updateManyAndReturn({
      where: { id, userId },
      data,
    });
  }
  remove(userId: string, id: string) {
    return this.prisma.category.deleteMany({ where: { id, userId } });
  }
}
