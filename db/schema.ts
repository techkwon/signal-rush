import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const signalRushScores = sqliteTable("signal_rush_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  fragments: integer("fragments").notNull(),
  grade: text("grade").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
