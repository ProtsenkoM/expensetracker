import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCategoryDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @IsString() @Matches(/^#[0-9a-fA-F]{6}$/) color!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) icon!: string;
}

export class UpdateCategoryDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  icon?: string;
}
