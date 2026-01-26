// ============================================
// Logger Service
// ============================================

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  action: string;
  userId?: string;
  userRole?: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  error?: string;
  stack?: string;
}

/**
 * Логирование важных действий в системе
 */
export class Logger {
  /**
   * Логирование информационных событий
   */
  static info(action: string, details?: { userId?: string; userRole?: string; resourceType?: string; resourceId?: string; [key: string]: any }, ip?: string) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      action,
      ...details,
      ip,
    };
    console.log(`[INFO] ${logEntry.timestamp} - ${action}`, logEntry);
  }

  /**
   * Логирование предупреждений
   */
  static warn(action: string, details?: { userId?: string; userRole?: string; resourceType?: string; resourceId?: string; [key: string]: any }, ip?: string) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      action,
      ...details,
      ip,
    };
    console.warn(`[WARN] ${logEntry.timestamp} - ${action}`, logEntry);
  }

  /**
   * Логирование ошибок
   */
  static error(action: string, error: Error | any, details?: { userId?: string; userRole?: string; resourceType?: string; resourceId?: string; [key: string]: any }, ip?: string) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      action,
      ...details,
      error: error.message || String(error),
      stack: error.stack,
      ip,
    };
    console.error(`[ERROR] ${logEntry.timestamp} - ${action}`, logEntry);
  }

  /**
   * Логирование создания ресурса
   */
  static logCreate(resourceType: string, resourceId: string, userId?: string, userRole?: string, ip?: string) {
    this.info(`CREATE ${resourceType.toUpperCase()}`, {
      userId,
      userRole,
      resourceType,
      resourceId,
    }, ip);
  }

  /**
   * Логирование обновления ресурса
   */
  static logUpdate(resourceType: string, resourceId: string, userId?: string, userRole?: string, changes?: any, ip?: string) {
    this.info(`UPDATE ${resourceType.toUpperCase()}`, {
      userId,
      userRole,
      resourceType,
      resourceId,
      changes,
    }, ip);
  }

  /**
   * Логирование удаления ресурса
   */
  static logDelete(resourceType: string, resourceId: string, userId?: string, userRole?: string, ip?: string) {
    this.warn(`DELETE ${resourceType.toUpperCase()}`, {
      userId,
      userRole,
      resourceType,
      resourceId,
    }, ip);
  }

  /**
   * Логирование попытки доступа без авторизации
   */
  static logUnauthorizedAccess(resource: string, ip?: string) {
    this.warn(`UNAUTHORIZED ACCESS ATTEMPT`, {
      resource,
    }, ip);
  }

  /**
   * Логирование ошибки аутентификации
   */
  static logAuthError(action: string, details?: any, ip?: string) {
    this.warn(`AUTH ERROR: ${action}`, details, ip);
  }

  /**
   * Логирование успешной аутентификации
   */
  static logAuthSuccess(userId: string, userRole: string, ip?: string) {
    this.info(`AUTH SUCCESS`, {
      userId,
      userRole,
    }, ip);
  }
}

