export function BuyMeACoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h10a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-1a2 2 0 0 1 2-2Z" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6" />
      <path d="M6 14v2a2 2 0 0 0 2 2h8" />
      <path d="M18 10h1a2 2 0 0 1 0 4h-1" />
    </svg>
  );
}

export function VenmoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        className="fill-[#008CFF]/15 dark:fill-[#008CFF]/25"
      />
      <path
        d="M8.2 7.2h3.05c.22 2.28 1.02 4.62 2.55 6.42.7.82 1.52 1.38 2.5 1.38.28 0 .52-.04.7-.1v2.72c-.32.12-.74.2-1.22.2-1.92 0-3.42-.92-4.58-2.42-1.5-1.94-2.42-4.72-2.78-8.2H8.2V7.2Z"
        className="fill-[#008CFF] dark:fill-[#5CB8FF]"
      />
    </svg>
  );
}

export function ExternalHintIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />
      <path d="M13 11l6-6" />
      <path d="M19 13v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
    </svg>
  );
}
