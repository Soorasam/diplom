-- CreateEnum
CREATE TYPE "DriverDocumentType" AS ENUM ('passport', 'license', 'sts', 'vehicle', 'selfie');

-- CreateTable
CREATE TABLE "driver_application_documents" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "type" "DriverDocumentType" NOT NULL,
    "object_key" TEXT NOT NULL,
    "file_name" TEXT,
    "mime_type" TEXT,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_application_documents_application_id_type_key" ON "driver_application_documents"("application_id", "type");

-- AddForeignKey
ALTER TABLE "driver_application_documents" ADD CONSTRAINT "driver_application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "driver_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
