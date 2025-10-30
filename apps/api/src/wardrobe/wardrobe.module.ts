// apps/api/src/wardrobe/wardrobe.module.ts
import { Module } from '@nestjs/common';
import { WardrobeController } from './wardrobe.controller';
import { WardrobeService } from './wardrobe.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [WardrobeController],
  providers: [WardrobeService],
  exports: [WardrobeService],
})
export class WardrobeModule {}
