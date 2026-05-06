-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('READ', 'WRITE', 'FULL');

-- CreateTable
CREATE TABLE "branch_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'READ',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branch_access_user_id_idx" ON "branch_access"("user_id");

-- CreateIndex
CREATE INDEX "branch_access_branch_id_idx" ON "branch_access"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_access_user_id_branch_id_key" ON "branch_access"("user_id", "branch_id");

-- AddForeignKey
ALTER TABLE "branch_access" ADD CONSTRAINT "branch_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_access" ADD CONSTRAINT "branch_access_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
