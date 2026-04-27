import { Injectable } from "@nestjs/common";

@Injectable()
export class ReportsService {
  index() {
    return {
      module: "Reportes y moderación",
      status: "scaffolded",
      nextStep: "Implementar DTOs, casos de uso, validaciones y permisos por rol.",
    };
  }
}
