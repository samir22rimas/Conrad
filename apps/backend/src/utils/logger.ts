type LogPayload = Record<string, unknown> | string;

const timestamp = () => new Date().toISOString();

export const logger = {
  info: (payload: LogPayload) => {
    console.info(`[${timestamp()}] INFO`, payload);
  },
  warn: (payload: LogPayload) => {
    console.warn(`[${timestamp()}] WARN`, payload);
  },
  error: (payload: LogPayload) => {
    console.error(`[${timestamp()}] ERROR`, payload);
  },
  debug: (payload: LogPayload) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(`[${timestamp()}] DEBUG`, payload);
    }
  },
};
