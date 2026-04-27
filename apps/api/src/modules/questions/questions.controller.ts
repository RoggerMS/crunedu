import { Controller, Get } from "@nestjs/common";
import { QuestionsService } from "./questions.service";

@Controller("questions")
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Get()
  index() {
    return this.service.index();
  }
}
