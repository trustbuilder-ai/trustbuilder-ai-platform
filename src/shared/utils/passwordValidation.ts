import { AUTH_CONFIG } from "../../config";

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    feedback.push(`Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`);
  } else {
    score++;
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    feedback.push("Include at least one uppercase letter");
  } else {
    score++;
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    feedback.push("Include at least one lowercase letter");
  } else {
    score++;
  }

  // Check for number
  if (!/\d/.test(password)) {
    feedback.push("Include at least one number");
  } else {
    score++;
  }

  // Check for special character (optional, but increases score)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  }

  // Adjust score to 0-4 range
  score = Math.min(score - 1, 4);
  score = Math.max(score, 0);

  return {
    score,
    feedback,
    isValid: feedback.length === 0,
  };
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
      return "#ff4444"; // Red
    case 1:
      return "#ff8800"; // Orange
    case 2:
      return "#ffbb00"; // Yellow
    case 3:
      return "#88cc00"; // Light green
    case 4:
      return "#00aa00"; // Green
    default:
      return "#cccccc"; // Gray
  }
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
      return "Weak";
    case 1:
      return "Fair";
    case 2:
      return "Good";
    case 3:
      return "Strong";
    case 4:
      return "Very Strong";
    default:
      return "";
  }
}