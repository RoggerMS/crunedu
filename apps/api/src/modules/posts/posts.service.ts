import { Injectable } from "@nestjs/common";

@Injectable()
export class PostsService {
  index() {
    return {
      module: "Publicaciones del feed",
      status: "scaffolded",
      nextStep: "Implementar DTOs, casos de uso, validaciones y permisos por rol.",
    };
  }
}
