// Message composer component for sending text, images, files, and voice notes
// Handles file uploads, voice recording, typing indicators, and message validation
// Supports multiple media types with proper error handling and UI feedback

import { useEffect, useMemo, useRef, useState } from 'react';

import { OFFLINE_MESSAGE } from '../utils/handleApiError';

const normalizeMimeType = (value = '') => value.split(';')[0].trim().toLowerCase();

const getSupportedRecorderMimeType = () => {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return 'audio/webm';
  }

  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
};

const resolveAudioFileMeta = (mimeType = '') => {
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (normalizedMimeType === 'audio/mpeg' || normalizedMimeType === 'audio/mp3') {
    return { extension: 'mp3', mimeType: 'audio/mpeg' };
  }

  if (normalizedMimeType === 'audio/mp4' || normalizedMimeType === 'audio/x-m4a' || normalizedMimeType === 'audio/aac') {
    return { extension: 'm4a', mimeType: 'audio/mp4' };
  }

  if (normalizedMimeType === 'audio/ogg') {
    return { extension: 'ogg', mimeType: 'audio/ogg' };
  }

  if (normalizedMimeType === 'audio/wav') {
    return { extension: 'wav', mimeType: 'audio/wav' };
  }

  return { extension: 'webm', mimeType: 'audio/webm' };
};

const fileTypes = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'],
  file: [
    'audio/webm',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
};

const emojis = ['😀', '😂', '❤️', '👍', '😊', '😢', '😮', '🙌', '🔥', '✨', '🎉', '🥳', '🤩', '🙏', '💪', '🤝', '😎', '💖', '🌟', '🥰', '😅', '😇', '🤓'];

function MessageComposer({ onSendText, onSendMedia, disabled, isUploading, onTypingStart, onTypingStop }) {
  const [draft, setDraft] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [composerError, setComposerError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const menuRef = useRef(null);

  const canSendText = useMemo(() => !disabled && !isUploading && draft.trim(), [disabled, draft, isUploading]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const stopTypingSoon = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop?.();
    }, 1200);
  };

  const handleDraftChange = (event) => {
    const nextDraft = event.target.value;
    setDraft(nextDraft);

    if (composerError) {
      setComposerError('');
    }

    if (disabled || isUploading) {
      return;
    }

    if (!nextDraft.trim()) {
      onTypingStop?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    onTypingStart?.();
    stopTypingSoon();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDraft = draft.trim();
    if (!trimmedDraft) {
      return;
    }

    const didSend = await onSendText(trimmedDraft);
    if (didSend) {
      setDraft('');
      setComposerError('');
      setShowEmojiPicker(false);
      onTypingStop?.();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!canSendText) {
      return;
    }

    void handleSubmit(event);
  };

  const handleEmojiSelect = (emoji) => {
    const nextDraft = `${draft}${emoji}`;
    setDraft(nextDraft);
    setShowEmojiPicker(false);
    setComposerError('');

    if (!disabled && !isUploading) {
      onTypingStart?.();
      stopTypingSoon();
    }
  };

  const uploadSelectedFiles = async (files, type) => {
    const selectedFiles = Array.from(files || []).filter(Boolean);

    if (selectedFiles.length === 0) {
      return;
    }

    setComposerError('');

    let allSucceeded = true;

    for (const file of selectedFiles) {
      const supportedTypes = fileTypes[type];
      const normalizedFileType = normalizeMimeType(file.type);

      if (supportedTypes && !supportedTypes.includes(normalizedFileType)) {
        setComposerError(`"${file.name}" is not supported for ${type} upload.`);
        allSucceeded = false;
        continue;
      }

      const didSend = await onSendMedia({
        file,
        type,
        content: draft.trim()
      });

      if (!didSend) {
        allSucceeded = false;
      }
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (allSucceeded) {
      setDraft('');
      setComposerError('');
      setShowEmojiPicker(false);
      onTypingStop?.();
    }
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder) {
        return;
      }

      console.log('Recording stopped');

      if (typeof mediaRecorder.requestData === 'function' && mediaRecorder.state === 'recording') {
        mediaRecorder.requestData();
      }

      mediaRecorder.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      return;
    }

    setComposerError('');

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setComposerError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorderMimeType = getSupportedRecorderMimeType();
      const mediaRecorder = recorderMimeType ? new MediaRecorder(stream, { mimeType: recorderMimeType }) : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const { extension, mimeType } = resolveAudioFileMeta(mediaRecorder.mimeType || chunksRef.current[0]?.type || recorderMimeType);
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.${extension}`, {
          type: mimeType
        });

        console.log('Recording stopped');
        console.log('Audio file created', audioFile);
        console.log('Sending voice note...');

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setRecordingTime(0);
        chunksRef.current = [];
        await uploadSelectedFiles([audioFile], 'audio');
      };

      mediaRecorder.onerror = (event) => {
        console.error('Voice recorder error', event.error || event);
        setComposerError('Voice note recording failed. Please try again.');
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setIsMenuOpen(false);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (_error) {
      setComposerError('Unable to access your microphone.');
    }
  };

  return (
    <form className="shrink-0 border-t border-white/10 bg-slate-950/40 p-4 backdrop-blur-sm" onSubmit={handleSubmit}>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        multiple
        onChange={(event) => uploadSelectedFiles(event.target.files, 'image')}
        ref={imageInputRef}
        type="file"
      />
      <input
        accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp,image/gif,audio/webm,audio/mpeg,audio/wav,audio/ogg,audio/mp4"
        className="hidden"
        multiple
        onChange={(event) => uploadSelectedFiles(event.target.files, 'file')}
        ref={fileInputRef}
        type="file"
      />
      <div className="space-y-3">
        <div className="relative">
          <button
            className="secondary-button px-3 py-2 text-sm transition-colors"
            disabled={disabled || isUploading}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            type="button"
            title="Add attachment"
          >
            +
          </button>

          {isMenuOpen && !isRecording && (
            <div
              ref={menuRef}
              className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-lg backdrop-blur-sm"
            >
              <button
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => {
                  imageInputRef.current?.click();
                  setIsMenuOpen(false);
                }}
                type="button"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image
              </button>
              <button
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsMenuOpen(false);
                }}
                type="button"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                File
              </button>
              <button
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => {
                  handleVoiceRecording();
                  setIsMenuOpen(false);
                }}
                type="button"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Voice Note
              </button>
            </div>
          )}
        </div>

        {isRecording ? (
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-4 w-4 animate-pulse rounded-full bg-red-500"></div>
                <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-red-500 opacity-75"></div>
              </div>
              <span className="text-sm font-medium text-red-400">Recording...</span>
              <div className="flex gap-1">
                <div className="w-1 bg-red-500 animate-pulse" style={{ height: '16px', animationDelay: '0s' }}></div>
                <div className="w-1 bg-red-500 animate-pulse" style={{ height: '12px', animationDelay: '0.1s' }}></div>
                <div className="w-1 bg-red-500 animate-pulse" style={{ height: '20px', animationDelay: '0.2s' }}></div>
                <div className="w-1 bg-red-500 animate-pulse" style={{ height: '14px', animationDelay: '0.3s' }}></div>
                <div className="w-1 bg-red-500 animate-pulse" style={{ height: '18px', animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm text-slate-400">{recordingTime}s</span>
            </div>
            <button
              className="primary-button flex items-center gap-2 px-4 py-2 text-sm"
              onClick={handleVoiceRecording}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Send
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="relative flex-1">
              <textarea
                className="input-field min-h-[48px] resize-none pr-10 text-sm sm:min-h-[56px] sm:pr-12 sm:text-base"
                disabled={disabled || isUploading}
                maxLength={2000}
                onChange={handleDraftChange}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? 'Choose a conversation to start messaging.' : 'Write a message...'}
                rows={1}
                value={draft}
              />

              <button
                aria-label="Add emoji"
                className="absolute bottom-2 right-2 text-lg text-slate-400 transition-colors hover:text-white sm:bottom-3 sm:right-3 sm:text-xl"
                disabled={disabled || isUploading}
                onClick={() => setShowEmojiPicker((current) => !current)}
                type="button"
              >
                🙂
              </button>

              {showEmojiPicker ? (
                <div className="absolute bottom-full right-0 mb-2 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-lg sm:p-3">
                  <div className="grid grid-cols-5 gap-1 sm:gap-2">
                    {emojis.map((emoji) => (
                      <button
                        className="text-xl transition-transform hover:scale-110 sm:text-2xl"
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <button className="primary-button h-12 min-w-20 text-sm sm:h-14 sm:min-w-28 sm:text-base" disabled={!canSendText} type="submit">
              Send
            </button>
          </div>
        )}

        {!disabled ? <p className="text-xs text-slate-500">You can send text, images, audio, PDFs, Word documents, and voice notes from here.</p> : null}

        {composerError ? (
          <div aria-live="polite" className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100" role="alert">
            {composerError}
          </div>
        ) : isUploading ? (
          <div aria-live="polite" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Uploading your media. If the connection drops, you'll see: {OFFLINE_MESSAGE}
          </div>
        ) : null}
      </div>
    </form>
  );
}

export default MessageComposer;
