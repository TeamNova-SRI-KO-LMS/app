import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { baseUrl } from '../config/apiConfig';

/**
 * UserAvatar — renders the user's profile photo with a consistent fallback.
 *
 * Priority order:
 *  1. src prop (e.g. live preview URL)
 *  2. user.avatar (uploaded image or Google profile picture URL)
 *  3. Initials (if showInitials is true) or styled user icon placeholder
 *
 * Props:
 *   user         - Auth user object (needs .avatar and .name)
 *   src          - Override / preview URL (optional)
 *   size         - Tailwind size class string, e.g. "w-10 h-10" (default "w-10 h-10")
 *   className    - Extra classes applied to the outer wrapper
 *   imgClass     - Extra classes applied to the <img> element
 *   iconSize     - px size for the fallback Lucide icon (default 20)
 *   alt          - img alt text (defaults to user.name or "User")
 *   showInitials - boolean, whether to show name initials if no photo available
 */
export default function UserAvatar({
  user,
  src,
  size = 'w-10 h-10',
  className = '',
  imgClass = '',
  iconSize = 20,
  alt,
  showInitials = false,
}) {
  const rawSrc = src || user?.avatar || null;
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [rawSrc]);

  let avatarSrc = rawSrc;
  if (avatarSrc && typeof avatarSrc === 'string' && avatarSrc.startsWith('/uploads/') && baseUrl) {
    avatarSrc = `${baseUrl}${avatarSrc}`;
  }

  const altText = alt || user?.name || 'User';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  const showImage = Boolean(avatarSrc && !hasError);

  return (
    <div
      className={`${size} rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 flex-shrink-0 select-none ${className}`}
    >
      {showImage ? (
        <img
          src={avatarSrc}
          alt={altText}
          className={`w-full h-full object-cover ${imgClass}`}
          onError={() => setHasError(true)}
        />
      ) : showInitials && initials ? (
        <span className="font-bold text-indigo-700 text-xs sm:text-sm tracking-tight">
          {initials}
        </span>
      ) : (
        <User size={iconSize} className="text-blue-500" strokeWidth={1.8} />
      )}
    </div>
  );
}
