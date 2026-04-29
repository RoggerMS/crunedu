import { Global, Module } from "@nestjs/common";
import { HotReadCacheService } from "./hot-read-cache.service";

@Global()
@Module({ providers: [HotReadCacheService], exports: [HotReadCacheService] })
export class CacheModule {}
