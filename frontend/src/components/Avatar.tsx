import React from 'react';

interface AvatarProps {
  name: string;
  online?: boolean;
  size?: number;
}

const initials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Deterministic color from name (matches design aesthetic)
const avatarBg = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xfffff;
  }
  const hue = hash % 360;
  return `linear-gradient(135deg, oklch(62% 0.15 ${hue}), oklch(48% 0.18 ${(hue + 30) % 360}))`;
};

export const Avatar: React.FC<AvatarProps> = ({ name, online = false, size = 30 }) => (
  <div
    className={`avatar${online ? ' online' : ''}`}
    style={{
      width: size,
      height: size,
      fontSize: size * 0.4,
      background: avatarBg(name || '?')
    }}
    title={name}
  >
    {initials(name)}
  </div>
);

export default Avatar;
