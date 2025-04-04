
import { createClient, RedisClientType } from 'redis';

interface UserSession {
  devinSessionId: string
  devinSessionUrl: string
  lastInteractionTime: Date
}

class RedisSessionStore {
  private client: RedisClientType;
  private connected: boolean = false;
  private readonly keyPrefix = 'devin-telegram:session:';

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.connect();
  }

  private async connect() {
    if (!this.connected) {
      try {
        await this.client.connect();
        this.connected = true;
        console.log('Connected to Redis');
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
      }
    }
  }

  async setSession(userId: number, sessionData: UserSession): Promise<void> {
    await this.connect();
    const key = this.keyPrefix + userId;
    await this.client.set(key, JSON.stringify(sessionData));
  }

  async getSession(userId: number): Promise<UserSession | undefined> {
    await this.connect();
    const key = this.keyPrefix + userId;
    const data = await this.client.get(key);
    
    if (!data) return undefined;
    
    try {
      const parsedData = JSON.parse(data);
      parsedData.lastInteractionTime = new Date(parsedData.lastInteractionTime);
      return parsedData;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return undefined;
    }
  }

  async hasActiveSession(userId: number): Promise<boolean> {
    await this.connect();
    const key = this.keyPrefix + userId;
    return await this.client.exists(key) === 1;
  }

  async removeSession(userId: number): Promise<boolean> {
    await this.connect();
    const key = this.keyPrefix + userId;
    return await this.client.del(key) === 1;
  }

  async getAllSessions(): Promise<Map<number, UserSession>> {
    await this.connect();
    const sessions = new Map<number, UserSession>();
    
    let cursor = 0;
    do {
      const scanResult = await this.client.scan(cursor, {
        MATCH: `${this.keyPrefix}*`,
        COUNT: 100
      });
      
      cursor = scanResult.cursor;
      
      for (const key of scanResult.keys) {
        const userId = parseInt(key.replace(this.keyPrefix, ''), 10);
        const session = await this.getSession(userId);
        if (session) {
          sessions.set(userId, session);
        }
      }
    } while (cursor !== 0);
    
    return sessions;
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

export const sessionStore = new RedisSessionStore();
