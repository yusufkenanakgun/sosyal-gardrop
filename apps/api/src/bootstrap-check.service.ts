import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BootstrapCheckService {
  private readonly logger = new Logger(BootstrapCheckService.name);
  constructor(private cfg: ConfigService) {
    this.logger.log(`DB: ${this.cfg.get('DATABASE_URL')}`);
    this.logger.log(`Redis: ${this.cfg.get('REDIS_URL')}`);
    this.logger.log(
      `S3: ${this.cfg.get('S3_ENDPOINT')} bucket=${this.cfg.get('S3_BUCKET')}`,
    );
  }
}
