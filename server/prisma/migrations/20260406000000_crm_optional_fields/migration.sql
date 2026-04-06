-- AlterTable: Make Deal.value and Deal.contactId optional
ALTER TABLE "Deal" ALTER COLUMN "value" DROP NOT NULL;
ALTER TABLE "Deal" ALTER COLUMN "contactId" DROP NOT NULL;

-- AlterTable: Make Activity.contactId and Activity.type optional
ALTER TABLE "Activity" ALTER COLUMN "contactId" DROP NOT NULL;
ALTER TABLE "Activity" ALTER COLUMN "type" DROP NOT NULL;
