import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'Systematic Web API',
      timestamp: new Date().toISOString(),
    };
  }
}
