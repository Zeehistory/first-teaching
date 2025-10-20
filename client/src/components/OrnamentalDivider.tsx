interface OrnamentalDividerProps {
  className?: string;
}

export default function OrnamentalDivider({ className = "my-12" }: OrnamentalDividerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width="120"
        height="24"
        viewBox="0 0 120 24"
        fill="none"
        className="text-border"
      >
        <path
          d="M60 12 L50 8 L55 12 L50 16 Z M60 12 L70 8 L65 12 L70 16 Z"
          fill="currentColor"
          opacity="0.5"
        />
        <circle cx="60" cy="12" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="40" cy="12" r="2" fill="currentColor" opacity="0.4" />
        <circle cx="80" cy="12" r="2" fill="currentColor" opacity="0.4" />
        <line
          x1="0"
          y1="12"
          x2="35"
          y2="12"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="85"
          y1="12"
          x2="120"
          y2="12"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
