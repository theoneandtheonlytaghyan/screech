/**
 * Loader Component
 * Loading spinners and skeletons
 */

/**
 * Spinner Loader
 */
const Loader = ({
  size = 'md',
  color = 'accent',
  className = ''
}) => {
  // Size styles
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Color styles
  const colors = {
    accent: 'text-screech-accent',
    white: 'text-white',
    muted: 'text-screech-textMuted'
  };

  return (
    <div className={`${className}`} role="status" aria-label="Loading">
      <svg
        className={`animate-spin ${sizes[size]} ${colors[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Full Page Loader
 */
export const PageLoader = ({
  message = 'Loading...'
}) => {
  return (
    <div className="fixed inset-0 bg-screech-dark flex flex-col items-center justify-center z-50">
      <div className="text-6xl mb-6 animate-bounce">🦉</div>
      <Loader size="lg" />
      <p className="mt-4 text-screech-textMuted">{message}</p>
    </div>
  );
};

/**
 * Inline Loader
 */
export const InlineLoader = ({
  message = 'Loading...',
  size = 'md'
}) => {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loader size={size} />
      <span className="text-screech-textMuted">{message}</span>
    </div>
  );
};

/**
 * Skeleton Component
 */
export const Skeleton = ({
  width,
  height,
  rounded = 'md',
  className = ''
}) => {
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={`skeleton ${roundedStyles[rounded]} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem'
      }}
    />
  );
};

/**
 * Skeleton Text Lines
 */
export const SkeletonText = ({
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="0.875rem"
          width={index === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton Post Card
 */
export const SkeletonPost = () => {
  return (
    <div className="card animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width="48px" height="48px" rounded="full" />
        <div className="flex-1">
          <Skeleton width="120px" height="1rem" className="mb-2" />
          <Skeleton width="80px" height="0.75rem" />
        </div>
      </div>

      {/* Content */}
      <SkeletonText lines={2} className="mb-4" />

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t border-screech-border">
        <Skeleton width="60px" height="1.5rem" rounded="lg" />
        <Skeleton width="60px" height="1.5rem" rounded="lg" />
      </div>
    </div>
  );
};

/**
 * Skeleton Avatar with Name
 */
export const SkeletonUser = () => {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <Skeleton width="40px" height="40px" rounded="full" />
      <div>
        <Skeleton width="100px" height="1rem" className="mb-1" />
        <Skeleton width="60px" height="0.75rem" />
      </div>
    </div>
  );
};

/**
 * Skeleton Message
 */
export const SkeletonMessage = ({ isOwn = false }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-pulse`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <Skeleton
          width="200px"
          height="60px"
          rounded="xl"
          className={isOwn ? 'bg-screech-accent/20' : ''}
        />
        <Skeleton width="50px" height="0.625rem" className="mt-1" />
      </div>
    </div>
  );
};

/**
 * Loading Dots
 */
export const LoadingDots = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="w-2 h-2 bg-screech-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-screech-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-screech-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

export default Loader;