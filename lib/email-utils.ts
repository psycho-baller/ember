import { env } from './constants';

// University-specific email domains
const UNIVERSITY_DOMAINS = {
  uofc: '@ucalgary.ca',
  uw: '@uwaterloo.ca'
} as const;

// University names for error messages
const UNIVERSITY_NAMES = {
  uofc: 'University of Calgary',
  uw: 'University of Waterloo'
} as const;

/**
 * Validates if an email is from the current university based on LOCATION_ID
 * @param email The email address to validate
 * @returns boolean indicating if the email is from the correct university domain
 */
export const isValidUniversityEmail = (email: string): boolean => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Get the current university domain based on LOCATION_ID
  const currentUniversityDomain = UNIVERSITY_DOMAINS[env.LOCATION_ID as keyof typeof UNIVERSITY_DOMAINS];
  
  if (!currentUniversityDomain) {
    return false;
  }

  // Check if the email ends with the correct university domain
  return email.toLowerCase().endsWith(currentUniversityDomain);
};

/**
 * Determines university from email domain
 * @param email The email address
 * @returns university key or null if not recognized
 */
export const getUniversityFromEmail = (email: string): keyof typeof UNIVERSITY_DOMAINS | null => {
  const emailLower = email.toLowerCase();
  
  for (const [university, domain] of Object.entries(UNIVERSITY_DOMAINS)) {
    if (emailLower.endsWith(domain)) {
      return university as keyof typeof UNIVERSITY_DOMAINS;
    }
  }
  
  return null;
};

/**
 * Checks if email is from the current university context
 * @param email The email address
 * @returns boolean indicating if email matches current university
 */
export const isFromCurrentUniversity = (email: string): boolean => {
  const emailUniversity = getUniversityFromEmail(email);
  return emailUniversity === env.LOCATION_ID;
};

/**
 * Gets a user-friendly error message for invalid email domains
 */
export const getEmailValidationError = (email: string): string | null => {
  if (!email) return 'Please enter an email address';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  const currentUniversityName = UNIVERSITY_NAMES[env.LOCATION_ID as keyof typeof UNIVERSITY_NAMES];
  const currentUniversityDomain = UNIVERSITY_DOMAINS[env.LOCATION_ID as keyof typeof UNIVERSITY_DOMAINS];
  
  if (!isValidUniversityEmail(email)) {
    return `Please use your ${currentUniversityName} email address (${currentUniversityDomain})`;
  }
  
  return null;
};
