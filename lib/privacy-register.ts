import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

type ProcessingRecordInput = {
  organizationId: string;
  actorUserId?: string | null;
  eventType: string;
  subjectRef?: string | null;
  legalBasis?: string | null;
  payload?: Record<string, unknown> | null;
};

export async function writeProcessingRecord(input: ProcessingRecordInput) {
  try {
    await prisma.processingRecord.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        eventType: input.eventType,
        subjectRef: input.subjectRef ?? null,
        legalBasis: input.legalBasis ?? null,
        payload: (input.payload ?? null) as any,
      },
    });
  } catch (error) {
    logger.warn({
      context: 'processing_register',
      message: 'Failed to persist processing record',
      organizationId: input.organizationId,
      eventType: input.eventType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
