import { type User, type InsertUser } from "./schema.js";
import { DBStorage } from "./dbStorage.js";

// The single source of truth for the storage interface
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByGithubId(githubId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// In-memory storage for testing or local development
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private githubIdMap: Map<string, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.githubIdMap = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByGithubId(githubId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.githubId === githubId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      id,
      username: insertUser.username!,
      password: insertUser.password ?? null,
      githubId: insertUser.githubId ?? null,
    };
    this.users.set(id, user);
    if (user.githubId) {
      this.githubIdMap.set(user.githubId, user);
    }
    return user;
  }
}

export const storage: IStorage = new DBStorage();
