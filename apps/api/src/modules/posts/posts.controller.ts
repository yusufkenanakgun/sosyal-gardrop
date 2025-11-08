import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  async createPost(@Body() body: CreatePostDto, @Request() req: any) {
    // Validate at least one content
    if (!body.caption && (!body.mediaUrls || body.mediaUrls.length === 0)) {
      throw new BadRequestException('Post must have caption or media');
    }

    return this.postsService.createPost(req.user.userId, body);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feed for current user' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Pagination cursor (ISO date)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of posts to fetch (default 20)' })
  async getFeed(
    @Request() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.postsService.getFeed(req.user.userId, cursor, parsedLimit);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved posts' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getSavedPosts(
    @Request() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.postsService.getSavedPosts(req.user.userId, cursor, parsedLimit);
  }

  @Get(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get post by ID' })
  async getPost(@Param('postId') postId: string, @Request() req: any) {
    return this.postsService.getPostById(postId, req.user.userId);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete post' })
  async deletePost(@Param('postId') postId: string, @Request() req: any) {
    return this.postsService.deletePost(postId, req.user.userId);
  }

  @Post(':postId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on post' })
  async toggleLike(@Param('postId') postId: string, @Request() req: any) {
    return this.postsService.toggleLike(postId, req.user.userId);
  }

  @Get(':postId/likes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users who liked post' })
  async getPostLikes(@Param('postId') postId: string, @Request() req: any) {
    return this.postsService.getPostLikes(postId, req.user.userId);
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add comment to post' })
  async addComment(
    @Param('postId') postId: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    if (!body.content || !body.content.trim()) {
      throw new BadRequestException('Comment content is required');
    }
    return this.postsService.addComment(postId, req.user.userId, body.content.trim());
  }

  @Get(':postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comments for post' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPostComments(
    @Param('postId') postId: string,
    @Request() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.postsService.getPostComments(postId, req.user.userId, cursor, parsedLimit);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete comment' })
  async deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.postsService.deleteComment(commentId, req.user.userId);
  }

  @Post(':postId/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle save post' })
  async toggleSave(@Param('postId') postId: string, @Request() req: any) {
    return this.postsService.toggleSave(postId, req.user.userId);
  }
}
