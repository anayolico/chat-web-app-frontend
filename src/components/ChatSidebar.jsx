// Chat sidebar component displaying users and chat conversations
// This component shows a list of available users and existing chats,
// allowing users to start new conversations or continue existing ones

import { useState } from 'react';
import { formatConversationDate, formatLastSeen } from '../utils/formatters';
import Spinner from './Spinner';

function ChatSidebar({ chats, currentUserId, isLoading, onChatSelect, onUserSelect, users }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users and chats based on search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  );

  const filteredChats = chats.filter((chat) => {
    const partner = chat.participants?.find((p) => p.id !== currentUserId) || chat.user || {};
    return partner.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  // Helper function to render user avatar (image or initials)
  const renderAvatar = (person) => {
    if (person?.profilePic) {
      return <img alt={person.name} className="h-12 w-12 rounded-2xl object-cover" src={person.profilePic} />;
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accentSoft text-sm font-bold uppercase text-accent">
        {(person?.name || 'U').slice(0, 1)}
      </div>
    );
  };

  return (
    <aside className="glass-panel flex h-full flex-col overflow-hidden">
      {/* Header section */}
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Messaging</p>
        <h2 className="mt-2 text-xl font-semibold text-white">People and chats</h2>
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
                {renderAvatar(user)}
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
              // Find the other participant in the chat
              const partner =
                chat.participants?.find((participant) => participant.id !== currentUserId) || chat.user || {};

              return (
                <button
                  className="mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5"
                  key={chat.id || partner.id}
                  onClick={() => onChatSelect(chat.id)}
                  type="button"
                >
                  {renderAvatar(partner)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{partner.name || 'Unknown user'}</p>
                        <div className={`h-2 w-2 rounded-full ${partner.isOnline ? 'bg-accent' : 'bg-slate-500'}`} />
                      </div>
                      <p className={`text-xs ${partner.isOnline ? 'text-accent' : 'text-slate-500'}`}>
                        {partner.isOnline ? 'Online' : formatLastSeen(partner.lastSeen)}
                      </p>
                    </div>
                      {/* Last message timestamp */}
                      {chat.lastMessage?.createdAt ? (
                        <span className="text-xs text-slate-400">
                          {formatConversationDate(chat.lastMessage.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    {/* Last message preview */}
                    <p className="truncate text-sm text-slate-400">
                      {chat.lastMessage?.content || `Start chatting with ${partner.name || 'this user'}`}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}

export default ChatSidebar;
