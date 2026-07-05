import pino, { type Level, type Logger, type LoggerOptions } from 'pino';
import pretty from 'pino-pretty';

export type { Logger };

// Runtime list of pino's levels, needed to build the config's `z.enum`.
// `satisfies` keeps it in sync with pino's `Level` type.
export const LOG_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] as const satisfies readonly Level[];

export const LOG_FORMATS = ['json', 'pretty'] as const;
export type LogFormat = (typeof LOG_FORMATS)[number];

export function createLogger({ level, format }: { level: Level; format: LogFormat }): Logger {
  const options: LoggerOptions = {
    level,
    base: undefined, // drop the default `pid` and `hostname` fields
    timestamp: pino.stdTimeFunctions.isoTime, // human-readable ISO time instead of epoch ms
    serializers: { err: pino.stdSerializers.err }, // serialize errors logged under the `err` key
  };

  // pino-pretty as a stream (not a worker-thread transport) for reliable behaviour under Bun.
  return format === 'pretty' ? pino(options, pretty({ colorize: true })) : pino(options);
}
