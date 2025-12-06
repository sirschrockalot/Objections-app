/**
 * Environment variable validation
 * Ensures all required environment variables are set at startup
 */

interface EnvVar {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const requiredEnvVars: EnvVar[] = [
  {
    name: 'MONGODB_URI',
    required: true,
    validator: (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
    errorMessage: 'MONGODB_URI must be a valid MongoDB connection string',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    errorMessage: 'JWT_SECRET must be at least 32 characters long',
  },
  {
    name: 'JWT_EXPIRES_IN',
    required: false,
    defaultValue: '15m',
  },
  {
    name: 'JWT_REFRESH_EXPIRES_IN',
    required: false,
    defaultValue: '7d',
  },
];

/**
 * Validates all required environment variables
 * Throws an error if any required variable is missing or invalid
 */
export function validateEnvVars(): void {
  const errors: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];
    
    if (envVar.required && !value) {
      errors.push(`Required environment variable ${envVar.name} is not set`);
      continue;
    }
    
    // Use default value if provided and value is not set
    const finalValue = value || envVar.defaultValue;
    
    if (finalValue && envVar.validator) {
      if (!envVar.validator(finalValue)) {
        errors.push(envVar.errorMessage || `${envVar.name} is invalid`);
      }
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment variable validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Gets an environment variable with validation
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  
  if (!value) {
    throw new Error(`Environment variable ${name} is not set and no default value provided`);
  }
  
  return value;
}

