import { createUniqueId, type ComponentProps } from "solid-js"

export function WordmarkV2(props: Pick<ComponentProps<"svg">, "class">) {
  const mask = createUniqueId()
  const maskGradient = createUniqueId()
  const textGradient = createUniqueId()
  const arcGradient = createUniqueId()

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720.002 129.001"
      fill="none"
      preserveAspectRatio="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <defs>
        <linearGradient id={arcGradient} x1="27.4" y1="72.6" x2="72.6" y2="27.4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#12C79A" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>
        <linearGradient id={textGradient} x1="130" y1="0" x2="380" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#12C79A" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="129">
          <rect width="720" height="129" fill={`url(#${maskGradient})`} />
        </mask>
        <linearGradient id={maskGradient} x1="360" y1="0" x2="360" y2="129" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.9" />
          <stop offset="1" stop-color="white" stop-opacity="0.25" />
        </linearGradient>
      </defs>
      
      <g opacity="0.75" mask={`url(#${mask})`}>
        {/* Orbital Arc Mark */}
        <g transform="translate(10, 14.5)">
          <path
            d="M 27.4 72.6 A 32 32 0 1 1 72.6 27.4"
            stroke={`url(#${arcGradient})`}
            stroke-width="5"
            fill="none"
            stroke-linecap="round"
          />
          <circle cx="72.6" cy="27.4" r="8.5" fill="#38BDF8" />
          <circle cx="72.6" cy="27.4" r="4.5" fill="white" />
        </g>
        
        {/* Brand Text */}
        <text
          x="130"
          y="98"
          font-family="var(--font-sans), sans-serif"
          font-size="94"
          font-weight="800"
          letter-spacing="-3"
        >
          <tspan fill={`url(#${textGradient})`}>OXE</tspan>
          <tspan fill="#ffffff" font-weight="600">Space</tspan>
        </text>
      </g>
    </svg>
  )
}


