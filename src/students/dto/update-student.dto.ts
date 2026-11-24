import { IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateStudentDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nim?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nama?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  jurusan?: string;
}
