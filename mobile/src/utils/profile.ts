import { UserProfile } from '../types';

/**
 * Check if user profile is complete with mandatory fields
 * Mandatory fields: username, birthDate, age, gender
 */
export function isProfileComplete(profile: UserProfile, username?: string): boolean {
  // Check if username exists
  if (!username || username.trim() === '') {
    return false;
  }

  // Check if birth date exists and is valid
  if (!profile.birthDate || profile.birthDate.trim() === '') {
    return false;
  }

  // Check if age is calculated and valid (16+)
  if (!profile.age || profile.age < 16) {
    return false;
  }

  // Check if gender is selected
  if (!profile.gender || profile.gender.trim() === '') {
    return false;
  }

  return true;
}

/**
 * Get missing profile fields for user guidance
 */
export function getMissingProfileFields(profile: UserProfile, username?: string): string[] {
  const missing: string[] = [];

  if (!username || username.trim() === '') {
    missing.push('Username');
  }

  if (!profile.birthDate || profile.birthDate.trim() === '') {
    missing.push('Birth Date');
  }

  if (!profile.age || profile.age < 16) {
    missing.push('Valid Age (16+ years)');
  }

  if (!profile.gender || profile.gender.trim() === '') {
    missing.push('Gender');
  }

  return missing;
}
