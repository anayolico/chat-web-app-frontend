import { useCallback, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useChats } from '../context/ChatContext';
import UserAvatar from './UserAvatar';

function CreateGroupModal({ isOpen, onClose, users }) {
  const { auth } = useAuth();
  const { createGroupChat } = useChats();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const availableUsers = users.filter((user) => user.id !== auth?.user?.id);

  const handleUserToggle = useCallback((userId) => {
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error('Please select at least 2 users');
      return;
    }

    setIsCreating(true);
    try {
      const chat = await createGroupChat(groupName.trim(), selectedUsers);
      toast.success('Group created successfully!');
      setGroupName('');
      setSelectedUsers([]);
      onClose();
      if (chat?.id) {
        navigate(`/chats/${chat.id}`);
      }
    } catch (error) {
      toast.error('Failed to create group');
      console.error('Create group error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Create New Group</h2>
          <button
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Group Name
            </label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-accent focus:outline-none"
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              type="text"
              value={groupName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Members ({selectedUsers.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 cursor-pointer"
                  onClick={() => handleUserToggle(user.id)}
                >
                  <input
                    checked={selectedUsers.includes(user.id)}
                    className="h-4 w-4 text-accent focus:ring-accent border-white/10 rounded"
                    onChange={() => handleUserToggle(user.id)}
                    type="checkbox"
                  />
                  <UserAvatar
                    className="border border-white/10"
                    name={user.name}
                    profilePic={user.profilePic}
                    roundedClass="rounded-full"
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400">
                      {user.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              className="flex-1 secondary-button"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 primary-button"
              disabled={isCreating}
              onClick={handleCreateGroup}
              type="button"
            >
              {isCreating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;
