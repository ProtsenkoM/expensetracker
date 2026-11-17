import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsISO8601,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { TransactionType } from '../generated/prisma/enums.js';

const present = ValidateIf((_object, value) => value !== undefined);
const datePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const amountPattern =
  /^(?=\d{1,16}(?:\.\d{1,2})?$)(?=.*[1-9])\d+(?:\.\d{1,2})?$/;

export class CreateTransactionDto {
  @IsString() @Matches(amountPattern) amount!: string;
  @IsEnum(TransactionType) type!: TransactionType;
  @ValidateIf((_o, value) => value !== undefined && value !== null)
  @IsString()
  description?: string | null;
  @IsString() @Matches(datePattern) @IsISO8601({ strict: true }) date!: string;
  @IsUUID() categoryId!: string;
}
export class UpdateTransactionDto {
  @present @IsDefined() @IsString() @Matches(amountPattern) amount?: string;
  @present @IsDefined() @IsEnum(TransactionType) type?: TransactionType;
  @ValidateIf((_o, value) => value !== undefined && value !== null)
  @IsString()
  description?: string | null;
  @present
  @IsDefined()
  @IsString()
  @Matches(datePattern)
  @IsISO8601({ strict: true })
  date?: string;
  @present @IsDefined() @IsUUID() categoryId?: string;
}
export class ListTransactionsDto {
  @present
  @IsDefined()
  @IsString()
  @Matches(datePattern)
  @IsISO8601({ strict: true })
  dateFrom?: string;
  @present
  @IsDefined()
  @IsString()
  @Matches(datePattern)
  @IsISO8601({ strict: true })
  dateTo?: string;
  @present @IsDefined() @IsEnum(TransactionType) type?: TransactionType;
  @present @IsDefined() @IsUUID() categoryId?: string;
}
const numberQuery = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
);
export class SummaryTransactionsDto {
  @numberQuery @IsInt() @Min(1) @Max(12) month!: number;
  @numberQuery @IsInt() @Min(1) @Max(9999) year!: number;
}
