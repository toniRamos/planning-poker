import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

// Icon component wrapper for consistent sizing and styling
interface IconProps {
  name: string;
  size?: number | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 20, 
  className = '', 
  color,
  style 
}) => (
  <IconifyIcon 
    icon={name} 
    width={size} 
    height={size} 
    className={`icon ${className}`}
    color={color}
    style={style}
  />
);

// ══════════════════════════════════════════════════════════
// Icon Name Constants - Using Phosphor, Tabler, and Game Icons
// All available at yesicon.app
// ══════════════════════════════════════════════════════════

export const ICONS = {
  // App/Brand
  cards: 'game-icons:card-pick',
  cardDeck: 'game-icons:card-random',
  poker: 'game-icons:poker-hand',
  
  // Roles
  crown: 'ph:crown-fill',
  target: 'ph:crosshair-fill',
  eye: 'ph:eye-fill',
  eyeSlash: 'ph:eye-slash-fill',
  user: 'ph:user-fill',
  users: 'ph:users-three-fill',
  
  // Actions
  plus: 'ph:plus-bold',
  check: 'ph:check-bold',
  checkCircle: 'ph:check-circle-fill',
  x: 'ph:x-bold',
  xCircle: 'ph:x-circle-fill',
  refresh: 'ph:arrows-clockwise-bold',
  trash: 'ph:trash-fill',
  edit: 'ph:pencil-simple-fill',
  share: 'ph:share-network-fill',
  link: 'ph:link-bold',
  copy: 'ph:copy-fill',
  search: 'ph:magnifying-glass-bold',
  
  // Navigation
  arrowLeft: 'ph:arrow-left-bold',
  arrowRight: 'ph:arrow-right-bold',
  chevronDown: 'ph:caret-down-bold',
  
  // Status
  connected: 'ph:wifi-high-fill',
  disconnected: 'ph:wifi-slash-fill',
  loading: 'ph:spinner-gap-bold',
  warning: 'ph:warning-fill',
  info: 'ph:info-fill',
  
  // Theme
  sun: 'ph:sun-fill',
  moon: 'ph:moon-fill',
  
  // Voting/Estimation
  ballot: 'ph:envelope-simple-fill',
  chart: 'ph:chart-bar-fill',
  chartLine: 'ph:chart-line-up-fill',
  clipboard: 'ph:clipboard-text-fill',
  listChecks: 'ph:list-checks-fill',
  
  // Features
  lightning: 'ph:lightning-fill',
  sparkle: 'ph:sparkle-fill',
  star: 'ph:star-fill',
  rocket: 'ph:rocket-launch-fill',
  fire: 'ph:fire-fill',
  heart: 'ph:heart-fill',
  thumbsUp: 'ph:thumbs-up-fill',
  thumbsDown: 'ph:thumbs-down-fill',
  
  // Session
  lock: 'ph:lock-fill',
  lockOpen: 'ph:lock-open-fill',
  clock: 'ph:clock-fill',
  hourglass: 'ph:hourglass-fill',
  
  // Settings
  gear: 'ph:gear-fill',
  sliders: 'ph:sliders-horizontal-fill',
  
  // Gaming/Fun
  coffee: 'ph:coffee-fill',
  question: 'ph:question-fill',
  infinity: 'ph:infinity-bold',
  smiley: 'ph:smiley-fill',
  mask: 'ph:masks-theater-fill',
  confetti: 'ph:confetti-fill',
  
  // Document
  fileText: 'ph:file-text-fill',
  note: 'ph:note-fill',
  tag: 'ph:tag-fill',
  
  // Misc
  dotsThree: 'ph:dots-three-bold',
  caretRight: 'ph:caret-right-fill',
  hash: 'ph:hash-bold',
  gridFour: 'ph:grid-four-fill',
  
} as const;

// ══════════════════════════════════════════════════════════
// Pre-built Icon Components for convenience
// ══════════════════════════════════════════════════════════

export const CardIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.cards} {...props} />;
export const CrownIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.crown} {...props} />;
export const TargetIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.target} {...props} />;
export const EyeIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.eye} {...props} />;
export const UserIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.user} {...props} />;
export const UsersIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.users} {...props} />;
export const ShareIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.share} {...props} />;
export const GearIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.gear} {...props} />;
export const SunIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.sun} {...props} />;
export const MoonIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.moon} {...props} />;
export const CheckIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.check} {...props} />;
export const ChartIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.chart} {...props} />;
export const LightningIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.lightning} {...props} />;
export const SparkleIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.sparkle} {...props} />;
export const RocketIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.rocket} {...props} />;
export const LockIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.lock} {...props} />;
export const RefreshIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.refresh} {...props} />;
export const TrashIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.trash} {...props} />;
export const SearchIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.search} {...props} />;
export const CoffeeIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.coffee} {...props} />;
export const ClipboardIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.clipboard} {...props} />;
export const ArrowLeftIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.arrowLeft} {...props} />;
export const PlusIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.plus} {...props} />;
export const XIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.x} {...props} />;
export const InfoIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.info} {...props} />;
export const ConfettiIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.confetti} {...props} />;
export const MaskIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.mask} {...props} />;
export const BallotIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.ballot} {...props} />;
export const HourglassIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.hourglass} {...props} />;
export const ListChecksIcon = (props: Omit<IconProps, 'name'>) => <Icon name={ICONS.listChecks} {...props} />;
