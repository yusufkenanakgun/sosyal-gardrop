import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { BootstrapCheckService } from './bootstrap-check.service';
import * as path from 'path';
import * as fs from 'fs';
import { WardrobeModule } from './wardrobe/wardrobe.module';
import { FilesModule } from './modules/files/files.module'; // ✅ eklendi

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  REDIS_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  WEATHER_API: z.string().min(1),
});

/**
 * Repo kökünü, kaynak dosyanın konumundan (apps/api/src) hesapla.
 * __dirname -> apps/api/dist (runtime) veya apps/api/src (ts-node)
 * Bu yüzden iki kademe yukarı çıkıp (.., ..) sonra bir kademe daha çıkıyoruz (..):
 * apps/api/src -> apps/api -> apps -> (repo kökü)
 */
const repoRoot = path.resolve(__dirname, '..', '..', '..');

// Olası .env konum adayları
const candidates = [
  path.join(repoRoot, '.env'), // repo kökü .env
  path.join(repoRoot, '.env.local'), // repo kökü .env.local (varsa)
  path.join(process.cwd(), '.env'), // çalışma dizini .env (pnpm behavior)
  path.join(process.cwd(), '.env.local'),
  path.join(__dirname, '.env'), // apps/api/dist/.env (varsa)
  path.join(__dirname, '.env.local'),
];

// Yalnızca var olan dosyaları geçir
const existingEnvFiles = candidates.filter((p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
});

// Başlangıçta hangi dosyaları okuduğumuzu logla (teşhis için)
if (existingEnvFiles.length === 0) {
  console.warn('⚠️  No .env files found among candidates:', candidates);
} else {
  console.log('✅ Using env files:', existingEnvFiles);
}

@Module({
  imports: [
    AuthModule,
    WardrobeModule,
    ConfigModule.forRoot({
      isGlobal: true,
      // Hiçbiri yoksa envFilePath vermiyoruz; sadece process.env kullanılır.
      envFilePath: existingEnvFiles.length ? existingEnvFiles : undefined,
      ignoreEnvFile: existingEnvFiles.length === 0 ? true : false,
      expandVariables: true,
      validate: (env) => {
        const parsed = envSchema.safeParse(env);
        if (!parsed.success) {
          console.error('❌ Invalid env:', parsed.error.flatten().fieldErrors);
          throw new Error('Invalid environment variables');
        }
        return parsed.data;
      },
    }),
    HealthModule,
    FilesModule, // ✅ eklendi
  ],
  controllers: [AppController],
  providers: [AppService, BootstrapCheckService],
})
export class AppModule {}
