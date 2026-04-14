type LogLevel = 'info' | 'warn' | 'error';

type LogPayload = Record<string, unknown> & {
  message: string;
  context?: string;
};

function write(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  const serialized = JSON.stringify(entry);
  if (level === 'error') {
    console.error(serialized);
    return;
  }
  if (level === 'warn') {
    console.warn(serialized);
    return;
  }
  console.log(serialized);
}

export const logger = {
  info(payload: LogPayload) {
    write('info', payload);
  },
  warn(payload: LogPayload) {
    write('warn', payload);
  },
  error(payload: LogPayload) {
    write('error', payload);
  },
};
