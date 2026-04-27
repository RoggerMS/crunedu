import { Injectable } from "@nestjs/common";

@Injectable()
export class MarketplaceService {
  index() {
    return {
      module: "Tienda básica administrada por CrunEdu",
      status: "scaffolded",
      nextStep: "Implementar DTOs, casos de uso, validaciones y permisos por rol.",
    };
  }
}
