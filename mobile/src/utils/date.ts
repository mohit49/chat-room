// Date utility functions for mobile

/**
 * Calculate age from birth date
 * @param birthDate - Birth date in YYYY-MM-DD format or Date object
 * @returns Age in years
 */
export const calculateAge = (birthDate: string | Date): number => {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  // Check if date is valid
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age < 0 ? 0 : age;
};

/**
 * Format date to YYYY-MM-DD
 * @param date - Date object
 * @returns Formatted date string
 */
export const formatDateToInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse date string to Date object
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export const parseDateString = (dateString: string): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Check if user meets minimum age requirement (16+)
 * @param birthDate - Birth date
 * @returns True if age >= 16
 */
export const meetsMinimumAge = (birthDate: string | Date): boolean => {
  return calculateAge(birthDate) >= 16;
};

/**
 * Check if user is of legal age (18+)
 * @param birthDate - Birth date
 * @returns True if age >= 18
 */
export const isLegalAge = (birthDate: string | Date): boolean => {
  return calculateAge(birthDate) >= 18;
};

/**
 * Get max date for date picker (16 years ago from today)
 * @returns Date string in YYYY-MM-DD format
 */
export const getMaxBirthDate = (): string => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
  return formatDateToInput(maxDate);
};

/**
 * Get min date for date picker (120 years ago - reasonable max age)
 * @returns Date string in YYYY-MM-DD format
 */
export const getMinBirthDate = (): string => {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  return formatDateToInput(minDate);
};

