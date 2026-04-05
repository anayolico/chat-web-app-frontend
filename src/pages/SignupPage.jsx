import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthCard from '../components/AuthCard';
import AuthForm from '../components/AuthForm';
import { useValidatedForm } from '../hooks/useValidatedForm';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authApi';
import { handleApiError } from '../utils/handleApiError';
import { validateSignupForm } from '../utils/authValidation';

function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { values: form, handleBlur, handleChange, validateForm, getFieldError } = useValidatedForm(
    {
      name: '',
      phone: '',
      password: '',
      confirmPassword: ''
    },
    validateSignupForm
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.signup({
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password
      });
      login(response.data.data);
      toast.success('Account created successfully! Welcome to Chat Sphere.');
      navigate('/chats', { replace: true });
    } catch (requestError) {
      const errorMessage = handleApiError(requestError, 'Signup failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      aside={
        <div className="max-w-lg space-y-7 text-white">
          <h2 className="text-5xl font-extrabold leading-tight">Create your account ✨</h2>
          <p className="text-base leading-7 text-slate-200/80">
            Start chatting, share moments, and connect with friends easily.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-panel p-5">
              <p className="text-sm font-semibold text-white">Easy to use</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Simple and smooth chatting experience</p>
            </div>
            <div className="glass-panel p-5">
              <p className="text-sm font-semibold text-white">Stay connected</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Send messages, images, and voice notes instantly</p>
            </div>
          </div>
        </div>
      }
      subtitle="One quick signup and you're ready to chat."
      title="Join our community"
    >
      <AuthForm
        error={error}
        fields={[
          {
            label: 'Full name',
            name: 'name',
            onBlur: handleBlur,
            onChange: handleChange,
            placeholder: 'Ada Lovelace',
            type: 'text',
            value: form.name,
            error: getFieldError('name')
          },
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
          },
          {
            label: 'Password',
            name: 'password',
            onBlur: handleBlur,
            onChange: handleChange,
            placeholder: 'Choose a secure password',
            type: 'password',
            value: form.password,
            error: getFieldError('password')
          },
          {
            label: 'Confirm password',
            name: 'confirmPassword',
            onBlur: handleBlur,
            onChange: handleChange,
            placeholder: 'Confirm your password',
            type: 'password',
            value: form.confirmPassword,
            error: getFieldError('confirmPassword')
          }
        ]}
        footer={
          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link className="font-semibold text-accent hover:text-emerald-300" to="/login">
              Sign in
            </Link>
          </p>
        }
        isSubmitting={isSubmitting}
        loadingLabel="Creating account..."
        onSubmit={handleSubmit}
        statusMessage="Creating your account..."
        submitLabel="Create account"
      />
    </AuthCard>
  );
}

export default SignupPage;
