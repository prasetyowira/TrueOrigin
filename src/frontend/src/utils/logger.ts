// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  enabledLevels: LogLevel[];
  prefix?: string;
  // developmentOnly is implicitly handled by DFX_NETWORK check now for debug logs
}

const defaultOptions: LoggerOptions = {
  enabledLevels: ['error', 'warn'], 
  prefix: '[TrueOrigin]',
};

class Logger {
  public options: LoggerOptions;
  private isDevelopmentNetwork: boolean;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
    // Use process.env.DFX_NETWORK to determine if it's a development/local network
    this.isDevelopmentNetwork = process.env.DFX_NETWORK !== 'ic';

    // Enable all logs if on a local network (development)
    if (this.isDevelopmentNetwork) {
      this.options.enabledLevels = ['debug', 'info', 'warn', 'error'];
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    // If not on a development network, only allow 'info', 'warn', 'error'
    // 'debug' logs are suppressed on 'ic' network unless enabledLevels is explicitly changed post-construction.
    if (!this.isDevelopmentNetwork && level === 'debug' && !this.options.enabledLevels.includes('debug')) {
        return;
    }

    if (!this.options.enabledLevels.includes(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = this.options.prefix ? `${this.options.prefix} ` : '';
    
    const formattedMessage = `${prefix}[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    const consoleMethod = console[level] || console.log; // Fallback to console.log

    // Print the main message
    consoleMethod(formattedMessage);

    // Process additional arguments
    args.forEach(arg => {
      // Check if the argument is an object (including arrays) suitable for console.table
      // Exclude null as console.table doesn't handle it well.
      if (typeof arg === 'object' && arg !== null) {
        try {
            console.table(arg); // Use console.table for objects and arrays
        } catch (tableError) {
             // Fallback if console.table fails for any reason (e.g., circular structure in some environments)
             consoleMethod('  (arg): ', arg);
        }
      } else {
        // Use the standard console method for other types
        consoleMethod('  (arg): ', arg); 
      }
    });
  }

  enableAllLogs(): void {
    this.options.enabledLevels = ['debug', 'info', 'warn', 'error'];
    if (this.isDevelopmentNetwork) { // Only log this info message if info logs are likely to be on
        this.info('All log levels enabled dynamically.');
    }
  }

  setEnabledLevels(levels: LogLevel[]): void {
    this.options.enabledLevels = levels;
  }
}

// Export a singleton instance
// VITE_DEBUG env variable will control initial enabled levels for all log types in development
// In production, it defaults to 'error' and 'warn' unless VITE_DEBUG is true (less likely for prod builds)
export const logger = new Logger();

// Export the class for creating custom loggers if needed, though singleton is typical
export default Logger; 