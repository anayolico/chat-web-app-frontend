import { useEffect, useRef, useState } from 'react';

import { formatMessageTime } from '../utils/formatters';
import { resolveMediaUrl } from '../utils/mediaUrl';

const isPdf = (mimeType = '', fileName = '') =>
  mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

const isVideo = (mimeType = '') => mimeType.startsWith('video/');

const isAudio = (mimeType = '') => mimeType.startsWith('audio/');

const isImage = (mimeType = '') => mimeType.startsWith('image/');

const isDocument = (mimeType = '', fileName = '') =>
  isPdf(mimeType, fileName) ||
  mimeType.includes('word') ||
  mimeType.includes('excel') ||
  mimeType.includes('sheet') ||
  mimeType.includes('powerpoint') ||
  mimeType.includes('presentation') ||
  mimeType === 'text/plain' ||
  mimeType === 'text/csv' ||
  mimeType === 'text/markdown' ||
  mimeType === 'application/rtf' ||
  /\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv|md|rtf)$/i.test(fileName);

const formatFileSize = (size = 0) => {
  if (!size) {
    return '';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function MediaPreviewModal({ allowDownload = true, fileName, isVideoPreview, onClose, url }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="glass-panel relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden bg-slate-950/90 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <p className="min-w-0 truncate text-sm font-medium text-white">
            {fileName || (isVideoPreview ? 'Video preview' : 'Image preview')}
          </p>
          <div className="flex items-center gap-2">
            {allowDownload ? (
              <a
                className="secondary-button px-3 py-2 text-xs sm:text-sm"
                download={fileName || true}
                href={url}
                rel="noreferrer"
                target="_blank"
              >
                Download
              </a>
            ) : null}
            <button className="secondary-button px-3 py-2 text-xs sm:text-sm" onClick={onClose} type="button">
              Close
            </button>
          </div>
        </div>

        <div className="flex min-h-[280px] items-center justify-center bg-slate-950/40 p-4 sm:p-6">
          {isVideoPreview ? (
            <video autoPlay className="max-h-[78vh] w-full rounded-2xl bg-black" controls src={url}>
              Your browser does not support video playback.
            </video>
          ) : (
            <img alt={fileName || 'Shared media'} className="max-h-[78vh] max-w-full rounded-2xl object-contain" src={url} />
          )}
        </div>
      </div>
    </div>
  );
}

function FileCard({ children, fileName, fileSize, icon, onOpen, trailingAction }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-950/30 p-3 ${onOpen ? 'cursor-pointer transition hover:border-white/20 hover:bg-slate-950/40' : ''}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-current">{fileName}</p>
          {fileSize ? <p className="mt-1 text-xs opacity-70">{formatFileSize(fileSize)}</p> : null}
        </div>
        {trailingAction}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function MessageActionsMenu({
  canDeleteForEveryone,
  canDeleteForMe,
  canEdit,
  isOwn,
  menuRef,
  onDeleteForEveryone,
  onDeleteForMe,
  onEdit,
}) {
  return (
    <div
      ref={menuRef}
      className={`absolute top-11 z-20 w-44 rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-xl backdrop-blur-sm transition-all duration-150 ease-out ${
        isOwn ? 'right-0' : 'left-0'
      }`}
      role="menu"
    >
      {canEdit ? (
        <button className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/10" onClick={onEdit} type="button">
          Edit
        </button>
      ) : null}
      {canDeleteForMe ? (
        <button className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/10" onClick={onDeleteForMe} type="button">
          Delete for me
        </button>
      ) : null}
      {canDeleteForEveryone ? (
        <button
          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-amber-100 transition hover:bg-amber-500/10"
          onClick={onDeleteForEveryone}
          type="button"
        >
          Delete for everyone
        </button>
      ) : null}
    </div>
  );
}

function MessageStatusIcon({ status }) {
  const iconColor = status === 'seen' ? 'text-blue-700' : 'text-current';

  if (status === 'pending') {
    return (
      <svg aria-hidden="true" className={`h-4 w-4 ${iconColor}`} fill="none" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.8v3.5l2.2 1.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      </svg>
    );
  }

  if (status === 'sent') {
    return (
      <svg aria-hidden="true" className={`h-4 w-4 ${iconColor}`} fill="none" viewBox="0 0 16 16">
        <path d="m4 8 2.2 2.2L12 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={`h-4 w-5 ${iconColor}`} fill="none" viewBox="0 0 20 16">
      <path d="m1.8 8 2.2 2.2L9.8 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m8 8 2.2 2.2L16 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function MessageBubble({ message, isOwn, onDeleteMessage, onEditMessage, onReaction }) {
  const [previewMedia, setPreviewMedia] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const openInNewTab = (url) => {
    const resolvedUrl = resolveMediaUrl(url);

    if (!resolvedUrl) {
      return;
    }

    const openedWindow = window.open(resolvedUrl, '_blank', 'noopener,noreferrer');

    if (!openedWindow) {
      const fallbackLink = document.createElement('a');
      fallbackLink.href = resolvedUrl;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.click();
    }
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const closeMenuThen = (handler) => () => {
    setIsMenuOpen(false);
    handler?.(message);
  };

  const renderMessageBody = () => {
    const fileUrl = resolveMediaUrl(message.fileUrl || message.mediaUrl);
    const mediaUrl = resolveMediaUrl(message.mediaUrl);
    const fileType = message.fileType || message.mimeType || '';
    const fileSize = message.size || message.fileSize || 0;
    const fileName = message.fileName || 'Attachment';

    if (message.isDeleted) {
      return <p className="text-sm italic opacity-80">{message.content || 'This message was deleted'}</p>;
    }

    if (message.type === 'image' && mediaUrl) {
      return (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl">
            <button
              aria-label="Preview image"
              className="block w-full"
              onClick={() => setPreviewMedia({ fileName, isVideoPreview: false, url: mediaUrl })}
              type="button"
            >
              <img
                alt={fileName}
                className="max-h-72 w-full rounded-2xl object-cover transition duration-200 hover:scale-[1.01]"
                src={mediaUrl}
              />
            </button>
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <button
                aria-label="Open image in new tab"
                className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-950/85"
                onClick={() => openInNewTab(mediaUrl)}
                type="button"
              >
                Open
              </button>
              <a
                aria-label="Download image"
                className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-950/85"
                download={fileName}
                href={mediaUrl}
                rel="noreferrer"
                target="_blank"
              >
                Save
              </a>
            </div>
          </div>
          {message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p> : null}
        </div>
      );
    }

    if (message.type === 'audio' && mediaUrl) {
      return (
        <div className="space-y-3">
          <audio className="w-full" controls src={mediaUrl}>
            Your browser does not support audio playback.
          </audio>
          <div className="flex items-center justify-end">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-current transition hover:bg-white/10"
              onClick={() => openInNewTab(mediaUrl)}
              type="button"
            >
              Open
            </button>
          </div>
          {message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p> : null}
        </div>
      );
    }

    if (message.type === 'file' && fileUrl) {
      if (isImage(fileType)) {
        return (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl">
              <button
                aria-label="Preview image"
                className="block w-full"
                onClick={() => setPreviewMedia({ fileName, isVideoPreview: false, url: fileUrl })}
                type="button"
              >
                <img alt={fileName} className="max-h-72 w-full rounded-2xl object-cover transition duration-200 hover:scale-[1.01]" src={fileUrl} />
              </button>
              <div className="absolute right-3 top-3 flex items-center gap-2">
                <button
                  aria-label="Open image in new tab"
                  className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-950/85"
                  onClick={() => openInNewTab(fileUrl)}
                  type="button"
                >
                  Open
                </button>
                <a
                  aria-label="Download image"
                  className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-950/85"
                  download={fileName}
                  href={fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Save
                </a>
              </div>
            </div>
            {message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p> : null}
          </div>
        );
      }

      if (isVideo(fileType)) {
        return (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl">
              <video className="max-h-80 w-full rounded-2xl bg-black" controls preload="metadata" src={fileUrl}>
                Your browser does not support video playback.
              </video>
              <button
                aria-label="Open video preview"
                className="absolute right-3 top-3 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-950/85"
                onClick={() => setPreviewMedia({ fileName, isVideoPreview: true, url: fileUrl })}
                type="button"
              >
                Expand
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs opacity-75">
              <span className="truncate">{fileName}</span>
              {fileSize ? <span className="shrink-0">{formatFileSize(fileSize)}</span> : null}
            </div>
            {message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p> : null}
          </div>
        );
      }

      if (isAudio(fileType)) {
        return (
          <div className="space-y-3">
            <audio className="w-full" controls src={fileUrl}>
              Your browser does not support audio playback.
            </audio>
            <div className="flex items-center justify-between gap-3 text-xs opacity-75">
              <span className="truncate">{fileName}</span>
              {fileSize ? <span className="shrink-0">{formatFileSize(fileSize)}</span> : null}
            </div>
            <div className="flex items-center justify-end">
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-current transition hover:bg-white/10"
                onClick={() => openInNewTab(fileUrl)}
                type="button"
              >
                Open
              </button>
            </div>
            {message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p> : null}
          </div>
        );
      }

      if (isDocument(fileType, fileName)) {
        return (
          <div className="space-y-3">
            <FileCard
              fileName={fileName}
              fileSize={fileSize}
              icon={
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                </svg>
              }
              onOpen={() => openInNewTab(fileUrl)}
              trailingAction={
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-current transition hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    openInNewTab(fileUrl);
                  }}
                  type="button"
                >
                  Open
                </button>
              }
            >
              <div className="flex items-center justify-end">
                <a
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-current transition hover:bg-white/10"
                  download={fileName}
                  href={fileUrl}
                  onClick={(event) => event.stopPropagation()}
                  rel="noreferrer"
                  target="_blank"
                >
                  Download
                </a>
              </div>
            </FileCard>
            {message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p> : null}
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <FileCard
            fileName={fileName}
            fileSize={fileSize}
            icon={
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 16V4m0 12l-4-4m4 4l4-4M5 20h14"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
              </svg>
            }
            onOpen={() => openInNewTab(fileUrl)}
            trailingAction={
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-current transition hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    openInNewTab(fileUrl);
                  }}
                  type="button"
                >
                  Open
                </button>
                <a
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-current transition hover:bg-white/10"
                  download={fileName}
                  href={fileUrl}
                  onClick={(event) => event.stopPropagation()}
                  rel="noreferrer"
                  target="_blank"
                >
                  Download
                </a>
              </div>
            }
          />
          {message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p> : null}
        </div>
      );
    }

    return <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>;
  };

  const canEdit = isOwn && message.type === 'text' && !message.isDeleted;
  const canDeleteForEveryone = isOwn && !message.isDeleted;
  const canDeleteForMe = !message.isDeleted;

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`relative max-w-[80%] rounded-[24px] px-4 py-3 shadow-lg sm:max-w-[70%] ${
            isOwn
              ? 'rounded-br-md bg-accent text-slate-950'
              : 'rounded-bl-md border border-white/10 bg-white/5 text-slate-100'
          }`}
        >
          {(canEdit || canDeleteForMe || canDeleteForEveryone) ? (
            <div className={`absolute top-3 z-10 ${isOwn ? 'left-3' : 'right-3'}`}>
              <button
                aria-label="Message actions"
                className={`h-8 w-8 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-accent ${
                  isOwn
                    ? 'border-slate-950/15 bg-slate-950/10 text-slate-900 hover:bg-slate-950/15'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen((current) => !current)}
                type="button"
              >
                <span aria-hidden="true" className="text-lg leading-none">⋯</span>
              </button>
              {isMenuOpen ? (
                <MessageActionsMenu
                  canDeleteForEveryone={canDeleteForEveryone}
                  canDeleteForMe={canDeleteForMe}
                  canEdit={canEdit}
                  isOwn={isOwn}
                  menuRef={menuRef}
                  onDeleteForEveryone={closeMenuThen(() => onDeleteMessage?.(message, 'everyone'))}
                  onDeleteForMe={closeMenuThen(() => onDeleteMessage?.(message, 'me'))}
                  onEdit={closeMenuThen(() => onEditMessage?.(message))}
                />
              ) : null}
            </div>
          ) : null}

          <div className={canEdit || canDeleteForMe || canDeleteForEveryone ? 'pt-9' : ''}>{renderMessageBody()}</div>
          <div className={`mt-2 flex items-center justify-between gap-2 text-[11px] ${isOwn ? 'text-slate-900/70' : 'text-slate-400'}`}>
            <div className="flex items-center gap-2">
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.isEdited && !message.isDeleted ? <span className="font-semibold opacity-80">edited</span> : null}
            </div>
            <div className="flex items-center gap-2">
              {!isOwn && (
                <button
                  aria-label="React with heart"
                  className="text-slate-400 transition-colors hover:text-accent"
                  onClick={() => onReaction?.(message.id, 'heart')}
                  type="button"
                >
                  Love
                </button>
              )}
              {isOwn ? (
                <span
                  aria-label={
                    message.status === 'seen'
                      ? 'Seen'
                      : message.status === 'pending'
                      ? 'Pending'
                      : message.status === 'delivered'
                      ? 'Delivered'
                      : 'Sent'
                  }
                  className="inline-flex items-center"
                  title={
                    message.status === 'seen'
                      ? 'Seen'
                      : message.status === 'pending'
                      ? 'Pending'
                      : message.status === 'delivered'
                      ? 'Delivered'
                      : 'Sent'
                  }
                >
                  <MessageStatusIcon status={message.status} />
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {previewMedia ? (
        <MediaPreviewModal
          allowDownload
          fileName={previewMedia.fileName}
          isVideoPreview={previewMedia.isVideoPreview}
          onClose={() => setPreviewMedia(null)}
          url={previewMedia.url}
        />
      ) : null}
    </>
  );
}

export default MessageBubble;
