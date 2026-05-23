-- CreateTable
CREATE TABLE "round_participants" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "round_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_round_participant_user_round" ON "round_participants"("user_id", "round_id");

-- AddForeignKey
ALTER TABLE "round_participants" ADD CONSTRAINT "round_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_participants" ADD CONSTRAINT "round_participants_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
