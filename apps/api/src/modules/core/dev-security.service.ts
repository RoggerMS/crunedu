import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DevSecurityService {
  constructor(private readonly config: ConfigService) {}

  isDevelopment(): boolean {
    return this.config.get<string>("NODE_ENV") === "development";
  }

  private isEnabled(flagName: string): boolean {
    return this.config.get<string>(flagName) === "true";
  }

  isRelaxedAuthEnabled(): boolean {
    return this.isDevelopment() && this.isEnabled("DEV_RELAXED_AUTH");
  }

  isAdminBypassEnabled(): boolean {
    return this.isDevelopment() && this.isEnabled("DEV_BYPASS_ADMIN_GATES");
  }

  assertAdmin(role: string, message: string): void {
    if (role === "ADMIN" || this.isAdminBypassEnabled()) {
      return;
    }

    throw new ForbiddenException(message);
  }
}
