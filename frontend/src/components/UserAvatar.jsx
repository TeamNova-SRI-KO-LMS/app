import { User } from 'lucide-react';

/**
 * UserAvatar — renders the user's profile photo with a consistent fallback.
 *
 * Priority order:
 *  1. src prop (e.g. live preview URL)
 *  2. user.avatar (uploaded image or Google profile picture URL)
 *  3. Styled user icon placeholder (no external URL dependency)
 *
 * Props:
 *   user       - Auth user object (needs .avatar and .name)
 *   src        - Override / preview URL (optional)
 *   size       - Tailwind size class string, e.g. "w-10 h-10" (default "w-10 h-10")
 *   className  - Extra classes applied to the outer wrapper
 *   imgClass   - Extra classes applied to the <img> element
 *   iconSize   - px size for the fallback Lucide icon (default 20)
 *   alt        - img alt text (defaults to user.name or "User")
 */
export default function UserAvatar({
  user,
  src,
  size = 'w-10 h-10',
  className = '',
  imgClass = '',
  iconSize = 20,
  alt,
}) {
  const avatarSrc = src || user?.avatar || null;
  const altText = alt || user?.name || 'User';

  return (
    <div
      className={`${size} rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 flex-shrink-0 ${className}`}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={altText}
          className={`w-full h-full object-cover ${imgClass}`}
          onError={(e) => {
            // If the image fails to load (e.g. expired Google URL), show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <User size={iconSize} className="text-blue-500" strokeWidth={1.8} />
      )}
    </div>
  );
}
