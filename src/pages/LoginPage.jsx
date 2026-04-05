import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthCard from '../components/AuthCard';
import AuthForm from '../components/AuthForm';
import { useValidatedForm } from '../hooks/useValidatedForm';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authApi';
import { validateLoginForm } from '../utils/authValidation';
import { handleApiError } from '../utils/handleApiError';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { values: form, handleBlur, handleChange, validateForm, getFieldError } = useValidatedForm(
    {
      phone: '',
      password: ''
    },
    validateLoginForm
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
      const response = await authApi.login({
        phone: form.phone.trim(),
        password: form.password
      });

      login(response.data.data);
      toast.success('Welcome back! Logged in successfully.');
      navigate(location.state?.from?.pathname || '/chats', { replace: true });
    } catch (requestError) {
      const errorMessage = handleApiError(requestError, 'Login failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      aside={
        <div className="max-w-md space-y-6 text-white">
          <h2 className="text-5xl font-extrabold leading-tight">Welcome back 👋</h2>
          <p className="text-base leading-7 text-slate-200/80">
            Jump back into your conversations, stay connected with friends, and never miss a message.
          </p>
          <p className="text-sm leading-6 text-slate-300">
            Your chats are right where you left them.
          </p>
        </div>
      }
      subtitle="Enter your phone number and password to access your conversations."
      title="Welcome back"
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
          },
          {
            label: 'Password',
            name: 'password',
            onBlur: handleBlur,
            onChange: handleChange,
            placeholder: 'Enter your password',
            type: 'password',
            value: form.password,
            error: getFieldError('password')
          }
        ]}
        footer={
          <div className="space-y-3">
            <p className="text-center text-sm text-slate-400">
              <Link className="font-semibold text-accent hover:text-emerald-300" to="/forgot-password">
                Forgot password?
              </Link>
            </p>
            <p className="text-center text-sm text-slate-400">
              New here?{' '}
              <Link className="font-semibold text-accent hover:text-emerald-300" to="/signup">
                Create an account
              </Link>
            </p>
          </div>
        }
        isSubmitting={isSubmitting}
        loadingLabel="Signing in..."
        onSubmit={handleSubmit}
        statusMessage="Signing you in..."
        submitLabel="Sign in"
      />
    </AuthCard>
  );
}

export default LoginPage;
