import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { PostsService } from '../modules/posts/posts.service';

class UpdateProfileDto {
  @ApiProperty({ required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  async search(@Query('q') query: string, @Request() req: any) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const users = await this.usersService.searchUsers(query.trim(), req.user.userId);

    return users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
    }));
  }

  @Get('suggested')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get suggested users to follow' })
  async suggested(@Request() req: any) {
    const users = await this.usersService.getSuggestedUsers(req.user.userId);

    return users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
    }));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req: any) {
    const profile = await this.usersService.getUserProfile(req.user.userId, req.user.userId);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Body() body: UpdateProfileDto, @Request() req: any) {
    const updated = await this.usersService.updateProfile(req.user.userId, body);

    return {
      userId: updated.id,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
    };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users available for messaging (following)' })
  async getConversations(@Request() req: any) {
    return this.usersService.getFollowing(req.user.userId, req.user.userId);
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by ID' })
  async getUserProfile(@Param('userId') userId: string, @Request() req: any) {
    const profile = await this.usersService.getUserProfile(userId, req.user.userId);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  // ============================================
  // FOLLOW ENDPOINTS
  // ============================================

  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  async followUser(@Param('userId') userId: string, @Request() req: any) {
    try {
      await this.usersService.followUser(req.user.userId, userId);
      return { message: 'User followed successfully' };
    } catch (error: any) {
      if (error?.message === 'Cannot follow yourself') {
        throw new BadRequestException(error.message);
      }
      if (error?.message === 'Already following this user') {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Delete(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollowUser(@Param('userId') userId: string, @Request() req: any) {
    try {
      await this.usersService.unfollowUser(req.user.userId, userId);
      return { message: 'User unfollowed successfully' };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Not following this user');
      }
      throw error;
    }
  }

  @Get(':userId/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user followers' })
  async getFollowers(@Param('userId') userId: string, @Request() req: any) {
    return this.usersService.getFollowers(userId, req.user.userId);
  }

  @Get(':userId/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users that user is following' })
  async getFollowing(@Param('userId') userId: string, @Request() req: any) {
    return this.usersService.getFollowing(userId, req.user.userId);
  }

  // ============================================
  // USER POSTS
  // ============================================

  @Get(':userId/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUserPosts(
    @Param('userId') userId: string,
    @Request() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.postsService.getUserPosts(userId, req.user.userId, cursor, parsedLimit);
  }
}
