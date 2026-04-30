import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    console.log("✅ AppModule dependency graph resolved correctly.");
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error("❌ Failed to resolve AppModule dependencies:", error);
  process.exit(1);
});
