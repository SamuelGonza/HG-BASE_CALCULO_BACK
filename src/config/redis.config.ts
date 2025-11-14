import { createClient, RedisClientType } from 'redis';
import { GLOBAL_ENV } from '@/shared/constants';
import { ResponseError } from '@/utils/erros';

export class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType | null = null;

  private constructor() {
    this.connect();
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  private async connect() {
    try {
      if (!GLOBAL_ENV.REDIS_HOST || !GLOBAL_ENV.REDIS_PORT) {
        console.warn('⚠️  Redis no configurado. Variables REDIS_HOST y REDIS_PORT requeridas.');
        return;
      }

      const redisUrl = GLOBAL_ENV.REDIS_PASSWORD
        ? `redis://:${GLOBAL_ENV.REDIS_PASSWORD}@${GLOBAL_ENV.REDIS_HOST}:${GLOBAL_ENV.REDIS_PORT}`
        : `redis://${GLOBAL_ENV.REDIS_HOST}:${GLOBAL_ENV.REDIS_PORT}`;

      this.client = createClient({
        url: redisUrl
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Conectado a Redis');
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Error al conectar a Redis:', error);
      // No lanzar error para que la app pueda funcionar sin Redis
      this.client = null;
    }
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }

  public async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  public isConnected(): boolean {
    return this.client !== null;
  }
}

export const redisConnection = RedisConnection.getInstance();

