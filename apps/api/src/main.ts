import { ValidationPipe } from "@nestjs/common";
import { ApiExceptionFilter } from "./modules/core/api-exception.filter";
import { TimeoutInterceptor } from "./modules/core/timeout.interceptor";
import { RateLimitGuard } from "./modules/core/rate-limit.guard";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ObservabilityInterceptor } from "./modules/observability/observability.interceptor";
import { ObservabilityService } from "./modules/observability/observability.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = Number(config.get("PORT") ?? 4000);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  });
  app.useGlobalGuards(new RateLimitGuard());
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

  await app.listen(port);
  console.log(`CrunEdu API running on http://localhost:${port}/api`);
}

bootstrap();
