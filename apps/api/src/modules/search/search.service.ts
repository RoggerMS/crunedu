import { Injectable } from "@nestjs/common";

@Injectable()
export class SearchService {
  index() {
    return {
      module: "Buscador básico del MVP",
      status: "scaffolded",
      nextStep: "Implementar DTOs, casos de uso, validaciones y permisos por rol.",
    };
  }
}
