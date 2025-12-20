import { createTRPCRouter, publicProcedure } from "../trpc";
import z from "zod";
import { db } from "~/server/db";
import { Problem, categoryEnum } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const problemRouter = createTRPCRouter({
  getProblems: publicProcedure
    .input(
      z
        .object({
          category: z.enum(categoryEnum.enumValues).optional(),
        })
        .optional(),
    )
    .query(({ input }) => {
      const category = input?.category;
      const query = db.select().from(Problem);

      if (category) {
        return query.where(eq(Problem.category, category));
      }

      return query;
    }),
  getProblem: publicProcedure
    .input(
      z.object({
        problemId: z.number(),
      }),
    )
    .query(({ input }) => {
      return db
        .select()
        .from(Problem)
        .where(eq(Problem.id, input.problemId))
        .limit(1)
        .then((rows) => rows[0] ?? null);
    }),
});
