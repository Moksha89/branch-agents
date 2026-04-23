-- Add telegram_chat_id to users
ALTER TABLE "users" ADD COLUMN "telegram_chat_id" TEXT;

-- Create OTPs table
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "otps_user_id_idx" ON "otps"("user_id");
CREATE INDEX "otps_expires_at_idx" ON "otps"("expires_at");
