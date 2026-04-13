import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2),
  invoices: z.string().min(1),
  message: z.string().optional(),
  phone: z.string().optional(),
  acceptPrivacy: z.literal(true),
  marketingEmail: z.boolean().optional(),
  marketingPhone: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    schema.parse(json);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
