import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [StudentsModule],
  controllers: [AppController],
})
export class AppModule {}
