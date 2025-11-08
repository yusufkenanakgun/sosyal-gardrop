import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';
import type { Request } from 'express';

@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  private getUserId(req: Request): string {
    const userId = String(req.user?.userId ?? req.user?.id ?? req.user?.sub ?? '');
    if (!userId) throw new UnauthorizedException('Unauthorized');
    return userId;
  }

  /**
   * GET /messages/threads
   * Get all threads for the current user
   */
  @Get('threads')
  async getThreads(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.messagesService.getUserThreads(userId);
  }

  /**
   * POST /messages/threads
   * Create or get existing thread with another user
   */
  @Post('threads')
  async createThread(@Req() req: Request, @Body() dto: CreateThreadDto) {
    const userId = this.getUserId(req);
    return this.messagesService.createOrGetThread(userId, dto.recipientId);
  }

  /**
   * GET /messages/threads/:threadId
   * Get thread details
   */
  @Get('threads/:threadId')
  async getThread(@Req() req: Request, @Param('threadId') threadId: string) {
    const userId = this.getUserId(req);
    return this.messagesService.getThread(threadId, userId);
  }

  /**
   * GET /messages/threads/:threadId/messages
   * Get messages in a thread (with pagination)
   */
  @Get('threads/:threadId/messages')
  async getMessages(
    @Req() req: Request,
    @Param('threadId') threadId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.getUserId(req);
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.messagesService.getThreadMessages(threadId, userId, cursor, parsedLimit);
  }

  /**
   * POST /messages/threads/:threadId/messages
   * Send a message in a thread
   */
  @Post('threads/:threadId/messages')
  async sendMessage(
    @Req() req: Request,
    @Param('threadId') threadId: string,
    @Body() dto: SendMessageDto,
  ) {
    const userId = this.getUserId(req);
    return this.messagesService.sendMessage(threadId, userId, dto.content, dto.mediaUrl);
  }

  /**
   * POST /messages/threads/:threadId/read
   * Mark thread as read
   */
  @Post('threads/:threadId/read')
  async markAsRead(@Req() req: Request, @Param('threadId') threadId: string) {
    const userId = this.getUserId(req);
    return this.messagesService.markThreadAsRead(threadId, userId);
  }
}
