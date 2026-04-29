import { Controller, Get, Query } from "@nestjs/common";
import { SearchQueryDto } from "./dto/search-query.dto";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  index(@Query() query: SearchQueryDto) {
    return this.service.index(query);
  }
}
