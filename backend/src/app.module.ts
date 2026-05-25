import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CatalogModule } from './catalog/catalog.module';
import { HealthController } from './health.controller';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TicketsModule } from './tickets/tickets.module';
import { DriverApplicationsModule } from './driver-applications/driver-applications.module';
import { CoordinatorModule } from './coordinator/coordinator.module';
import { EmployeeModule } from './employee/employee.module';
import { LogisticsModule } from './logistics/logistics.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StorageModule,
    LogisticsModule,
    PrismaModule,
    AuthModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    ProfileModule,
    AdminModule,
    NotificationsModule,
    TicketsModule,
    DriverApplicationsModule,
    CoordinatorModule,
    EmployeeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
