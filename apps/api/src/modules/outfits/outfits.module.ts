import { Module } from '@nestjs/common';
import { OutfitsController } from './outfits.controller';
import { OutfitsService } from './outfits.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [OutfitsController],
  providers: [OutfitsService, PrismaService],
  exports: [OutfitsService],
})
export class OutfitsModule {}
