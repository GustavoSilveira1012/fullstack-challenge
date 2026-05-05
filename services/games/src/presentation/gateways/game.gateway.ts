import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: any) {
    this.logger.log('Client connected');
  }

  handleDisconnect(client: any) {
    this.logger.log('Client disconnected');
  }

  @SubscribeMessage('AUTH')
  handleAuth(@MessageBody() data: any) {
    this.logger.log('Client authenticated via WebSocket');
    return { status: 'ok', message: 'Authenticated' };
  }

  /**
   * Broadcast an event to all connected clients
   * @param event The event name
   * @param data The payload
   */
  broadcast(event: string, data: any) {
    if (this.server && this.server.clients) {
      let payload = { ...data, type: event };
      
      if (event === 'multiplier:update') {
        payload.type = 'MULTIPLIER_UPDATE';
      } else if (event === 'round:betting') {
        payload.type = 'ROUND_STATE_CHANGE';
        payload.state = 'BETTING';
      } else if (event === 'round:started') {
        payload.type = 'ROUND_STATE_CHANGE';
        payload.state = 'RUNNING';
      } else if (event === 'round:crashed') {
        payload.type = 'ROUND_CRASHED';
      }
      
      const message = JSON.stringify(payload);
      
      this.server.clients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
          client.send(message);
        }
      });
    }
  }
}
