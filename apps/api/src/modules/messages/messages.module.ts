import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [MessagesService, MessagesGateway, PrismaService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
