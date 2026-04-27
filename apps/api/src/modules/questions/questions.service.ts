import { Injectable } from "@nestjs/common";

@Injectable()
export class QuestionsService {
  index() {
    return {
      module: "Preguntas y respuestas",
      status: "scaffolded",
      nextStep: "Implementar DTOs, casos de uso, validaciones y permisos por rol.",
    };
  }
}
