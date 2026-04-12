import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  notifyTransaction(data: {
    type: string;
    amount: number;
    accountName: string;
    branchName: string;
    isReversal?: boolean;
  }) {
    this.server.emit('transaction', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyStatusChange(data: {
    accountName: string;
    branchName: string;
    oldStatus: string;
    newStatus: string;
  }) {
    this.server.emit('statusChange', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyBulkOperation(data: {
    operation: string;
    count: number;
    branchName?: string;
  }) {
    this.server.emit('bulkOperation', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyGeneral(data: { title: string; message: string; type?: string }) {
    this.server.emit('notification', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
