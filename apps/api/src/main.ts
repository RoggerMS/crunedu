import { ValidationPipe } from "@nestjs/common";
import { ApiExceptionFilter } from "./modules/core/api-exception.filter";
import { TimeoutInterceptor } from "./modules/core/timeout.interceptor";
import { RateLimitGuard } from "./modules/core/rate-limit.guard";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ObservabilityInterceptor } from "./modules/observability/observability.interceptor";
import { ObservabilityService } from "./modules/observability/observability.service";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = Number(config.get("PORT") ?? 4000);
  const isProduction = config.get<string>("NODE_ENV") === "production";
  const devBypassAdmin = config.get<string>("DEV_BYPASS_ADMIN_GATES") === "true";
  const devRelaxedAuth = config.get<string>("DEV_RELAXED_AUTH") === "true";
  if (isProduction && (devBypassAdmin || devRelaxedAuth)) {
    throw new Error("Insecure development auth bypass flags cannot be enabled in production.");
  }
  if (devBypassAdmin || devRelaxedAuth) {
    console.warn("[security] Development auth bypass flags are enabled. Never use this in production.");
  }

  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  });
  app.useGlobalGuards(app.get(RateLimitGuard));
  app.useGlobalInterceptors(new TimeoutInterceptor());
  app.useGlobalInterceptors(new ObservabilityInterceptor(app.get(ObservabilityService)));
  app.useGlobalFilters(new ApiExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port, "0.0.0.0");
  console.log(`CrunEdu API running on http://0.0.0.0:${port}/api`);
}

bootstrap();
