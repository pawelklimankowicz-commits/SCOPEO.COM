if (!(process.env.DATABASE_URL || '').trim()) {
  throw new Error('DATABASE_URL is required');
}

export {};
