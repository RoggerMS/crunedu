import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.listen(0);
  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    const seed = Date.now();
    const email = `contract.${seed}@crunedu.local`;
    const password = "CrunEdu123!";

    const register = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, firstName: "Contract", lastName: "Spec" }),
    });
    if (register.status !== 201) {
      throw new Error(`register expected 201 got ${register.status}: ${await register.text()}`);
    }

    const login = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert(login.status === 201, `login expected 201 got ${login.status}`);
    const loginJson = (await login.json()) as { accessToken?: string; user?: { email?: string } };
    assert(typeof loginJson.accessToken === "string", "login response must include accessToken");
    assert(loginJson.user?.email === email, "login response user.email must match test account");

    const posts = await fetch(`${baseUrl}/posts`);
    assert(posts.status === 200, `GET /posts expected 200 got ${posts.status}`);
    const postsJson = (await posts.json()) as { items?: unknown[]; nextCursor?: number | null };
    assert(Array.isArray(postsJson.items), "GET /posts must return items array");
    assert(postsJson.nextCursor === null || typeof postsJson.nextCursor === "number", "GET /posts nextCursor must be number|null");

    const postTitle = `Contrato ${seed}`;
    const createPost = await fetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${loginJson.accessToken}`,
      },
      body: JSON.stringify({ title: postTitle, content: "PublicaciÃ³n creada por la prueba de contrato." }),
    });
    assert(createPost.status === 201, `POST /posts expected 201 got ${createPost.status}`);
    const createdPostJson = (await createPost.json()) as { title?: string };
    assert(createdPostJson.title === postTitle, "POST /posts must preserve the optional title");

    const marketplace = await fetch(`${baseUrl}/marketplace/products`);
    assert(marketplace.status === 200, `GET /marketplace/products expected 200 got ${marketplace.status}`);
    const marketplaceJson = (await marketplace.json()) as { items?: unknown[]; featuredProducts?: unknown[]; context?: unknown; nextCursor?: number | null };
    assert(Array.isArray(marketplaceJson.items), "marketplace items must be array");
    assert(Array.isArray(marketplaceJson.featuredProducts), "marketplace featuredProducts must be array");
    assert(typeof marketplaceJson.context === "object" && marketplaceJson.context !== null, "marketplace context must be object");
    assert(marketplaceJson.nextCursor === null || typeof marketplaceJson.nextCursor === "number", "marketplace nextCursor must be number|null");

    console.log("✅ API contract validation passed.");
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error("❌ API contract validation failed:", error);
  process.exit(1);
});
