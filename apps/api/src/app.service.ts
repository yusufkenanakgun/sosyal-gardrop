import { Injectable } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from './modules/files/files.module';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FilesModule,
    // ... diğer modüller
  ],
})
export class AppModule {}