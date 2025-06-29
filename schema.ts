import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Null for OAuth users
  githubId: text("githubId").unique(),
});

// General insert type, used by storage layer
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at").notNull().defaultNow(),
});

export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertSubscriber = typeof subscribers.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
