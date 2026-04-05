export const NIGERIAN_PHONE_REGEX = /^(070|080|081|090|091)\d{8}$/;
export const OTP_REGEX = /^\d{6}$/;

const PASSWORD_MIN_LENGTH = 6;

const getTrimmedValue = (value) => value.trim();

export function validateName(name) {
  const trimmedName = getTrimmedValue(name);

  if (!trimmedName) {
    return 'Name is required';
  }

  if (trimmedName.length < 5) {
    return 'Name must be at least 5 characters';
  }

  return '';
}

export function validateNigerianPhone(phone) {
  const trimmedPhone = getTrimmedValue(phone);

  if (!trimmedPhone) {
    return 'Phone number is required';
  }

  if (!NIGERIAN_PHONE_REGEX.test(trimmedPhone)) {
    return 'Enter a valid phone number';
  }

  return '';
}

export function validatePassword(password, label = 'Password') {
  if (!password.trim()) {
    return `${label} is required`;
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `${label} must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }

  return '';
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword.trim()) {
    return 'Confirm password is required';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return '';
}

export function validateOtp(otp) {
  const trimmedOtp = getTrimmedValue(otp);

  if (!trimmedOtp) {
    return 'OTP is required';
  }

  if (!OTP_REGEX.test(trimmedOtp)) {
    return 'OTP must be exactly 6 digits';
  }

  return '';
}

export function validateSignupForm(values) {
  return {
    name: validateName(values.name),
    phone: validateNigerianPhone(values.phone),
    password: validatePassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword)
  };
}

export function validateLoginForm(values) {
  return {
    phone: validateNigerianPhone(values.phone),
    password: validatePassword(values.password)
  };
}

export function validateForgotPasswordForm(values) {
  return {
    phone: validateNigerianPhone(values.phone)
  };
}

export function validateOtpVerificationForm(values) {
  return {
    phone: validateNigerianPhone(values.phone),
    otp: validateOtp(values.otp)
  };
}

export function validateResetPasswordForm(values) {
  return {
    newPassword: validatePassword(values.newPassword, 'New password'),
    confirmPassword: validateConfirmPassword(values.newPassword, values.confirmPassword)
  };
} 
