import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CannotCreateEntityIdMapError,
  CannotExecuteNotConnectedError,
  EntityNotFoundError,
  EntityPropertyNotFoundError,
  OptimisticLockVersionMismatchError,
  QueryFailedError,
  TypeORMError,
} from 'typeorm';

import { AppException } from './app.exception';

interface DatabaseDriverError {
  code?: unknown;
  message?: unknown;
  detail?: unknown;
  constraint?: unknown;
  table?: unknown;
  column?: unknown;
  schema?: unknown;
}

interface NormalizedException {
  status: HttpStatus;
  message: string;
  errorCode: string;
  errorDetails: Record<string, unknown>;
}

interface HttpExceptionResponse {
  code?: unknown;
  message?: unknown;
  errors?: unknown;
}

interface DatabaseErrorResult {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const path = request.originalUrl || request.url;
    const timestamp = new Date().toISOString();

    this.logException(exception, request);

    const normalized = this.normalizeException(exception);

    response.status(normalized.status).json({
      success: false,
      statusCode: normalized.status,
      message: normalized.message,
      path,
      timestamp,
      error: {
        code: normalized.errorCode,
        details: normalized.errorDetails,
      },
      data: null,
    });
  }

  // ===========================================================
  // EXCEPTION NORMALIZATION
  // ===========================================================

  private normalizeException(exception: unknown): NormalizedException {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        errorCode: this.getErrorCode(exception),
        message: exception.message,
        errorDetails: this.normalizeErrors(exception.getErrors()),
      };
    }

    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception);
    }

    if (exception instanceof QueryFailedError) {
      const databaseError = this.getDatabaseError(exception);

      return {
        status: this.getDatabaseStatus(exception),
        errorCode: databaseError.code,
        message: databaseError.message,
        errorDetails: databaseError.details,
      };
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        errorCode: 'ENTITY_NOT_FOUND',
        message: 'Record not found',
        errorDetails: {},
      };
    }

    if (exception instanceof EntityPropertyNotFoundError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errorCode: 'ENTITY_PROPERTY_NOT_FOUND',
        message: 'Invalid entity property',
        errorDetails: {
          property: this.extractPropertyName(exception.message),
        },
      };
    }

    if (
      exception instanceof CannotExecuteNotConnectedError ||
      this.isDatabaseConnectionError(exception)
    ) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        errorCode: 'DATABASE_CONNECTION_ERROR',
        message: 'Database service is currently unavailable',
        errorDetails: {},
      };
    }

    if (exception instanceof CannotCreateEntityIdMapError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errorCode: 'ENTITY_OPERATION_ERROR',
        message: 'Entity operation failed',
        errorDetails: {},
      };
    }

    if (exception instanceof OptimisticLockVersionMismatchError) {
      return {
        status: HttpStatus.CONFLICT,
        errorCode: 'OPTIMISTIC_LOCK_ERROR',
        message: 'Data was modified by another request',
        errorDetails: {},
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      errorDetails: {},
    };
  }

  // ===========================================================
  // APPLICATION ERROR CODE
  // ===========================================================

  private getErrorCode(exception: AppException): string {
    return this.toErrorCode(exception.constructor.name);
  }

  // ===========================================================
  // HTTP EXCEPTION
  // ===========================================================

  private normalizeHttpException(
    exception: HttpException,
  ): NormalizedException {
    const status = exception.getStatus();

    const message = this.getHttpExceptionMessage(exception);

    const errorDetails = this.getHttpExceptionErrors(exception);

    if (
      status === 404 &&
      /^Cannot (GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD) /.test(message)
    ) {
      return {
        status,
        errorCode: 'ENDPOINT_NOT_FOUND',
        message: 'Endpoint not found',
        errorDetails: {},
      };
    }

    return {
      status,
      errorCode: this.getHttpErrorCode(exception, status),
      message,
      errorDetails,
    };
  }

  private getHttpErrorCode(exception: HttpException, status: number): string {
    const response = exception.getResponse();

    if (this.isHttpExceptionResponse(response)) {
      if (typeof response.code === 'string') {
        return response.code;
      }

      if (typeof response.code === 'number') {
        return String(response.code);
      }
    }

    return (
      this.toErrorCode(exception.constructor.name) ||
      this.toErrorCode(HttpStatus[status] ?? 'HTTP_ERROR')
    );
  }

  // ===========================================================
  // HTTP EXCEPTION MESSAGE
  // ===========================================================

  private getHttpExceptionMessage(exception: HttpException): string {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (this.isHttpExceptionResponse(exceptionResponse)) {
      const message = exceptionResponse.message;

      if (Array.isArray(message)) {
        return 'Validation failed';
      }

      if (typeof message === 'string') {
        return message;
      }

      if (typeof message === 'number' || typeof message === 'boolean') {
        return String(message);
      }
    }

    return exception.message;
  }

  // ===========================================================
  // HTTP EXCEPTION ERRORS
  // ===========================================================

  private getHttpExceptionErrors(
    exception: HttpException,
  ): Record<string, string> {
    const exceptionResponse = exception.getResponse();

    if (!this.isHttpExceptionResponse(exceptionResponse)) {
      return {};
    }

    if (exceptionResponse.errors !== undefined) {
      return this.normalizeUnknownErrors(exceptionResponse.errors);
    }

    const message = exceptionResponse.message;

    if (Array.isArray(message)) {
      const validationMessages = message.filter(
        (value): value is string => typeof value === 'string',
      );

      return this.parseValidationErrors(validationMessages);
    }

    return {};
  }

  private isHttpExceptionResponse(
    value: unknown,
  ): value is HttpExceptionResponse {
    return typeof value === 'object' && value !== null;
  }

  // ===========================================================
  // VALIDATION ERRORS
  // ===========================================================

  private parseValidationErrors(messages: string[]): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const message of messages) {
      const field = this.extractValidationField(message);

      errors[field] ??= message;
    }

    return errors;
  }

  private extractValidationField(message: string): string {
    return message.trim().split(/\s+/)[0] ?? 'unknown';
  }

  // ===========================================================
  // TYPEORM DATABASE ERROR
  // ===========================================================

  private getDatabaseError(exception: unknown): DatabaseErrorResult {
    const driverError = this.getDriverError(exception);

    const code = this.getDriverErrorCode(driverError);

    switch (code) {
      // =========================================================
      // CLASS 22 — DATA EXCEPTION
      // =========================================================

      case '22000':
        return this.databaseError(
          'DATA_EXCEPTION',
          'The provided data is invalid',
        );

      case '22001':
        return this.databaseError(
          'VALUE_TOO_LONG',
          'One or more fields contain values that are too long',
        );

      case '22002':
      case '22004':
        return this.databaseError(
          'NULL_VALUE_NOT_ALLOWED',
          'A required value was not provided',
        );

      case '22003':
        return this.databaseError(
          'NUMERIC_VALUE_OUT_OF_RANGE',
          'One or more numeric values are outside the allowed range',
        );

      case '22005':
        return this.databaseError(
          'ERROR_IN_ASSIGNMENT',
          'The provided value could not be assigned',
        );

      case '22007':
        return this.databaseError(
          'INVALID_DATETIME_FORMAT',
          'One or more date or time values have an invalid format',
        );

      case '22008':
        return this.databaseError(
          'DATETIME_OUT_OF_RANGE',
          'One or more date or time values are outside the allowed range',
        );

      case '22009':
        return this.databaseError(
          'INVALID_TIME_ZONE',
          'An invalid time zone was provided',
        );

      case '2200B':
        return this.databaseError(
          'ESCAPE_CHARACTER_CONFLICT',
          'The provided value contains an invalid escape sequence',
        );

      case '2200C':
        return this.databaseError(
          'INVALID_USE_OF_ESCAPE_CHARACTER',
          'The provided value contains an invalid escape character',
        );

      case '2200G':
        return this.databaseError(
          'MOST_SPECIFIC_TYPE_MISMATCH',
          'The provided value has an invalid data type',
        );

      case '2200H':
        return this.databaseError(
          'SEQUENCE_GENERATOR_LIMIT',
          'A database sequence has reached its allowed limit',
        );

      case '2200L':
        return this.databaseError(
          'INVALID_XML_DOCUMENT',
          'The provided XML data is invalid',
        );

      case '2200M':
        return this.databaseError(
          'INVALID_XML_CONTENT',
          'The provided XML content is invalid',
        );

      case '2200S':
      case '2200T':
        return this.databaseError(
          'INVALID_JSON_TEXT',
          'The provided JSON data is invalid',
        );

      case '22023':
        return this.databaseError(
          'INVALID_PARAMETER_VALUE',
          'One or more provided parameters are invalid',
        );

      case '22024':
        return this.databaseError(
          'UNTERMINATED_STRING',
          'A provided text value is incomplete',
        );

      case '22025':
        return this.databaseError(
          'INVALID_ESCAPE_SEQUENCE',
          'The provided value contains an invalid escape sequence',
        );

      case '22026':
        return this.databaseError(
          'STRING_LENGTH_MISMATCH',
          'A provided text value has an invalid length',
        );

      case '2202E':
        return this.databaseError(
          'ARRAY_SUBSCRIPT_ERROR',
          'An array value contains an invalid index',
        );

      case '2202F':
        return this.databaseError(
          'ARRAY_ELEMENT_ERROR',
          'An array value contains an invalid element',
        );

      case '22P01':
        return this.databaseError(
          'FLOATING_POINT_EXCEPTION',
          'A numeric operation failed',
        );

      case '22P02':
        return this.databaseError(
          'INVALID_INPUT_SYNTAX',
          'One or more provided values have an invalid format',
        );

      case '22P03':
        return this.databaseError(
          'INVALID_BINARY_REPRESENTATION',
          'One or more provided values have an invalid binary format',
        );

      case '22P04':
        return this.databaseError(
          'BAD_COPY_FILE_FORMAT',
          'The provided file data has an invalid format',
        );

      case '22P05':
        return this.databaseError(
          'UNTRANSLATABLE_CHARACTER',
          'The provided data contains unsupported characters',
        );

      case '22P06':
        return this.databaseError(
          'NONSTANDARD_USE_OF_ESCAPE_CHARACTER',
          'The provided data contains an invalid escape character',
        );

      // =========================================================
      // CLASS 23 — INTEGRITY CONSTRAINT VIOLATION
      // =========================================================

      case '23000':
        return this.databaseError(
          'INTEGRITY_CONSTRAINT_VIOLATION',
          'The operation violates a data integrity rule',
        );

      case '23001':
        return this.databaseError(
          'RESTRICT_VIOLATION',
          'The operation cannot be completed because related data exists',
        );

      case '23502':
        return this.databaseError(
          'NOT_NULL_VIOLATION',
          'A required field was not provided',
        );

      case '23503':
        return this.databaseError(
          'FOREIGN_KEY_CONSTRAINT',
          'The requested operation references data that does not exist',
        );

      case '23505':
        return this.databaseError(
          'DUPLICATE_RECORD',
          'A record with the provided value already exists',
        );

      case '23514':
        return this.databaseError(
          'CHECK_CONSTRAINT_VIOLATION',
          'The provided data violates a validation rule',
        );

      case '23P01':
        return this.databaseError(
          'EXCLUSION_CONSTRAINT_VIOLATION',
          'The provided data conflicts with an existing record',
        );

      // =========================================================
      // CLASS 25 — INVALID TRANSACTION STATE
      // =========================================================

      case '25000':
        return this.databaseError(
          'INVALID_TRANSACTION_STATE',
          'The database transaction is in an invalid state',
        );

      case '25001':
        return this.databaseError(
          'ACTIVE_SQL_TRANSACTION',
          'The requested operation cannot be performed during the current transaction',
        );

      case '25P01':
        return this.databaseError(
          'NO_ACTIVE_SQL_TRANSACTION',
          'No active database transaction exists',
        );

      case '25P02':
        return this.databaseError(
          'TRANSACTION_FAILED',
          'The current database transaction has failed',
        );

      // =========================================================
      // CLASS 26
      // =========================================================

      case '26000':
        return this.databaseError(
          'INVALID_SQL_STATEMENT',
          'The database statement is invalid',
        );

      // =========================================================
      // CLASS 27
      // =========================================================

      case '27000':
        return this.databaseError(
          'TRIGGERED_DATA_CHANGE_VIOLATION',
          'The requested data change was rejected',
        );

      // =========================================================
      // CLASS 28
      // =========================================================

      case '28000':
        return this.databaseError(
          'DATABASE_AUTHORIZATION_ERROR',
          'Database authorization failed',
        );

      case '28P01':
        return this.databaseError(
          'DATABASE_AUTHENTICATION_FAILED',
          'Database authentication failed',
        );

      // =========================================================
      // CLASS 2B
      // =========================================================

      case '2B000':
        return this.databaseError(
          'DEPENDENT_PRIVILEGE_VIOLATION',
          'The requested database operation is not permitted',
        );

      // =========================================================
      // CLASS 2D
      // =========================================================

      case '2D000':
        return this.databaseError(
          'INVALID_TRANSACTION_TERMINATION',
          'The database transaction could not be completed',
        );

      // =========================================================
      // CLASS 2F
      // =========================================================

      case '2F000':
        return this.databaseError(
          'SQL_ROUTINE_ERROR',
          'A database routine failed',
        );

      // =========================================================
      // CLASS 38
      // =========================================================

      case '38000':
        return this.databaseError(
          'EXTERNAL_ROUTINE_ERROR',
          'A database operation failed',
        );

      // =========================================================
      // CLASS 39
      // =========================================================

      case '39000':
        return this.databaseError(
          'EXTERNAL_ROUTINE_INVOCATION_ERROR',
          'A database operation could not be executed',
        );

      // =========================================================
      // CLASS 3B
      // =========================================================

      case '3B000':
        return this.databaseError(
          'SAVEPOINT_ERROR',
          'The database transaction savepoint operation failed',
        );

      // =========================================================
      // CLASS 40
      // =========================================================

      case '40000':
        return this.databaseError(
          'TRANSACTION_ROLLBACK',
          'The database transaction was rolled back',
        );

      case '40001':
        return this.databaseError(
          'TRANSACTION_SERIALIZATION_FAILURE',
          'The operation could not be completed because of a concurrent database change',
        );

      case '40002':
        return this.databaseError(
          'TRANSACTION_INTEGRITY_CONSTRAINT',
          'The database transaction violated an integrity constraint',
        );

      case '40003':
        return this.databaseError(
          'STATEMENT_COMPLETION_UNKNOWN',
          'The database could not confirm whether the operation completed',
        );

      case '40P01':
        return this.databaseError(
          'DEADLOCK_DETECTED',
          'The database operation was interrupted by a deadlock',
        );

      // =========================================================
      // CLASS 42
      // =========================================================

      case '42000':
      case '42601':
        return this.databaseError(
          'SQL_SYNTAX_ERROR',
          'The database operation could not be executed',
        );

      case '42501':
        return this.databaseError(
          'INSUFFICIENT_DATABASE_PRIVILEGES',
          'The database user does not have permission to perform this operation',
        );

      case '42602':
        return this.databaseError(
          'INVALID_NAME',
          'The database operation contains an invalid name',
        );

      case '42622':
        return this.databaseError(
          'NAME_TOO_LONG',
          'A database identifier is too long',
        );

      case '42701':
        return this.databaseError(
          'DUPLICATE_COLUMN',
          'A duplicate database column was detected',
        );

      case '42702':
        return this.databaseError(
          'AMBIGUOUS_COLUMN',
          'The database query contains an ambiguous column',
        );

      case '42703':
        return this.databaseError(
          'UNDEFINED_COLUMN',
          'The requested database column does not exist',
        );

      case '42704':
        return this.databaseError(
          'UNDEFINED_OBJECT',
          'The requested database object does not exist',
        );

      case '42710':
        return this.databaseError(
          'DUPLICATE_OBJECT',
          'The database object already exists',
        );

      case '42712':
        return this.databaseError(
          'DUPLICATE_ALIAS',
          'The database query contains a duplicate alias',
        );

      case '42723':
        return this.databaseError(
          'DUPLICATE_FUNCTION',
          'The database function already exists',
        );

      case '42803':
        return this.databaseError(
          'GROUPING_ERROR',
          'The database query contains an invalid grouping operation',
        );

      case '42804':
        return this.databaseError(
          'DATATYPE_MISMATCH',
          'The provided value has an incompatible data type',
        );

      case '42809':
        return this.databaseError(
          'WRONG_OBJECT_TYPE',
          'The requested database object has an invalid type',
        );

      case '42830':
        return this.databaseError(
          'INVALID_FOREIGN_KEY',
          'The database relationship is invalid',
        );

      case '42846':
        return this.databaseError(
          'CANNOT_COERCE',
          'The provided value cannot be converted to the required type',
        );

      case '42883':
        return this.databaseError(
          'UNDEFINED_FUNCTION',
          'The requested database operation is not available',
        );

      case '42P01':
        return this.databaseError(
          'UNDEFINED_TABLE',
          'The requested database resource does not exist',
        );

      case '42P02':
        return this.databaseError(
          'UNDEFINED_PARAMETER',
          'The database operation contains an invalid parameter',
        );

      // =========================================================
      // CLASS 53
      // =========================================================

      case '53000':
        return this.databaseError(
          'DATABASE_RESOURCE_UNAVAILABLE',
          'The database is temporarily unable to process the request',
        );

      case '53100':
        return this.databaseError(
          'DISK_FULL',
          'The database cannot complete the operation because storage is full',
        );

      case '53200':
        return this.databaseError(
          'OUT_OF_MEMORY',
          'The database cannot complete the operation because it is out of memory',
        );

      case '53300':
        return this.databaseError(
          'TOO_MANY_CONNECTIONS',
          'The database is currently handling too many connections',
        );

      // =========================================================
      // CLASS 54
      // =========================================================

      case '54000':
        return this.databaseError(
          'PROGRAM_LIMIT_EXCEEDED',
          'The database operation exceeds a system limit',
        );

      case '54001':
        return this.databaseError(
          'STATEMENT_TOO_COMPLEX',
          'The database operation is too complex to execute',
        );

      case '54011':
        return this.databaseError(
          'TOO_MANY_COLUMNS',
          'The database operation contains too many columns',
        );

      case '54023':
        return this.databaseError(
          'TOO_MANY_ARGUMENTS',
          'The database operation contains too many arguments',
        );

      // =========================================================
      // CLASS 55
      // =========================================================

      case '55000':
        return this.databaseError(
          'DATABASE_OBJECT_NOT_READY',
          'The requested database operation cannot be performed at this time',
        );

      case '55006':
        return this.databaseError(
          'DATABASE_OBJECT_IN_USE',
          'The requested database resource is currently in use',
        );

      case '55P03':
        return this.databaseError(
          'DATABASE_LOCK_NOT_AVAILABLE',
          'The requested database resource is temporarily locked',
        );

      // =========================================================
      // CLASS 57
      // =========================================================

      case '57000':
        return this.databaseError(
          'OPERATOR_INTERVENTION',
          'The database operation was interrupted',
        );

      case '57014':
        return this.databaseError(
          'QUERY_CANCELED',
          'The database operation was canceled',
        );

      case '57P01':
        return this.databaseError(
          'DATABASE_SHUTDOWN',
          'The database service is shutting down',
        );

      case '57P02':
        return this.databaseError(
          'DATABASE_CRASH',
          'The database service was interrupted',
        );

      case '57P03':
        return this.databaseError(
          'DATABASE_NOT_READY',
          'The database service is temporarily unavailable',
        );

      // =========================================================
      // CLASS 58
      // =========================================================

      case '58000':
        return this.databaseError(
          'DATABASE_SYSTEM_ERROR',
          'A database system error occurred',
        );

      case '58030':
        return this.databaseError(
          'IO_ERROR',
          'A database storage operation failed',
        );

      // =========================================================
      // CLASS 72
      // =========================================================

      case '72000':
        return this.databaseError(
          'SNAPSHOT_FAILURE',
          'The database could not complete the requested operation',
        );

      // =========================================================
      // CLASS F0
      // =========================================================

      case 'F0000':
        return this.databaseError(
          'DATABASE_CONFIGURATION_ERROR',
          'The database configuration is invalid',
        );

      // =========================================================
      // CLASS HV
      // =========================================================

      case 'HV000':
        return this.databaseError(
          'FOREIGN_DATA_ERROR',
          'An external database resource could not be accessed',
        );

      // =========================================================
      // CLASS P0
      // =========================================================

      case 'P0000':
        return this.databaseError(
          'DATABASE_PROCEDURE_ERROR',
          'A database procedure failed',
        );

      case 'P0001':
        return this.databaseError(
          'DATABASE_RAISE_EXCEPTION',
          'The database rejected the operation',
        );

      case 'P0002':
        return this.databaseError(
          'NO_DATA_FOUND',
          'The requested database data was not found',
        );

      case 'P0003':
        return this.databaseError(
          'TOO_MANY_ROWS',
          'The database returned more records than expected',
        );

      // =========================================================
      // CLASS XX
      // =========================================================

      case 'XX000':
        return this.databaseError(
          'DATABASE_INTERNAL_ERROR',
          'An internal database error occurred',
        );

      case 'XX001':
        return this.databaseError(
          'DATA_CORRUPTED',
          'The database encountered corrupted data',
        );

      case 'XX002':
        return this.databaseError(
          'INDEX_CORRUPTED',
          'The database encountered a corrupted index',
        );

      default:
        return this.databaseError(
          'DATABASE_QUERY_ERROR',
          'Database operation failed',
        );
    }
  }

  private databaseError(
    code: string,
    message: string,
  ): {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } {
    return {
      code,
      message,
      details: {},
    };
  }

  // ===========================================================
  // DATABASE STATUS
  // ===========================================================

  private getDatabaseStatus(exception: unknown): HttpStatus {
    const code = this.getDriverErrorCode(this.getDriverError(exception));

    switch (code) {
      case '22000':
      case '22001':
      case '22002':
      case '22003':
      case '22004':
      case '22005':
      case '22007':
      case '22008':
      case '22009':
      case '2200B':
      case '2200C':
      case '2200G':
      case '2200H':
      case '2200L':
      case '2200M':
      case '2200S':
      case '2200T':
      case '22023':
      case '22024':
      case '22025':
      case '22026':
      case '2202E':
      case '2202F':
      case '22P01':
      case '22P02':
      case '22P03':
      case '22P04':
      case '22P05':
      case '22P06':
      case '42804':
      case '42846':
        return HttpStatus.BAD_REQUEST;

      case '23000':
      case '23001':
      case '23502':
      case '23503':
      case '23505':
      case '23514':
      case '23P01':
        return HttpStatus.CONFLICT;

      case '28000':
      case '28P01':
        return HttpStatus.INTERNAL_SERVER_ERROR;

      case '40001':
      case '40002':
      case '40P01':
        return HttpStatus.CONFLICT;

      case '53000':
      case '53100':
      case '53200':
      case '53300':
      case '55000':
      case '55006':
      case '55P03':
      case '57P01':
      case '57P02':
      case '57P03':
        return HttpStatus.SERVICE_UNAVAILABLE;

      case '57014':
        return HttpStatus.REQUEST_TIMEOUT;

      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  // ===========================================================
  // TYPEORM DRIVER ERROR TYPE SAFETY
  // ===========================================================

  private getDriverError(exception: unknown): DatabaseDriverError {
    const driverError: unknown = (exception as QueryFailedError).driverError;

    if (this.isDatabaseDriverError(driverError)) {
      return driverError;
    }

    return {};
  }

  private isDatabaseDriverError(value: unknown): value is DatabaseDriverError {
    return typeof value === 'object' && value !== null;
  }

  private getDriverErrorCode(error: DatabaseDriverError): string {
    return typeof error.code === 'string' ? error.code : '';
  }

  // ===========================================================
  // DATABASE CONNECTION DETECTION
  // ===========================================================

  private isDatabaseConnectionError(exception: unknown): boolean {
    if (!(exception instanceof TypeORMError)) {
      return false;
    }

    const message = exception.message.toLowerCase();

    return (
      message.includes('connection') ||
      message.includes('connect etimedout') ||
      message.includes('econnrefused') ||
      message.includes('connection terminated')
    );
  }

  // ===========================================================
  // NORMALIZE CUSTOM ERRORS
  // ===========================================================

  private normalizeErrors(
    errors: Record<string, unknown>,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(errors).map(([key, value]) => [
        key,
        this.stringifyError(value),
      ]),
    );
  }

  private normalizeUnknownErrors(value: unknown): Record<string, string> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }

    return this.normalizeErrors(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, item]),
      ),
    );
  }
  private stringifyError(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return value.toString();
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Unserializable error]';
      }
    }

    return '[Unknown error value]';
  }

  // ===========================================================
  // PROPERTY EXTRACTION
  // ===========================================================

  private extractPropertyName(message: string): string {
    const match = /property ['"]?([^'"]+)['"]?/i.exec(message);

    return match?.[1] ?? 'unknown';
  }

  // ===========================================================
  // ERROR CODE FORMATTER
  // ===========================================================

  private toErrorCode(value: string): string {
    return value
      .replace(/Exception$/, '')
      .replace(/Error$/, '')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toUpperCase();
  }

  // ===========================================================
  // LOGGING
  // ===========================================================

  private logException(exception: unknown, request: Request): void {
    const error =
      exception instanceof Error ? exception : new Error(String(exception));

    this.logger.error(
      `[${request.method}] ${request.originalUrl || request.url} | ${error.message}`,
      error.stack,
    );
  }
}
