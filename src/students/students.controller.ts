import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(@Query('jurusan') jurusan?: string) {
    return this.studentsService.findAll(jurusan);
  }

  @Get('count')
  count() {
    return this.studentsService.count();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateStudentDto) {
    return this.studentsService.create(data);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateStudentDto) {
    return this.studentsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
