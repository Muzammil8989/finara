/**
 * Validation Utility Functions
 * Centralized validation functions for forms and inputs
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validate amount (must be positive number)
 */
export function isValidAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
}

/**
 * Validate PIN code (must be 4-6 digits)
 */
export function isValidPIN(pin: string, minLength: number = 4, maxLength: number = 6): boolean {
  const pinRegex = new RegExp(`^\\d{${minLength},${maxLength}}$`);
  return pinRegex.test(pin);
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength;
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.trim().length <= maxLength;
}

/**
 * Validate date is not in future
 */
export function isNotFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date <= now;
}

/**
 * Validate date is in valid range
 */
export function isDateInRange(dateString: string, minDate?: string, maxDate?: string): boolean {
  const date = new Date(dateString);

  if (minDate && date < new Date(minDate)) {
    return false;
  }

  if (maxDate && date > new Date(maxDate)) {
    return false;
  }

  return true;
}

/**
 * Sanitize string input (remove special characters)
 */
export function sanitizeString(input: string): string {
  return input.replace(/[<>]/g, '');
}

/**
 * Validate number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
