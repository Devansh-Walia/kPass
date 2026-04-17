-- CreateEnum
CREATE TYPE "StudentLocation" AS ENUM ('DIT', 'MALSI');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "location" "StudentLocation" DEFAULT 'DIT';
