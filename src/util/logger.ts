// @ts-nocheck
type LoggerType = {
  info: (...args: any) => void;
  debug: (...args: any) => void;
  error: (...args: any) => void;
  warn: (...args: any) => void;
};

// TODO(joey.colon): Set up winston logger.
function info(...args: any) {
  console.log(...args);
}

function debug(...args: any) {
  console.log(...args);
}

function error(...args: any) {
  console.log(...args);
}

function warn(...args: any) {
  console.log(...args);
}

const Logger: LoggerType = {
  info,
  debug,
  error,
  warn,
};

export default Logger;
