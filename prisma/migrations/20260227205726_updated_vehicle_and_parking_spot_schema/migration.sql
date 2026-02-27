/*
  Warnings:

  - A unique constraint covering the columns `[parkingSpotId]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `parkingSpotId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "parkingSpotId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_parkingSpotId_key" ON "Vehicle"("parkingSpotId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_parkingSpotId_fkey" FOREIGN KEY ("parkingSpotId") REFERENCES "ParkingSpot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
