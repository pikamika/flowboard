const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

type IconProps = { size?: number }

export const PlusIcon = ({ size = 16 }: IconProps) => (
  <svg {...base} width={size} height={size}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const CloseIcon = ({ size = 20 }: IconProps) => (
  <svg {...base} width={size} height={size}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const UploadIcon = ({ size = 24 }: IconProps) => (
  <svg {...base} width={size} height={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m17 8-5-5-5 5" />
    <path d="M12 3v12" />
  </svg>
)

export const ColumnsIcon = ({ size = 20 }: IconProps) => (
  <svg {...base} width={size} height={size}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M15 3v18" />
  </svg>
)
