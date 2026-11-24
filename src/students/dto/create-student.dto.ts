import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nim!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nama!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  jurusan!: string;
}
