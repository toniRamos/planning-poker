import React from 'react';

interface Card3DProps {
  value: string;
  faceDown?: boolean;
  selected?: boolean;
  flipping?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const Card3D: React.FC<Card3DProps> = ({
  value,
  faceDown = false,
  selected = false,
  flipping = false,
  onClick,
  style,
  className = ''
}) => {
  const classes = [
    'card-3d',
    faceDown ? 'face-down' : '',
    selected ? 'selected' : '',
    flipping ? 'flipping' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-value={value}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="face">
        <div className="corner-tl">{value}</div>
        <div className="center">{value}</div>
        <div className="corner-br">{value}</div>
      </div>
      <div className="back" />
    </div>
  );
};

export default Card3D;
