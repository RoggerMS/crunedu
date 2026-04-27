import { Injectable } from "@nestjs/common";

@Injectable()
export class DocumentsService {
  index() {
    return {
      module: "Apuntes y documentos permitidos",
      status: "scaffolded",
      nextStep: "Implementar DTOs, casos de uso, validaciones y permisos por rol.",
    };
  }
}
