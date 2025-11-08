import Image from 'next/image';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hasStory?: boolean;
  onClick?: () => void;
}

export function Avatar({ src, alt, size = 'md', hasStory = false, onClick }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const storyRing = hasStory
    ? 'ring-2 ring-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5'
    : '';

  const clickable = onClick ? 'cursor-pointer' : '';

  const initials = alt
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`${sizes[size]} ${storyRing} ${clickable} rounded-full overflow-hidden flex-shrink-0`}
      onClick={onClick}
    >
      {src ? (
        <div className={`${sizes[size]} rounded-full overflow-hidden bg-gray-200`}>
          <Image
            src={src}
            alt={alt}
            width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 56 : 80}
            height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 56 : 80}
            className="object-cover w-full h-full"
          />
        </div>
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold`}>
          <span className={size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : 'text-base'}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}
