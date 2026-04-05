// Authentication card layout component
// This component provides a consistent layout for authentication pages
// with a form section and an optional decorative aside section

function AuthCard({ title, subtitle, children, aside }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      {/* Main form section */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="glass-panel w-full max-w-md p-8 sm:p-10">
          {/* App branding */}
          <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Chat Sphere
          </span>
          {/* Page title and subtitle */}
          <div className="mt-6 space-y-2">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="text-sm text-slate-300">{subtitle}</p>
          </div>
          {/* Form content */}
          <div className="mt-8">{children}</div>
        </div>
      </section>

      {/* Decorative aside section (hidden on mobile) */}
      <aside className="hidden items-center justify-center overflow-hidden lg:flex">
        <div className="relative h-full w-full">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(17,197,138,0.25),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(255,122,89,0.22),transparent_26%),linear-gradient(160deg,#09111c,#081726_40%,#0d1b2a)]" />
          {/* Aside content */}
          <div className="relative z-10 flex h-full items-center justify-center p-12">{aside}</div>
        </div>
      </aside>
    </div>
  );
}

export default AuthCard;
