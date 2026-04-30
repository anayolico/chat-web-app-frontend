// Chat sidebar component displaying users and chat conversations
// This component shows a list of available users and existing chats,
// allowing users to start new conversations or continue existing ones

import { useState } from 'react';
import { formatConversationDate, formatLastSeen } from '../utils/formatters';
import Spinner from './Spinner';
import UserAvatar from './UserAvatar';

function ChatSidebar({ chats, currentUserId, isLoading, onChatSelect, onToggleChatPin, onUserSelect, users, onCreateGroup }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users and chats based on search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  );

  const filteredChats = chats.filter((chat) => {
    if (chat.kind === 'group') {
      return chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const partner = chat.participants?.find((p) => p.id !== currentUserId) || chat.user || {};
    return partner.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  return (
    <aside className="glass-panel flex h-full flex-col overflow-hidden">
      {/* Header section */}
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Messaging</p>
        <h2 className="mt-2 text-xl font-semibold text-white">People and chats</h2>
        {/* New Group button */}
        <button
          className="mt-3 w-full primary-button"
          onClick={onCreateGroup}
          type="button"
        >
          New Group
        </button>
        {/* Search input */}
        <input
          className="input-field mt-3"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users or chats..."
          type="text"
          value={searchQuery}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Users section */}
        <div>
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Users</p>
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <Spinner />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
              {searchQuery ? 'No users found matching your search.' : 'No users found.'}
            </div>
          ) : (
            // List of available users
            filteredUsers.map((user) => (
              <button
                className="mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5"
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                type="button"
              >
                <UserAvatar name={user.name} profilePic={user.profilePic} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                    <div className={`h-2 w-2 rounded-full ${user.isOnline ? 'bg-accent' : 'bg-slate-500'}`} />
                  </div>
                  <p className={`text-xs ${user.isOnline ? 'text-accent' : 'text-slate-500'}`}>
                    {user.isOnline ? 'Online' : formatLastSeen(user.lastSeen)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chats section */}
        <div className="mt-4">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Chats</p>
          {filteredChats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
              {searchQuery ? 'No chats found matching your search.' : 'No chats yet. Start a conversation.'}
            </div>
          ) : (
            // List of existing chats
            filteredChats.map((chat) => {
              // For group chats, use the group name and info
              const isGroup = chat.kind === 'group';
              const partner = chat.participants?.find((participant) => participant.id !== currentUserId) || chat.user || {};
              const isOnline = isGroup ? false : (partner.isOnline || false);
              const lastSeen = isGroup ? null : partner.lastSeen;
              const displayName = isGroup ? chat.name : (partner.name || 'Unknown user');
              const displayAvatar = isGroup ? chat.name : partner.name;
              const displayProfilePic = isGroup ? null : partner.profilePic;

              return (
                <div
                  className={`mb-2 flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5 ${
                    chat.isPinned ? 'border border-accent/30 bg-white/5' : ''
                  }`}
                  key={chat.id}
                >
                  <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onChatSelect(chat.id)} type="button">
                    <UserAvatar name={displayAvatar} profilePic={displayProfilePic} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-accent' : 'bg-slate-500'}`} />
                            {chat.isSecure ? <span className="rounded-full border border-sky-400/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-sky-200">Secure</span> : null}
                            {isGroup ? <span className="rounded-full border border-purple-400/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-purple-200">Group</span> : null}
                          </div>
                          <p className={`text-xs ${isOnline ? 'text-accent' : 'text-slate-500'}`}>
                            {isGroup ? `${chat.participants?.length || 0} members` : (isOnline ? 'Online' : formatLastSeen(lastSeen))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {chat.unreadCount > 0 ? (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-slate-950">
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </span>
                          ) : null}
                          {chat.lastMessage?.createdAt ? (
                            <span className="text-xs text-slate-400">
                              {formatConversationDate(chat.lastMessage.createdAt)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="truncate text-sm text-slate-400">
                        {chat.lastMessage?.content || (isGroup ? 'Group created' : `Start chatting with ${partner.name || 'this user'}`)}
                      </p>
                    </div>
                  </button>
                  <button
                    className="rounded-full border border-white/10 px-2.5 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                    onClick={() => onToggleChatPin?.(chat)}
                    title={chat.isPinned ? 'Unpin chat' : 'Pin chat'}
                    type="button"
                  >
                    {chat.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}

export default ChatSidebar;
