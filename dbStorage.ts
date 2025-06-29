import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, type User, type InsertUser } from "./schema.js";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage.js";

export class DBStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    const client = postgres(process.env.DATABASE_URL);
    this.db = drizzle(client);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByGithubId(githubId: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.githubId, githubId))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createSubscriber(
    insertSubscriber: InsertSubscriber,
  ): Promise<Subscriber> {
    const result = await this.db
      .insert(subscribers)
      .values(insertSubscriber)
      .returning();
    return result[0];
  }
}
