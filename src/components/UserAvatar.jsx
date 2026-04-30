const sizeClasses = {
  xs: 'h-9 w-9 text-sm',
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
  '2xl': 'h-28 w-28 text-4xl'
};

function UserAvatar({
  className = '',
  name = 'User',
  profilePic = '',
  roundedClass = 'rounded-2xl',
  size = 'md'
}) {
  const initials = String(name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'U';

  const avatarClasses = [sizeClasses[size] || sizeClasses.md, 'shrink-0', roundedClass, className]
    .filter(Boolean)
    .join(' ');

  if (profilePic) {
    return <img alt={`${name} profile`} className={`${avatarClasses} object-cover`} src={profilePic} />;
  }

  return (
    <div
      aria-hidden="true"
      className={`${avatarClasses} flex items-center justify-center bg-accentSoft font-bold uppercase text-accent`}
    >
      {initials}
    </div>
  );
}

export default UserAvatar;
