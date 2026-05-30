import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [TenantsModule],
  controllers: [AuthController]
})
export class AuthModule {}
