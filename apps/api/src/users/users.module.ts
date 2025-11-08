import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AvatarController } from './avatar.controller';
import { PrismaService } from '../prisma.service';
import { FilesModule } from '../modules/files/files.module';
import { PostsModule } from '../modules/posts/posts.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [FilesModule, forwardRef(() => PostsModule), NotificationsModule],
  controllers: [UsersController, AvatarController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
