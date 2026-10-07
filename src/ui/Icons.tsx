import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function CountryIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M4 20h16"/><path d="M6 20V9l6-4 6 4v11"/><path d="M9 20v-6h6v6"/><path d="M8.5 10.5h.01M15.5 10.5h.01"/></svg>
}

export function CabinetIcon(props: IconProps) {
  return <svg {...base} {...props}><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M9 5V3h6v2M4 10h16M10 14h4"/></svg>
}

export function PoliticsIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M3 20h18M5 17h14M7 17V9m5 8V9m5 8V9"/><path d="M4 9h16L12 4 4 9Z"/></svg>
}

export function RegionsIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z"/><path d="M9 4v14m6-12v14"/></svg>
}

export function NewsIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
}

export function TreasuryIcon(props: IconProps) {
  return <svg {...base} {...props}><circle cx="12" cy="12" r="8"/><path d="M9 9.5c0-1 1.1-1.8 2.8-1.8 1.4 0 2.6.5 3.2 1.2M15 14.5c0 1-1.1 1.8-2.8 1.8-1.4 0-2.6-.5-3.2-1.2M12 6.5v11"/></svg>
}

export function PeopleIcon(props: IconProps) {
  return <svg {...base} {...props}><circle cx="9" cy="8" r="3"/><path d="M4 20v-2a5 5 0 0 1 10 0v2M16 8.5a2.5 2.5 0 1 1 1 4.8M15.5 15a4 4 0 0 1 4.5 4"/></svg>
}

export function InflationIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M4 17 10 11l4 4 6-8"/><path d="M15 7h5v5"/></svg>
}

export function ApprovalIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M7 11v9H4v-9h3Zm0 7h9.5a2 2 0 0 0 1.9-1.4l1.4-4.5A2 2 0 0 0 17.9 9H14l.6-3.2A2.3 2.3 0 0 0 12.3 3L7 11"/></svg>
}
