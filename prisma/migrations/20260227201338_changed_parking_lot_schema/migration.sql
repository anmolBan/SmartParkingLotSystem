/*
  Warnings:

  - The values [TRUCK,HANDICAPPED] on the enum `SpotType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `spotsPerFloor` on the `ParkingLot` table. All the data in the column will be lost.
  - Added the required column `floorsReservedForBikes` to the `ParkingLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floorsReservedForCompact` to the `ParkingLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floorsReservedForTrucks` to the `ParkingLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spotsPerFloorReservedForBikes` to the `ParkingLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spotsPerFloorReservedForCompact` to the `ParkingLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spotsPerFloorReservedForTrucks` to the `ParkingLot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SpotType_new" AS ENUM ('BIKE', 'COMPACT', 'LARGE');
ALTER TABLE "ParkingSpot" ALTER COLUMN "spotType" TYPE "SpotType_new" USING ("spotType"::text::"SpotType_new");
ALTER TYPE "SpotType" RENAME TO "SpotType_old";
ALTER TYPE "SpotType_new" RENAME TO "SpotType";
DROP TYPE "public"."SpotType_old";
COMMIT;

-- AlterTable
ALTER TABLE "ParkingLot" DROP COLUMN "spotsPerFloor",
ADD COLUMN     "floorsReservedForBikes" INTEGER NOT NULL,
ADD COLUMN     "floorsReservedForCompact" INTEGER NOT NULL,
ADD COLUMN     "floorsReservedForTrucks" INTEGER NOT NULL,
ADD COLUMN     "spotsPerFloorReservedForBikes" INTEGER NOT NULL,
ADD COLUMN     "spotsPerFloorReservedForCompact" INTEGER NOT NULL,
ADD COLUMN     "spotsPerFloorReservedForTrucks" INTEGER NOT NULL;
