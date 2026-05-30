import { Module } from "@nestjs/common";
import { PlatformDataService } from "./platform-data.service";
import { PlatformStoreService } from "./platform-store.service";

@Module({
  providers: [PlatformDataService, PlatformStoreService],
  exports: [PlatformDataService, PlatformStoreService]
})
export class PlatformDataModule {}
