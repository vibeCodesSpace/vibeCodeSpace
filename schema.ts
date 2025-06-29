import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Null for OAuth users
  googleId: text("googleId").unique(),
});

// General insert type, used by storage layer
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
