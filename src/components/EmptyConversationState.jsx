function EmptyConversationState() {
  return (
    <div className="glass-panel flex h-full min-h-[420px] flex-col items-center justify-center px-8 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-accentSoft text-3xl text-accent">
        C
      </div>
      <h2 className="text-2xl font-semibold text-white">Choose a conversation</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
        Your chat list lives on the left. Open a thread to load history and keep messages flowing in real time.
      </p>
    </div>
  );
}

export default EmptyConversationState;
