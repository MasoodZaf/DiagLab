import { Module } from "@nestjs/common";
import { AlertsModule } from "./alerts/alerts.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { MobileSyncModule } from "./mobile-sync/mobile-sync.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OrdersModule } from "./orders/orders.module";
import { OperationsModule } from "./operations/operations.module";
import { PatientsModule } from "./patients/patients.module";
import { ReportsModule } from "./reports/reports.module";
import { ResultsModule } from "./results/results.module";
import { SamplesModule } from "./samples/samples.module";
import { TenantsModule } from "./tenants/tenants.module";
import { WorkflowModule } from "./workflow/workflow.module";

@Module({
  imports: [
    AlertsModule,
    AuthModule,
    InvoicesModule,
    MobileSyncModule,
    NotificationsModule,
    OrdersModule,
    OperationsModule,
    PatientsModule,
    ReportsModule,
    ResultsModule,
    SamplesModule,
    TenantsModule,
    WorkflowModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
