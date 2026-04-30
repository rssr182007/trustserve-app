// App configuration parameters
export const APP_CONFIG = {
  name: 'TrustServe',
  version: '1.0.0',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  otpExpiryMinutes: parseInt(import.meta.env.VITE_OTP_EXPIRY_MINUTES) || 5,
  maxPhotoUploads: 5,
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSizeMB: 5,
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
};

export default APP_CONFIG;
