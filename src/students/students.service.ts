import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(jurusan?: string) {
    return this.prisma.student.findMany({
      where: jurusan ? { jurusan: { equals: jurusan, mode: 'insensitive' } } : undefined,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Mahasiswa tidak ditemukan');
    return student;
  }

  async create(data: CreateStudentDto) {
    try {
      return await this.prisma.student.create({ data });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(id: number, data: UpdateStudentDto) {
    try {
      return await this.prisma.student.update({ where: { id }, data });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.student.delete({ where: { id } });
      return { message: 'Mahasiswa berhasil dihapus' };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  count() {
    return this.prisma.student.count().then((total) => ({ total }));
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') throw new ConflictException('NIM sudah digunakan');
      if (error.code === 'P2025') throw new NotFoundException('Mahasiswa tidak ditemukan');
    }
    throw error;
  }
}
