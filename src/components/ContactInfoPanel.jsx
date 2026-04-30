import { useEffect } from 'react';
import { FiLock, FiPhone, FiShield, FiX } from 'react-icons/fi';

import UserAvatar from './UserAvatar';

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/40 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1 break-words text-sm font-medium text-white sm:text-base">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ContactInfoPanel({
  isBlocked,
  isOpen,
  isSecure,
  onClose,
  onToggleBlockedUser,
  onToggleSecureMode,
  user
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const displayName = user?.name || 'Unknown contact';
  const phoneNumber = user?.phone || 'Phone number unavailable';

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <aside
        aria-label="Contact info"
        aria-modal="true"
        className="ml-auto flex h-full w-full flex-col overflow-hidden border-l border-white/10 bg-[linear-gradient(180deg,rgba(11,20,34,0.98),rgba(3,7,18,0.98))] shadow-2xl sm:max-w-md"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button className="secondary-button px-3 py-2" onClick={onClose} type="button">
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="flex flex-col items-center rounded-[32px] border border-white/10 bg-white/5 px-5 py-6 text-center">
            <UserAvatar
              className="border border-white/10 shadow-lg shadow-slate-950/30"
              name={displayName}
              profilePic={user?.profilePic}
              roundedClass="rounded-full"
              size="2xl"
            />
            <h3 className="mt-4 text-2xl font-semibold text-white">{displayName}</h3>
          </div>

          <div className="mt-6 space-y-3">
            <DetailRow icon={FiPhone} label="Phone Number" value={phoneNumber} />

            {isSecure ? (
              <div className="rounded-[24px] border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
                Secure mode is on. Forwarding into or out of this chat is disabled.
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Actions</p>
          <div className="mt-3 grid gap-3">
            <button
              className="secondary-button w-full justify-between px-4 py-3 text-left"
              onClick={onToggleSecureMode}
              type="button"
            >
              <span>{isSecure ? 'Disable secure mode' : 'Enable secure mode'}</span>
              <FiLock className="h-4 w-4 text-slate-300" />
            </button>

            <button
              className={`inline-flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                isBlocked
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15'
              }`}
              onClick={onToggleBlockedUser}
              type="button"
            >
              <span>{isBlocked ? 'Unblock user' : 'Block user'}</span>
              <FiShield className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default ContactInfoPanel;
