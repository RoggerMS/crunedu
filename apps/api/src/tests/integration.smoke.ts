import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";

type CheckStatus = "PASS" | "FAIL" | "SKIP";

type CheckResult = {
  area: string;
  name: string;
  status: CheckStatus;
  details?: string;
};

const results: CheckResult[] = [];

function record(area: string, name: string, status: CheckStatus, details?: string) {
  results.push({ area, name, status, details });
  const icon = status === "PASS" ? "✅" : status === "SKIP" ? "⚠️" : "❌";
  const suffix = details ? ` — ${details}` : "";
  console.log(`${icon} [${area}] ${name}${suffix}`);
}

function assertStatus(actual: number, expected: number, context: string) {
  if (actual !== expected) {
    throw new Error(`${context}: expected ${expected}, received ${actual}`);
  }
}

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.listen(0);
  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const seed = Date.now();
  const firstUserEmail = `integration.${seed}.a@crunedu.local`;
  const secondUserEmail = `integration.${seed}.b@crunedu.local`;
  const password = "CrunEdu123!";

  try {
    // Auth register/login
    const registerA = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: firstUserEmail, password, firstName: "Inte", lastName: "A" }),
    });
    assertStatus(registerA.status, 201, "register A");

    const registerB = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: secondUserEmail, password, firstName: "Inte", lastName: "B" }),
    });
    assertStatus(registerB.status, 201, "register B");

    const loginA = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: firstUserEmail, password }),
    });
    assertStatus(loginA.status, 201, "login A");
    const authA = (await loginA.json()) as { accessToken: string };
    const authHeaderA = { authorization: `Bearer ${authA.accessToken}`, "content-type": "application/json" };

    const loginB = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: secondUserEmail, password }),
    });
    assertStatus(loginB.status, 201, "login B");
    const authB = (await loginB.json()) as { accessToken: string };
    const authHeaderB = { authorization: `Bearer ${authB.accessToken}`, "content-type": "application/json" };

    record("auth", "registro y login de 2 usuarios", "PASS");

    const badLogin = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: firstUserEmail, password: "CrunEdu123?" }),
    });
    assertStatus(badLogin.status, 401, "invalid login");
    record("auth", "login inválido devuelve 401", "PASS");

    // Basic posts/comments/questions (smoke preserved)
    const postsBefore = await fetch(`${baseUrl}/posts`);
    assertStatus(postsBefore.status, 200, "list posts");
    record("posts", "GET /posts responde 200", "PASS");

    const createPostNoToken = await fetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "sin token", content: "debe fallar", communityId: 1 }),
    });
    assertStatus(createPostNoToken.status, 401, "create post without token");
    record("auth", "POST /posts sin token devuelve 401", "PASS");

    const createPost = await fetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: authHeaderA,
      body: JSON.stringify({ title: "Post integración", content: "Contenido de prueba para integración", communityId: 1 }),
    });
    assertStatus(createPost.status, 201, "create post");
    const createdPost = (await createPost.json()) as { id: number };
    record("posts", "POST /posts con token crea publicación", "PASS");

    const createCommentRes = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`, {
      method: "POST",
      headers: authHeaderA,
      body: JSON.stringify({ content: "Comentario de integración" }),
    });
    assertStatus(createCommentRes.status, 201, "create comment");

    const listCommentsRes = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`);
    assertStatus(listCommentsRes.status, 200, "list comments");
    record("comments", "crear y listar comentario", "PASS");

    // Follow / friend status coverage
    const userBMe = await fetch(`${baseUrl}/users/me`, { headers: { authorization: `Bearer ${authB.accessToken}` } });
    assertStatus(userBMe.status, 200, "get me B");
    const userB = (await userBMe.json()) as { id: number };

    const followRes = await fetch(`${baseUrl}/follows/${userB.id}`, { method: "POST", headers: authHeaderA });
    assertStatus(followRes.status, 201, "follow user");

    const profileAfterFollow = await fetch(`${baseUrl}/users/${userB.id}`, { headers: { authorization: `Bearer ${authA.accessToken}` } });
    assertStatus(profileAfterFollow.status, 200, "profile after follow");
    const profileJson = (await profileAfterFollow.json()) as { relationship?: { isFollowing?: boolean } };
    if (!profileJson.relationship?.isFollowing) throw new Error("relationship.isFollowing should be true after follow");
    record("follows", "follow + estado de relación en perfil", "PASS");

    const friendsList = await fetch(`${baseUrl}/users/${userB.id}/friends`, { headers: { authorization: `Bearer ${authA.accessToken}` } });
    assertStatus(friendsList.status, 200, "friends list");
    record("follows", "GET /users/:id/friends responde 200", "PASS");

    // Comment limits (8/min user)
    for (let i = 0; i < 7; i += 1) {
      const comment = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`, {
        method: "POST",
        headers: authHeaderA,
        body: JSON.stringify({ content: `Comentario límite ${i}` }),
      });
      assertStatus(comment.status, 201, `comment ${i}`);
    }
    const commentLimit = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`, {
      method: "POST",
      headers: authHeaderA,
      body: JSON.stringify({ content: "Comentario límite final" }),
    });
    assertStatus(commentLimit.status, 429, "comment rate limit");
    record("comments", "rate limit de comentarios devuelve 429", "PASS");

    // Auth rate limit (register: 5/min per IP)
    for (let i = 0; i < 3; i += 1) {
      const register = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: `integration.${seed}.spam${i}@crunedu.local`, password, firstName: "Spam", lastName: `${i}` }),
      });
      assertStatus(register.status, 201, `register rate iteration ${i}`);
    }
    const registerLimit = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `integration.${seed}.spam-limit@crunedu.local`, password, firstName: "Spam", lastName: "Limit" }),
    });
    assertStatus(registerLimit.status, 429, "register rate limit");
    record("auth", "rate limit de registro devuelve 429", "PASS");

    record("questions", "cobertura manual pendiente en este smoke (ver checklist)", "SKIP", "prioridad en auth/posts/comments/follows para MVP");

    const passed = results.filter((item) => item.status === "PASS").length;
    const failed = results.filter((item) => item.status === "FAIL").length;
    const skipped = results.filter((item) => item.status === "SKIP").length;
    console.log(`\nResumen: PASS=${passed} FAIL=${failed} SKIP=${skipped}`);
    console.log("Integration smoke tests passed.");
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  record("suite", "ejecución general", "FAIL", error instanceof Error ? error.message : String(error));
  console.error("Integration smoke tests failed:", error);
  process.exit(1);
});
