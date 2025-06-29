import { type User, type InsertUser } from "./schema.js";
import { DBStorage } from "./dbStorage.js";

// The single source of truth for the storage interface
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// In-memory storage for testing or local development
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private googleIdMap: Map<string, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.googleIdMap = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      id,
      username: insertUser.username!,
      password: insertUser.password ?? null,
      googleId: insertUser.googleId ?? null,
    };
    this.users.set(id, user);
    if (user.googleId) {
      this.googleIdMap.set(user.googleId, user);
    }
    return user;
  }
}

export const storage: IStorage = new DBStorage();
