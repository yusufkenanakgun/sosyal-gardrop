import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OutfitsService } from './outfits.service';
import { CreateOutfitDto } from './dto/create-outfit.dto';

@Controller('outfits')
@UseGuards(JwtAuthGuard)
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Post()
  create(@Request() req, @Body() createOutfitDto: CreateOutfitDto) {
    return this.outfitsService.create(req.user.userId, createOutfitDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.outfitsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.outfitsService.findOne(req.user.userId, id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.outfitsService.remove(req.user.userId, id);
  }
}
