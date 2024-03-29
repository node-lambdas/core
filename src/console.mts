const ansiCodes = {
  error: '\u001b[33;1m',
  info: '\u001b[34;1m',
  log: '\u001b[37;1m',
  reset: '\u001b[0m',
};

export interface ColorConsole {
  write(type: 'log' | 'info' | 'error', ...args: any[]): void;
  log(...args: any[]): void;
  info(...args: any[]): void;
  error(...args: any[]): void;
  debug(...args: any[]): void;
}

export const Console: ColorConsole = {
  write(type, ...values) {
    const output = type === 'error' ? console.error : console.log;
    output(ansiCodes[type], ...values, ansiCodes.reset);
  },

  log(...args) {
    Console.write('log', ...args);
  },

  info(...args) {
    Console.write('info', ...args);
  },

  error(...args) {
    Console.write('error', ...args);
  },
  debug(...args: any[]) {
    if (process.env.DEBUG) {
      console.error(...args);
    }
  }
};
