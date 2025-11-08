import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateOutfitDto } from './dto/create-outfit.dto';

@Injectable()
export class OutfitsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOutfitDto: CreateOutfitDto) {
    const { itemIds, weatherTag, occasionTag } = createOutfitDto;

    // Verify all items belong to the user
    const items = await this.prisma.wardrobeItem.findMany({
      where: {
        id: { in: itemIds },
        userId,
      },
    });

    if (items.length !== itemIds.length) {
      throw new ForbiddenException('Some items do not belong to you or do not exist');
    }

    // Create outfit with items
    const outfit = await this.prisma.outfit.create({
      data: {
        userId,
        weatherTag,
        occasionTag,
        items: {
          create: items.map((item) => ({
            itemId: item.id,
            slot: this.determineSlot(item.type),
          })),
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    return outfit;
  }

  async findAll(userId: string) {
    const outfits = await this.prisma.outfit.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return outfits;
  }

  async findOne(userId: string, outfitId: string) {
    const outfit = await this.prisma.outfit.findUnique({
      where: { id: outfitId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!outfit) {
      throw new NotFoundException('Outfit not found');
    }

    if (outfit.userId !== userId) {
      throw new ForbiddenException('You do not have access to this outfit');
    }

    return outfit;
  }

  async remove(userId: string, outfitId: string) {
    const outfit = await this.prisma.outfit.findUnique({
      where: { id: outfitId },
    });

    if (!outfit) {
      throw new NotFoundException('Outfit not found');
    }

    if (outfit.userId !== userId) {
      throw new ForbiddenException('You do not have access to this outfit');
    }

    await this.prisma.outfit.delete({
      where: { id: outfitId },
    });

    return { message: 'Outfit deleted successfully' };
  }

  private determineSlot(itemType: string): string {
    const slotMap: Record<string, string> = {
      'tshirt': 'top',
      'shirt': 'top',
      'sweater': 'top',
      'jacket': 'outerwear',
      'coat': 'outerwear',
      'pants': 'bottom',
      'jeans': 'bottom',
      'shorts': 'bottom',
      'skirt': 'bottom',
      'shoes': 'shoes',
      'sneakers': 'shoes',
      'boots': 'shoes',
      'hat': 'accessory',
      'bag': 'accessory',
      'scarf': 'accessory',
    };

    return slotMap[itemType.toLowerCase()] || 'accessory';
  }
}
