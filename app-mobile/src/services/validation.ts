export interface ValidationRule {
  validate: (value: any, context?: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
  firstError?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
}

export class Validator {
  static email(message = 'Please enter a valid email address'): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true; // Let required rule handle empty values
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value.trim());
      },
      message,
    };
  }

  static required(message = 'This field is required'): ValidationRule {
    return {
      validate: (value: any) => {
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== null && value !== undefined;
      },
      message,
    };
  }

  static minLength(length: number, message?: string): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true; // Let required rule handle empty values
        return value.length >= length;
      },
      message: message || `Must be at least ${length} characters long`,
    };
  }

  static maxLength(length: number, message?: string): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true;
        return value.length <= length;
      },
      message: message || `Must be no more than ${length} characters long`,
    };
  }

  static min(minValue: number, message?: string): ValidationRule {
    return {
      validate: (value: number) => {
        if (value === null || value === undefined) return true;
        return Number(value) >= minValue;
      },
      message: message || `Must be at least ${minValue}`,
    };
  }

  static max(maxValue: number, message?: string): ValidationRule {
    return {
      validate: (value: number) => {
        if (value === null || value === undefined) return true;
        return Number(value) <= maxValue;
      },
      message: message || `Must be no more than ${maxValue}`,
    };
  }

  static pattern(regex: RegExp, message = 'Invalid format'): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true;
        return regex.test(value);
      },
      message,
    };
  }

  static matches(fieldName: string, message?: string): ValidationRule {
    return {
      validate: (value: string, context: any) => {
        if (!value || !context) return true;
        return value === context[fieldName];
      },
      message: message || `Must match ${fieldName}`,
    };
  }

  static oneOf(options: any[], message?: string): ValidationRule {
    return {
      validate: (value: any) => {
        return options.includes(value);
      },
      message: message || `Must be one of: ${options.join(', ')}`,
    };
  }

  static url(message = 'Please enter a valid URL'): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message,
    };
  }

  static phone(message = 'Please enter a valid phone number'): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true;
        // Basic international phone number regex
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(value.replace(/[\s-()]/g, ''));
      },
      message,
    };
  }

  static password(message = 'Password must be at least 8 characters with letters and numbers'): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true;
        // At least 8 characters, contains letters and numbers
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(value);
      },
      message,
    };
  }

  static numeric(message = 'Must be a valid number'): ValidationRule {
    return {
      validate: (value: string | number) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value)) && isFinite(Number(value));
      },
      message,
    };
  }

  static integer(message = 'Must be a whole number'): ValidationRule {
    return {
      validate: (value: string | number) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = Number(value);
        return Number.isInteger(num);
      },
      message,
    };
  }

  static positive(message = 'Must be a positive number'): ValidationRule {
    return {
      validate: (value: string | number) => {
        if (value === '' || value === null || value === undefined) return true;
        return Number(value) > 0;
      },
      message,
    };
  }

  static date(message = 'Please enter a valid date'): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true;
        const date = new Date(value);
        return !isNaN(date.getTime());
      },
      message,
    };
  }

  static futureDate(message = 'Date must be in the future'): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true;
        const date = new Date(value);
        return date > new Date();
      },
      message,
    };
  }

  static pastDate(message = 'Date must be in the past'): ValidationRule {
    return {
      validate: (value: string) => {
        if (!value) return true;
        const date = new Date(value);
        return date < new Date();
      },
      message,
    };
  }

  static custom(validatorFn: (value: any, context?: any) => boolean | string, message?: string): ValidationRule {
    return {
      validate: validatorFn,
      message,
    };
  }

  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: { [key: string]: string } = {};

    for (const [field, rules] of Object.entries(schema)) {
      const fieldRules = Array.isArray(rules) ? rules : [rules];
      const value = data[field];

      for (const rule of fieldRules) {
        const result = rule.validate(value, data);

        if (typeof result === 'string') {
          // Custom error message from validator
          errors[field] = result;
          break;
        } else if (result === false) {
          // Use rule's default message
          errors[field] = rule.message || 'Invalid value';
          break;
        }
        // result === true, continue to next rule
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstError: Object.values(errors)[0],
    };
  }
}

// Pre-defined validation schemas for common forms
export const ValidationSchemas = {
  login: {
    email: [Validator.required('Email is required'), Validator.email()],
    password: Validator.required('Password is required'),
  },

  register: {
    email: [Validator.required('Email is required'), Validator.email()],
    password: [
      Validator.required('Password is required'),
      Validator.password(),
    ],
    confirmPassword: [
      Validator.required('Please confirm your password'),
      Validator.matches('password', 'Passwords do not match'),
    ],
    role: [
      Validator.required('Please select a role'),
      Validator.oneOf(['CREATOR', 'BRAND'], 'Invalid role selected'),
    ],
  },

  deal: {
    title: [
      Validator.required('Deal title is required'),
      Validator.maxLength(100, 'Title must be 100 characters or less'),
    ],
    creatorEmail: [
      Validator.required('Creator email is required'),
      Validator.email(),
    ],
    description: Validator.maxLength(1000, 'Description must be 1000 characters or less'),
  },

  milestone: {
    title: [
      Validator.required('Milestone title is required'),
      Validator.maxLength(100, 'Title must be 100 characters or less'),
    ],
    amount: [
      Validator.required('Amount is required'),
      Validator.numeric(),
      Validator.positive('Amount must be positive'),
    ],
    description: Validator.maxLength(500, 'Description must be 500 characters or less'),
    dueDate: Validator.date(),
  },

  profile: {
    email: [Validator.required('Email is required'), Validator.email()],
    firstName: Validator.maxLength(50, 'First name must be 50 characters or less'),
    lastName: Validator.maxLength(50, 'Last name must be 50 characters or less'),
    bio: Validator.maxLength(500, 'Bio must be 500 characters or less'),
  },

  changePassword: {
    currentPassword: Validator.required('Current password is required'),
    newPassword: [
      Validator.required('New password is required'),
      Validator.password(),
    ],
    confirmPassword: [
      Validator.required('Please confirm your new password'),
      Validator.matches('newPassword', 'Passwords do not match'),
    ],
  },
};

// Convenience function
export function validateForm(data: any, schema: ValidationSchema): ValidationResult {
  return Validator.validate(data, schema);
}