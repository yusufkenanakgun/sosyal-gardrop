import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from '../modules/files/files.service';
import { UsersService } from './users.service';

class PresignAvatarDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contentType: string;
}

class CompleteAvatarDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;
}

@ApiTags('users')
@Controller('users/avatar')
export class AvatarController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for avatar upload' })
  async presign(@Body() body: PresignAvatarDto, @Request() req: any) {
    const { filename, contentType } = body;

    // Validate image types only
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException('Only image files are allowed for avatars');
    }

    // Get user email for folder structure
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new BadRequestException('User not found');

    // Generate presigned URL with avatar-specific path
    const result = await this.filesService.generatePresignedUpload(
      filename,
      contentType,
      user.email,
      'avatar',
    );

    return result;
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete avatar upload and update user profile' })
  async complete(@Body() body: CompleteAvatarDto, @Request() req: any) {
    const { key } = body;

    // Verify file exists
    const fileExists = await this.filesService.verifyFileExists(key);
    if (!fileExists) {
      throw new BadRequestException('File not found in storage');
    }

    // Get public URL
    const publicUrl = this.filesService.getPublicUrl(key);

    // Update user avatar
    const updatedUser = await this.usersService.updateAvatar(req.user.userId, publicUrl);

    return {
      avatarUrl: updatedUser.avatarUrl,
      message: 'Avatar updated successfully',
    };
  }
}
