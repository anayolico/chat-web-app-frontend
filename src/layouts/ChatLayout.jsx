import { Outlet } from 'react-router-dom';

import { ChatProvider } from '../context/ChatContext';
import ChatShell from '../pages/ChatShell';

function ChatLayout() {
  return (
    <ChatProvider>
      <ChatShell>
        <Outlet />
      </ChatShell>
    </ChatProvider>
  );
}

export default ChatLayout;
