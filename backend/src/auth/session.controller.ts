import { Controller, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Get()
  async getMySessions(@Request() req: { user: { sub: string } }) {
    return this.sessionService.getUserSessions(req.user.sub);
  }

  @Get('all')
  async getAllSessions(@Request() req: { user: { sub: string; role: string } }) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      return { error: 'Forbidden' };
    }
    return this.sessionService.getAllActiveSessions();
  }

  @Delete(':id')
  async terminateSession(
    @Param('id') id: string,
    @Request() req: { user: { sub: string; role: string } },
  ) {
    return this.sessionService.terminateSession(id);
  }

  @Delete('user/:userId/all')
  async terminateAllUserSessions(
    @Param('userId') userId: string,
    @Request() req: { user: { sub: string; role: string } },
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      return { error: 'Forbidden' };
    }
    return this.sessionService.terminateAllUserSessions(userId);
  }
}
