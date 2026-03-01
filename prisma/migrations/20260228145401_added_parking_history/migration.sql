-- CreateTable
CREATE TABLE "ParkingHistory" (
    "id" SERIAL NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "vehicleType" "SpotType" NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3) NOT NULL,
    "parkingFee" DOUBLE PRECISION NOT NULL,
    "parkingSpotNumber" TEXT NOT NULL,

    CONSTRAINT "ParkingHistory_pkey" PRIMARY KEY ("id")
);
