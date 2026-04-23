-- Create telegram_link_codes table
CREATE TABLE "telegram_link_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "telegram_link_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "telegram_link_codes_code_key" ON "telegram_link_codes"("code");
CREATE INDEX "telegram_link_codes_user_id_idx" ON "telegram_link_codes"("user_id");
CREATE INDEX "telegram_link_codes_code_idx" ON "telegram_link_codes"("code");
