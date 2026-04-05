// Reusable authentication form component
// This component renders a form with dynamic fields, validation errors,
// submit button, and optional footer content

import PasswordInput from './PasswordInput';
import Spinner from './Spinner';

function AuthForm({ fields, onSubmit, submitLabel, footer, error, isSubmitting, loadingLabel, statusMessage }) {
  return (
    <form aria-busy={isSubmitting ? 'true' : 'false'} className="space-y-5" onSubmit={onSubmit}>
      {/* Render each form field */}
      {fields.map(({ label, error: fieldError, id, ...inputProps }) => (
        <label className="block space-y-2" htmlFor={id || inputProps.name} key={inputProps.name}>
          <span className="text-sm font-medium text-slate-200">{label}</span>
          {inputProps.type === 'password' ? (
            <PasswordInput
              aria-describedby={fieldError ? `${id || inputProps.name}-error` : undefined}
              aria-invalid={fieldError ? 'true' : 'false'}
              id={id || inputProps.name}
              {...inputProps}
              className={`input-field ${fieldError ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
              disabled={isSubmitting || inputProps.disabled}
            />
          ) : (
            <input
              aria-describedby={fieldError ? `${id || inputProps.name}-error` : undefined}
              aria-invalid={fieldError ? 'true' : 'false'}
              id={id || inputProps.name}
              {...inputProps}
              className={`input-field ${fieldError ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
              disabled={isSubmitting || inputProps.disabled}
            />
          )}
          {/* Field-specific error message */}
          {fieldError ? (
            <p className="text-sm text-rose-300" id={`${id || inputProps.name}-error`}>
              {fieldError}
            </p>
          ) : null}
        </label>
      ))}

      {/* General form error message */}
      {error ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {/* Submit button with loading state */}
      <button aria-disabled={isSubmitting ? 'true' : 'false'} className="primary-button w-full flex items-center justify-center gap-2" disabled={isSubmitting} type="submit">
        {isSubmitting && <Spinner />}
        {isSubmitting ? (loadingLabel || 'Please wait...') : submitLabel}
      </button>

      {isSubmitting && statusMessage ? <p aria-live="polite" className="text-center text-sm text-slate-400">{statusMessage}</p> : null}

      {/* Optional footer content (e.g., links to other pages) */}
      {footer ? <div>{footer}</div> : null}
    </form>
  );
}

export default AuthForm;
