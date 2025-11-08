import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      client.userId = payload.sub;

      // Track user's socket (TypeScript assertion: we just assigned it)
      const userId: string = client.userId!;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      console.log(`Client connected: ${client.id} (User: ${client.userId})`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      console.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    }
  }

  @SubscribeMessage('join_thread')
  async handleJoinThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Verify user is participant
      await this.messagesService.getThread(data.threadId, client.userId);

      // Join thread room
      client.join(`thread:${data.threadId}`);

      return { success: true, threadId: data.threadId };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  @SubscribeMessage('leave_thread')
  async handleLeaveThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    client.leave(`thread:${data.threadId}`);
    return { success: true, threadId: data.threadId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string; content?: string; mediaUrl?: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const message = await this.messagesService.sendMessage(
        data.threadId,
        client.userId,
        data.content,
        data.mediaUrl,
      );

      // Broadcast to thread room
      this.server.to(`thread:${data.threadId}`).emit('new_message', message);

      // Get thread participants to send notification to offline users
      const thread = await this.messagesService.getThread(data.threadId, client.userId);

      // Notify other user if they're online
      if (thread.otherUser?.id) {
        this.emitToUser(thread.otherUser.id, 'thread_updated', {
          threadId: data.threadId,
          lastMessage: message,
        });
      }

      return { success: true, message };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.userId) {
      return;
    }

    // Broadcast to thread room except sender
    client.to(`thread:${data.threadId}`).emit('user_typing', {
      threadId: data.threadId,
      userId: client.userId,
    });
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.userId) {
      return;
    }

    // Broadcast to thread room except sender
    client.to(`thread:${data.threadId}`).emit('user_stopped_typing', {
      threadId: data.threadId,
      userId: client.userId,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await this.messagesService.markThreadAsRead(data.threadId, client.userId);

      // Broadcast read status to thread
      this.server.to(`thread:${data.threadId}`).emit('messages_read', {
        threadId: data.threadId,
        userId: client.userId,
      });

      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Helper method to emit event to specific user (all their connected sockets)
   */
  private emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
