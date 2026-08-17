const ICON_SIZE = { sm: 'h-7', md: 'h-8', lg: 'h-14' }
const TEXT_SIZE = { sm: 'text-base', md: 'text-lg', lg: 'text-3xl' }

export default function Logo({ mode, size = 'md', className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={mode === 'dark' ? '/logo-icon-dark.png' : '/logo-icon-light.png'}
        alt=""
        className={`${ICON_SIZE[size]} w-auto`}
      />
      <span className={`font-(family-name:--font-display) font-semibold text-(--text) ${TEXT_SIZE[size]}`}>
        Go Logistic
      </span>
    </div>
  )
}
