import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthCard from '../components/AuthCard';
import AuthForm from '../components/AuthForm';
import { useValidatedForm } from '../hooks/useValidatedForm';
import { authApi } from '../services/authApi';
import { handleApiError } from '../utils/handleApiError';
import { validateForgotPasswordForm } from '../utils/authValidation';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { values: form, handleBlur, handleChange, validateForm, getFieldError } = useValidatedForm(
    {
      phone: ''
    },
    validateForgotPasswordForm
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.forgotPassword({
        phone: form.phone.trim()
      });
      toast.success('OTP sent successfully! Check your phone.');
      setSubmitted(true);
      setTimeout(() => {
        navigate('/reset-password', { state: { phone: form.phone.trim() } });
      }, 2000);
    } catch (requestError) {
      const errorMessage = handleApiError(requestError, 'Failed to request password reset');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AuthCard
        aside={
          <div className="max-w-md space-y-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">Reset Your Password</p>
            <h2 className="text-5xl font-extrabold leading-tight">Check your phone for the OTP.</h2>
            <p className="text-base leading-7 text-slate-200/80">
              A 6-digit reset OTP has been sent to your phone. You'll be redirected shortly to enter your new password.
            </p>
          </div>
        }
        subtitle="Redirecting to password reset..."
        title="Check your phone"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
            <p className="text-sm font-medium">Password reset OTP sent successfully</p>
            <p className="mt-1 text-xs text-emerald-700">OTP expires in 10 minutes</p>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      aside={
        <div className="max-w-md space-y-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">Reset Your Password</p>
          <h2 className="text-5xl font-extrabold leading-tight">Get back into your account in seconds.</h2>
          <p className="text-base leading-7 text-slate-200/80">
            Enter your Nigerian phone number and we'll send you a secure OTP by SMS to reset your password.
          </p>
        </div>
      }
      subtitle="Enter the phone number associated with your account."
      title="Forgot password?"
    >
      <AuthForm
        error={error}
        fields={[
          {
            label: 'Phone number',
            name: 'phone',
            inputMode: 'numeric',
            maxLength: 11,
            onBlur: handleBlur,
            onChange: handleChange,
            placeholder: '08012345678',
            type: 'tel',
            value: form.phone,
            error: getFieldError('phone')
          }
        ]}
        footer={
          <p className="text-center text-sm text-slate-400">
            Remember your password?{' '}
            <Link className="font-semibold text-accent hover:text-emerald-300" to="/login">
              Sign in instead
            </Link>
          </p>
        }
        isSubmitting={isSubmitting}
        loadingLabel="Sending OTP..."
        onSubmit={handleSubmit}
        submitLabel="Send OTP"
      />
    </AuthCard>
  );
}

export default ForgotPasswordPage;
