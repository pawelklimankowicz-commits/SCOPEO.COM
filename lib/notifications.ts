import type { NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function createNotification(input: {
  organizationId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  if (input.userId) {
    await prisma.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    });
    return;
  }

  const members = await prisma.membership.findMany({
    where: {
      organizationId: input.organizationId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
    select: { userId: true },
  });

  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((member) => ({
      organizationId: input.organizationId,
      userId: member.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    })),
  });
}
