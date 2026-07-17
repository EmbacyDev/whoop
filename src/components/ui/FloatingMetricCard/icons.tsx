export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      <path d="M8 7v4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="8" cy="4.75" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function CheckRingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="12" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
      <path d="M8 13.2l3.2 3.2L18.2 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
