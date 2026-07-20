export function PhoneCheckIcon() {
  return (
    <div className="relative inline-flex h-20 w-20 items-center justify-center">
      <svg
        width="56"
        height="80"
        viewBox="0 0 56 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="50"
          height="74"
          rx="10"
          stroke="#2563EB"
          strokeWidth="2.5"
          fill="white"
        />
        <circle cx="16" cy="38" r="2.4" fill="#2563EB" />
        <circle cx="28" cy="38" r="2.4" fill="#2563EB" />
        <circle cx="40" cy="38" r="2.4" fill="#2563EB" />
        <rect x="21" y="63" width="14" height="3" rx="1.5" fill="#DBEAFE" />
      </svg>
      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-sm ring-2 ring-white">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
