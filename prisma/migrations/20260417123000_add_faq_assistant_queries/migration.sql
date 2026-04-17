CREATE TABLE "FaqAssistantQuery" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "sessionId" TEXT,
    "question" TEXT NOT NULL,
    "normalizedQuestion" TEXT NOT NULL,
    "answerPreview" TEXT,
    "source" TEXT NOT NULL,
    "matchedIntent" TEXT,
    "responseMs" INTEGER,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaqAssistantQuery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaqAssistantQuery_createdAt_idx" ON "FaqAssistantQuery"("createdAt");
CREATE INDEX "FaqAssistantQuery_organizationId_createdAt_idx" ON "FaqAssistantQuery"("organizationId", "createdAt");
CREATE INDEX "FaqAssistantQuery_normalizedQuestion_idx" ON "FaqAssistantQuery"("normalizedQuestion");

ALTER TABLE "FaqAssistantQuery"
ADD CONSTRAINT "FaqAssistantQuery_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
