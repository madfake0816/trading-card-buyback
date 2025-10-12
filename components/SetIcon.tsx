interface SetIconProps {
  setCode: string
  rarity: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function SetIcon({ setCode, rarity, size = 'medium', className = '' }: SetIconProps) {
  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-xl', 
    large: 'text-2xl',
  }

  const rarityClass = `ss-${rarity.toLowerCase()}`
  const setClass = `ss-${setCode.toLowerCase()}`
  const sizeClass = sizeClasses[size]

  return (
    <i 
      className={`ss ${setClass} ${rarityClass} ${sizeClass} ${className}`}
      style={{ display: 'inline-block' }}
      title={`${setCode.toUpperCase()} - ${rarity}`}
    />
  )
}