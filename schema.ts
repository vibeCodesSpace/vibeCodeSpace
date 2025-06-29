import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Null for OAuth users
  googleId: text("googleId").unique(),
});

// Schema for local signup validation (requires password)
export const localUserSchema = createInsertSchema(users, {
    password: z.string().min(6, "Password must be at least 6 characters"),
}).pick({
    username: true,
    password: true,
});

// General insert type, used by storage layer
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
