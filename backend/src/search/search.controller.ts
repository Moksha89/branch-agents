import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(@Query('q') query: string, @Request() req: { user: { sub: string; role: string; branchAccess: { branchId: string; accessLevel: string }[] } }) {
    return this.searchService.search(query, req.user);
  }
}
