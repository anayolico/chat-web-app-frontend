import { useEffect, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import ChatSidebar from '../components/ChatSidebar';
import CreateGroupModal from '../components/CreateGroupModal';
import SettingsModal from '../components/SettingsModal';
import { useAuth } from '../context/AuthContext';
import { useChats } from '../context/ChatContext';
import { useRealtime } from '../context/RealtimeContext';
import { authApi } from '../services/authApi';
import { chatApi } from '../services/chatApi';
import { disconnectSocket, getSocket } from '../services/socket';

const themeClasses = {
  aurora: 'bg-[linear-gradient(180deg,rgba(7,17,31,0.95),rgba(2,8,20,1))]',
  sunset: 'bg-[linear-gradient(180deg,rgba(57,24,10,0.96),rgba(18,8,6,1))]',
  midnight: 'bg-[linear-gradient(180deg,rgba(8,12,26,0.98),rgba(2,4,12,1))]'
};

const wallpaperClasses = {
  nebula: 'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(17,197,138,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,122,89,0.14),transparent_34%)] before:content-[\'\']',
  dunes: 'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_20%,rgba(255,194,102,0.12),transparent_22%),radial-gradient(circle_at_80%_70%,rgba(255,122,89,0.12),transparent_24%)] before:content-[\'\']',
  grid: 'before:absolute before:inset-0 before:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] before:bg-[size:28px_28px] before:content-[\'\']',
  rain: 'before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent_0%,rgba(125,211,252,0.06)_35%,transparent_36%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_45%,transparent_46%)] before:bg-[size:22px_22px] before:content-[\'\']'
};

function ChatShell({ children }) {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { presenceByUser } = useRealtime();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { accessChat, chats, isLoading, loadError, reloadChatData, updateChatFromMessage, upsertChat, users } = useChats();
  const theme = auth?.user?.preferences?.theme || 'aurora';
  const wallpaper = auth?.user?.preferences?.wallpaper || 'nebula';

  const chatsWithPresence = chats.map((chat) => ({
    ...chat,
    user: {
      ...chat.user,
      ...(presenceByUser[chat.user?.id] || {})
    },
    participants: (chat.participants || []).map((participant) => ({
      ...participant,
      ...(presenceByUser[participant.id] || {})
    }))
  }));

  const usersWithPresence = users.map((user) => ({
    ...user,
    ...(presenceByUser[user.id] || {})
  }));

  const handleUserSelect = async (userId) => {
    try {
      const chat = await accessChat(userId);
      setIsSidebarOpen(false);
      navigate(`/chats/${chat.id}`);
    } catch (_error) {
      // Errors surface through the existing shell alert.
    }
  };

  const handleChatSelect = (chatId) => {
    setIsSidebarOpen(false);
    navigate(`/chats/${chatId}`);
  };

  const handleToggleChatPin = async (chat) => {
    try {
      const pinResponse = await chatApi.toggleChatPin(chat.id);
      upsertChat(pinResponse.data.data.chat);
    } catch (_error) {
      // Keep the current UI state if pinning fails.
    }
  };

  const handleCreateGroup = () => {
    setIsCreateGroupOpen(true);
  };

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return undefined;
    }

    const handleReceiveMessage = async (incomingMessage) => {
      if (!incomingMessage?.senderId || incomingMessage.senderId === auth?.user?.id) {
        return;
      }

      let resolvedChatId = incomingMessage.chatId;

      if (!resolvedChatId) {
        try {
          const chat = await accessChat(incomingMessage.senderId);
          resolvedChatId = chat.id;
        } catch (_error) {
          return;
        }
      }

      updateChatFromMessage(resolvedChatId, incomingMessage, { incrementUnread: true });
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [accessChat, auth?.user?.id, updateChatFromMessage]);

  const handleLogout = async () => {
    try {
      if (auth?.refreshToken) {
        await authApi.logout({
          refreshToken: auth.refreshToken
        });
      } else {
        await authApi.logout({});
      }
    } catch (_error) {
      // Continue local logout even if server call fails.
    }

    disconnectSocket();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`relative h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8 ${themeClasses[theme] || themeClasses.aurora} ${wallpaperClasses[wallpaper] || wallpaperClasses.nebula}`}>
      <div className="pointer-events-none absolute inset-0 opacity-90" />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="relative mx-auto flex h-full max-w-7xl gap-4 overflow-hidden">
        <div className={`${isSidebarOpen ? 'fixed inset-4 z-40 block' : 'hidden'} lg:static lg:block lg:w-[340px] lg:flex-shrink-0`}>
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="glass-panel px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Signed in as</p>
                <p className="mt-1 text-lg font-semibold text-white">{auth?.user?.name}</p>
                </div>
                <button className="secondary-button lg:hidden" onClick={() => setIsSidebarOpen(false)} type="button">
                  Close
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className="secondary-button px-2 py-2" onClick={() => setIsSettingsOpen(true)} type="button" title="Settings">
                  <FiSettings className="h-5 w-5" />
                </button>
                <button className="secondary-button px-2 py-1.5 text-xs" onClick={handleLogout} type="button">
                  Logout
                </button>
              </div>
            </div>

            <ChatSidebar
              chats={chatsWithPresence}
              currentUserId={auth?.user?.id}
              isLoading={isLoading}
              onChatSelect={handleChatSelect}
              onToggleChatPin={handleToggleChatPin}
              onUserSelect={handleUserSelect}
              users={usersWithPresence}
              onCreateGroup={handleCreateGroup}
            />

            {loadError ? (
              <div
                aria-live="polite"
                className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                role="alert"
              >
                <p>{loadError}</p>
                <button className="mt-3 secondary-button" onClick={reloadChatData} type="button">
                  Try again
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <main className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <header className="glass-panel flex items-center px-5 py-4 lg:hidden">
            <div className="flex items-center gap-3">
              <button className="secondary-button lg:hidden" onClick={() => setIsSidebarOpen(true)} type="button">
                Chats
              </button>
            </div>
          </header>

          <section className="flex-1 min-h-0">{children}</section>
        </main>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        users={usersWithPresence}
      />
    </div>
  );
}

export default ChatShell;
