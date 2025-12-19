import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const difficultyEnum = pgEnum("difficulty", ["Easy", "Medium", "Hard"]);
export const categoryEnum = pgEnum("category", ["React", "Python", "C++"]);
export const statusEnum = pgEnum("status", ["success, failure"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

// project related tables
export interface ProblemContent {
  timeLimit: string;
  aiConstraints: string;
  longDescription: string;
  dataInterface: string;
  requirements: Array<{
    title: string;
    items: string[];
    isCritical?: boolean;
  }>;
  exampleInteraction?: {
    input: string;
    immediate: string;
    async: {
      delay: string;
      cases: string[];
    };
  };
}

export type codeContent = Record<string, string>;

// 2. Define the Table
export const Problem = pgTable("problems", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  difficulty: difficultyEnum("difficulty").default("Medium").notNull(),
  category: categoryEnum("category").notNull(),
  description: jsonb("description").$type<ProblemContent>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const Submission = pgTable("submissions", {
  id: text("id").primaryKey(),
  problemId: text("problem_id").references(() => Problem.id, {
    onDelete: "cascade",
  }),
  accountId: text("problem_id").references(() => Problem.id, {
    onDelete: "cascade",
  }),
  submittedCode: jsonb("submitted_code").$type<codeContent>().notNull(),
  status: statusEnum("status").notNull(),
  chatHistory: jsonb("chat_history").notNull(),
});
