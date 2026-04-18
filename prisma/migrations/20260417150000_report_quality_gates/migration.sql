-- CreateEnum
CREATE TYPE "ReportTotalDisplayBasis" AS ENUM ('LB', 'MB');

-- AlterTable
ALTER TABLE "CarbonProfile" ADD COLUMN "reportTotalDisplayBasis" "ReportTotalDisplayBasis" NOT NULL DEFAULT 'LB';
ALTER TABLE "CarbonProfile" ADD COLUMN "snapshotMinQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 75;
ALTER TABLE "CarbonProfile" ADD COLUMN "snapshotMinScope3CoveragePct" DOUBLE PRECISION NOT NULL DEFAULT 60;
ALTER TABLE "CarbonProfile" ADD COLUMN "auditRiskMissingPctHigh" DOUBLE PRECISION NOT NULL DEFAULT 12;
