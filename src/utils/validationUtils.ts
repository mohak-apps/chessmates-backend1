export const validateEmail = (email: string): boolean => {
  // Regular expression for email validation
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  // Trim the email to remove any leading or trailing whitespace
  const trimmedEmail = email.trim();

  // Check if the email is not empty and matches the regex pattern
  if (trimmedEmail && emailRegex.test(trimmedEmail)) {
    return true;
  }

  return false;
};
