import { Controller, Get } from "@nestjs/common";
import { MarketplaceService } from "./marketplace.service";

@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  @Get()
  index() {
    return this.service.index();
  }
}
