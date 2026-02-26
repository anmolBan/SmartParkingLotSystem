/*
  Warnings:

  - You are about to drop the column `capacity` on the `ParkingLot` table. All the data in the column will be lost.
  - Added the required column `spotsPerFloor` to the `ParkingLot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ParkingLot" DROP COLUMN "capacity",
ADD COLUMN     "spotsPerFloor" INTEGER NOT NULL;
