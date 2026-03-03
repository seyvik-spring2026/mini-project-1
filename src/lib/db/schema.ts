import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const candidates = sqliteTable("candidates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  twitterId: text("twitter_id").unique(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio").default(""),
  avatarUrl: text("avatar_url").default(""),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  tweetCount: integer("tweet_count").default(0),
  accountCreatedAt: text("account_created_at"),
  // Scoring
  overallScore: real("overall_score").default(0),
  builderScore: real("builder_score").default(0),
  authenticityScore: real("authenticity_score").default(0),
  growthScore: real("growth_score").default(0),
  redFlagScore: real("red_flag_score").default(0),
  // Growth metadata
  engagementGrowthRatio: real("engagement_growth_ratio"),
  engagementTrend: text("engagement_trend"),
  engagementDataPoints: integer("engagement_data_points").default(0),
  // Pipeline
  pipelineStage: text("pipeline_stage").default("discovered"),
  notes: text("notes").default(""),
  // Timestamps
  createdAt: text("created_at").default("sql:CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("sql:CURRENT_TIMESTAMP"),
  lastScoredAt: text("last_scored_at"),
});

export const tweets = sqliteTable("tweets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tweetId: text("tweet_id").unique(),
  candidateId: integer("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  likes: integer("likes").default(0),
  retweets: integer("retweets").default(0),
  replies: integer("replies").default(0),
  views: integer("views").default(0),
  isRetweet: integer("is_retweet", { mode: "boolean" }).default(false),
  isReply: integer("is_reply", { mode: "boolean" }).default(false),
  createdAt: text("created_at"),
});

export const searchQueries = sqliteTable("search_queries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  query: text("query").notNull(),
  queryType: text("query_type").default("Latest"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default("sql:CURRENT_TIMESTAMP"),
});

export const scoringWeights = sqliteTable("scoring_weights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  builderWeight: real("builder_weight").default(0.4),
  authenticityWeight: real("authenticity_weight").default(0.3),
  growthWeight: real("growth_weight").default(0.2),
  redFlagWeight: real("red_flag_weight").default(0.1),
  updatedAt: text("updated_at").default("sql:CURRENT_TIMESTAMP"),
});

export const searchRuns = sqliteTable("search_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  queryId: integer("query_id").references(() => searchQueries.id),
  queryText: text("query_text").notNull(),
  candidatesFound: integer("candidates_found").default(0),
  newCandidates: integer("new_candidates").default(0),
  status: text("status").default("pending"),
  startedAt: text("started_at").default("sql:CURRENT_TIMESTAMP"),
  completedAt: text("completed_at"),
});

// Type exports
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type Tweet = typeof tweets.$inferSelect;
export type NewTweet = typeof tweets.$inferInsert;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type ScoringWeights = typeof scoringWeights.$inferSelect;
export type SearchRun = typeof searchRuns.$inferSelect;
