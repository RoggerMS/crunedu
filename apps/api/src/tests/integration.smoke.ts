import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.listen(0);
  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const email = `integration.${Date.now()}@crunedu.local`;
  const password = "CrunEdu123!";

  const registerRes = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, firstName: "Inte", lastName: "Gration" }),
  });
  if (!registerRes.ok) throw new Error(`register failed: ${registerRes.status}`);

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) throw new Error(`login failed: ${loginRes.status}`);
  const loginJson = (await loginRes.json()) as { accessToken: string };
  const authHeader = { authorization: `Bearer ${loginJson.accessToken}`, "content-type": "application/json" };

  const postsBefore = await fetch(`${baseUrl}/posts`);
  if (!postsBefore.ok) throw new Error(`list posts failed: ${postsBefore.status}`);

  const createPostRes = await fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({ title: "Post integración", content: "Contenido de prueba para integración", communityId: 1 }),
  });
  if (!createPostRes.ok) throw new Error(`create post failed: ${createPostRes.status}`);
  const createdPost = (await createPostRes.json()) as { id: number };

  const createCommentRes = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({ content: "Comentario de integración" }),
  });
  if (!createCommentRes.ok) throw new Error(`create comment failed: ${createCommentRes.status}`);

  const listCommentsRes = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`);
  if (!listCommentsRes.ok) throw new Error(`list comments failed: ${listCommentsRes.status}`);

  const createQuestionRes = await fetch(`${baseUrl}/questions`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({ title: "Pregunta integración", content: "¿Cómo validar el módulo de preguntas en integración?", communityId: 1 }),
  });
  if (!createQuestionRes.ok) throw new Error(`create question failed: ${createQuestionRes.status}`);

  const listQuestionsRes = await fetch(`${baseUrl}/questions`);
  if (!listQuestionsRes.ok) throw new Error(`list questions failed: ${listQuestionsRes.status}`);

  console.log("Integration smoke tests passed.");
  await app.close();
}

run().catch((error) => {
  console.error("Integration smoke tests failed:", error);
  process.exit(1);
});
