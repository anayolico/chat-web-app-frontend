import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthCard from '../components/AuthCard';
import AuthForm from '../components/AuthForm';
import { useValidatedForm } from '../hooks/useValidatedForm';
import { authApi } from '../services/authApi';
import { handleApiError } from '../utils/handleApiError';
import { validateOtpVerificationForm, validateResetPasswordForm } from '../utils/authValidation';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneFromState = location.state?.phone || '';
  const verificationForm = useValidatedForm(
    {
      phone: phoneFromState,
      otp: ''
    },
    validateOtpVerificationForm
  );
  const passwordForm = useValidatedForm(
    {
      newPassword: '',
      confirmPassword: ''
    },
    validateResetPasswordForm
  );
  const [verifiedPhone, setVerifiedPhone] = useState(phoneFromState);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('verify');
  const [success, setSuccess] = useState(false);

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');

    if (!verificationForm.validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.verifyResetOtp({
        phone: verificationForm.values.phone.trim(),
        otp: verificationForm.values.otp.trim()
      });
      setVerifiedPhone(verificationForm.values.phone.trim());
      setVerifiedOtp(verificationForm.values.otp.trim());
      toast.success('OTP verified successfully!');
      setStep('reset');
    } catch (requestError) {
      const errorMessage = handleApiError(requestError, 'Invalid or expired OTP');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');

    if (!passwordForm.validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.resetPassword({
        phone: verifiedPhone,
        otp: verifiedOtp,
        newPassword: passwordForm.values.newPassword
      });
      toast.success('Password reset successfully! You can now log in.');
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (requestError) {
      const errorMessage = handleApiError(requestError, 'Failed to reset password');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthCard
        aside={
          <div className="max-w-md space-y-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">Password Reset Successful</p>
            <h2 className="text-5xl font-extrabold leading-tight">You're all set!</h2>
            <p className="text-base leading-7 text-slate-200/80">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>
        }
        subtitle="Redirecting to login..."
        title="Success!"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
            <p className="text-sm font-medium">Password reset successfully</p>
            <p className="mt-1 text-xs text-emerald-700">You will be redirected to login shortly</p>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (step === 'verify') {
    return (
      <AuthCard
        aside={
          <div className="max-w-md space-y-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">Verify Reset OTP</p>
            <h2 className="text-5xl font-extrabold leading-tight">Enter your 6-digit OTP.</h2>
            <p className="text-base leading-7 text-slate-200/80">
              We've sent an SMS OTP to your phone. Enter it below to verify your identity.
            </p>
          </div>
        }
        subtitle="Enter the 6-digit OTP we sent to your phone number."
        title="Verify OTP"
      >
        <AuthForm
          error={error}
          fields={[
            {
              label: 'Phone number',
              name: 'phone',
              inputMode: 'numeric',
              maxLength: 11,
              onBlur: verificationForm.handleBlur,
              onChange: verificationForm.handleChange,
              placeholder: '08012345678',
              type: 'tel',
              value: verificationForm.values.phone,
              error: verificationForm.errors.phone
            },
            {
              label: 'OTP',
              name: 'otp',
              inputMode: 'numeric',
              maxLength: 6,
              onBlur: verificationForm.handleBlur,
              onChange: verificationForm.handleChange,
              placeholder: 'Enter 6-digit OTP',
              type: 'text',
              value: verificationForm.values.otp,
              error: verificationForm.errors.otp
            }
          ]}
          footer={
            <p className="text-center text-sm text-slate-400">
              <Link className="font-semibold text-accent hover:text-emerald-300" to="/forgot-password">
                Request another OTP
              </Link>
            </p>
          }
          isSubmitting={isSubmitting}
          loadingLabel="Verifying OTP..."
          onSubmit={handleVerifyOtp}
          submitLabel="Verify OTP"
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      aside={
        <div className="max-w-md space-y-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">Create New Password</p>
          <h2 className="text-5xl font-extrabold leading-tight">Set a strong password.</h2>
          <p className="text-base leading-7 text-slate-200/80">
            Create a new password that's at least 6 characters long so your account stays secure.
          </p>
        </div>
      }
      subtitle="Enter your new password below."
      title="Create new password"
    >
      <AuthForm
        error={error}
        fields={[
          {
            label: 'New password',
            name: 'newPassword',
            onBlur: passwordForm.handleBlur,
            onChange: passwordForm.handleChange,
            placeholder: 'Enter new password',
            type: 'password',
            value: passwordForm.values.newPassword,
            error: passwordForm.errors.newPassword
          },
          {
            label: 'Confirm password',
            name: 'confirmPassword',
            onBlur: passwordForm.handleBlur,
            onChange: passwordForm.handleChange,
            placeholder: 'Confirm new password',
            type: 'password',
            value: passwordForm.values.confirmPassword,
            error: passwordForm.errors.confirmPassword
          }
        ]}
        footer={
          <p className="text-center text-sm text-slate-400">
            <Link className="font-semibold text-accent hover:text-emerald-300" to="/login">
              Back to login
            </Link>
          </p>
        }
        isSubmitting={isSubmitting}
        loadingLabel="Resetting password..."
        onSubmit={handleResetPassword}
        submitLabel="Reset password"
      />
    </AuthCard>
  );
}

export default ResetPasswordPage;
