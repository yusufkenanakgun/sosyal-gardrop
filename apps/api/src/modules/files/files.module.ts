import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ConfigModule } from '@nestjs/config';
import { DbService } from '../../db/db.service';

@Module({
  imports: [ConfigModule],
  providers: [FilesService, DbService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
