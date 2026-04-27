import { Controller, Get } from "@nestjs/common";
import { CommunitiesService } from "./communities.service";

@Controller("communities")
export class CommunitiesController {
  constructor(private readonly service: CommunitiesService) {}

  @Get()
  index() {
    return this.service.index();
  }
}
