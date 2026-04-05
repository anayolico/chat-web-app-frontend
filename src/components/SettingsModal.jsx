import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { disconnectSocket } from '../services/socket';
import { authApi } from '../services/authApi';
import { handleApiError } from '../utils/handleApiError';

const formatFileSize = (file) => `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

function SettingsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { auth, logout, updateUser } = useAuth();
  const [name, setName] = useState(auth?.user?.name || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(auth?.user?.name || '');
    setSelectedFile(null);
    setError('');
    setIsSubmitting(false);
    setIsDeleteConfirmOpen(false);
    setDeleteError('');
    setIsDeletingAccount(false);
  }, [auth?.user?.name, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const previewUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }

    return auth?.user?.profilePic || '';
  }, [auth?.user?.profilePic, selectedFile]);

  useEffect(
    () => () => {
      if (selectedFile && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl, selectedFile]
  );

  if (!isOpen) {
    return null;
  }

  const initials = (name || auth?.user?.name || 'U').trim().slice(0, 1).toUpperCase();

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setSelectedFile(nextFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());

      if (selectedFile) {
        formData.append('profileImage', selectedFile);
      }

      const response = await authApi.updateProfile(formData);
      updateUser(response.data.data.user);
      onClose();
    } catch (requestError) {
      setError(handleApiError(requestError, 'Unable to update profile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setIsDeletingAccount(true);

    try {
      await authApi.deleteAccount();
      disconnectSocket();
      logout();
      onClose();
      navigate('/login', { replace: true });
    } catch (requestError) {
      setDeleteError(handleApiError(requestError, 'Unable to delete account'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div className="glass-panel relative w-full max-w-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(17,197,138,0.25),transparent_52%),radial-gradient(circle_at_top_right,rgba(255,122,89,0.22),transparent_42%)]" />

        <div className="relative border-b border-white/10 px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Settings</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Profile preferences</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Update how your profile appears across conversations. Your phone number stays locked to your account.
              </p>
            </div>
            <button className="secondary-button px-3 py-2" onClick={onClose} type="button">
              Close
            </button>
          </div>
        </div>

        <form className="relative grid gap-6 px-6 py-6 md:grid-cols-[220px,minmax(0,1fr)]" onSubmit={handleSubmit}>
          <div className="glass-panel flex flex-col items-center gap-4 p-5">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-accentSoft text-3xl font-bold uppercase text-accent">
              {previewUrl ? (
                <img alt={`${name || auth?.user?.name} profile`} className="h-full w-full object-cover" src={previewUrl} />
              ) : (
                initials
              )}
            </div>

            <label className="secondary-button w-full cursor-pointer">
              <input accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFileChange} type="file" />
              Choose photo
            </label>

            <p className="text-center text-xs text-slate-400">
              Max size 5MB.
            </p>

            {selectedFile ? (
              <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 text-xs text-slate-300">
                <p className="truncate font-medium text-white">{selectedFile.name}</p>
                <p className="mt-1">{formatFileSize(selectedFile)}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-white" htmlFor="settings-name">
                Display name
              </label>
              <input
                className="input-field"
                id="settings-name"
                maxLength={50}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your display name"
                required
                type="text"
                value={name}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white" htmlFor="settings-phone">
                Phone number
              </label>
              <input
                className="input-field cursor-not-allowed border-white/5 text-slate-400"
                id="settings-phone"
                readOnly
                type="text"
                value={auth?.user?.phone || ''}
              />
            </div>

            {error ? (
              <div aria-live="polite" className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100" role="alert">
                {error}
              </div>
            ) : null}

            <div className="rounded-[28px] border border-rose-500/30 bg-rose-500/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">Close My Account</p>
              
              {deleteError ? (
                <div
                  aria-live="polite"
                  className="mt-4 rounded-2xl border border-rose-500/30 bg-slate-950/40 px-4 py-3 text-sm text-rose-200"
                  role="alert"
                >
                  {deleteError}
                </div>
              ) : null}

              <button
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-rose-500/60 bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
                onClick={() => {
                  setDeleteError('');
                  setIsDeleteConfirmOpen(true);
                }}
                type="button"
              >
                Close My Account
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button className="primary-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
              <button className="secondary-button" onClick={onClose} type="button">
                Cancel
              </button>
            </div>
          </div>
        </form>

        {isDeleteConfirmOpen ? (
          <div
            aria-modal="true"
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/85 px-6 py-6 backdrop-blur-sm"
            onClick={() => {
              if (!isDeletingAccount) {
                setIsDeleteConfirmOpen(false);
              }
            }}
            role="alertdialog"
          >
            <div
              className="glass-panel w-full max-w-md rounded-[28px] border border-rose-500/30 p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">Confirm deletion</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Are you sure?</h3>
              <p className="mt-3 text-sm text-slate-300">This will permanently delete your account and all your data.</p>

              {deleteError ? (
                <div
                  aria-live="polite"
                  className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                  role="alert"
                >
                  {deleteError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  className="secondary-button"
                  disabled={isDeletingAccount}
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-rose-500/60 bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-red-500/70"
                  disabled={isDeletingAccount}
                  onClick={handleDeleteAccount}
                  type="button"
                >
                  {isDeletingAccount ? 'Deleting account...' : 'Yes, delete my account'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SettingsModal;
