import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CatalogService } from './catalog.service';

@Injectable()
export class CatalogSchedulerService {
  private readonly logger = new Logger(CatalogSchedulerService.name);

  constructor(private readonly catalog: CatalogService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async closeDueRoundsBySchedule() {
    try {
      await this.catalog.processDueEmergencyCloses();
    } catch (error) {
      this.logger.error(
        'Не удалось обработать закрытие сборов по расписанию',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
