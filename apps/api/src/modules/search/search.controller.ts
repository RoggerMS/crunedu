import { Controller, Get } from "@nestjs/common";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  index() {
    return this.service.index();
  }
}
