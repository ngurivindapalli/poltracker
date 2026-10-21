-- Additive account and community discussion tables.
-- Existing Congress, Quiver, news, and election data are not modified.

CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "google_sub" TEXT,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_users_google_sub_key" ON "app_users"("google_sub");
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

CREATE TABLE "discussion_comments" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "discussion_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discussion_comments_entity_type_entity_id_created_at_idx"
  ON "discussion_comments"("entity_type", "entity_id", "created_at");
CREATE INDEX "discussion_comments_author_id_idx" ON "discussion_comments"("author_id");
CREATE INDEX "discussion_comments_parent_id_idx" ON "discussion_comments"("parent_id");

ALTER TABLE "discussion_comments"
  ADD CONSTRAINT "discussion_comments_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discussion_comments"
  ADD CONSTRAINT "discussion_comments_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "discussion_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "comment_likes_comment_id_user_id_key" ON "comment_likes"("comment_id", "user_id");
CREATE INDEX "comment_likes_user_id_idx" ON "comment_likes"("user_id");

ALTER TABLE "comment_likes"
  ADD CONSTRAINT "comment_likes_comment_id_fkey"
  FOREIGN KEY ("comment_id") REFERENCES "discussion_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_likes"
  ADD CONSTRAINT "comment_likes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
