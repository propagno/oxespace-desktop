import { createUniqueId, type ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  const uid = createUniqueId()
  const arcGradId = `mark-arc-grad-${uid}`

  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={arcGradId} x1="8.76" y1="27.24" x2="23.24" y2="12.76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#12C79A" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>
      </defs>
      <path
        d="M 8.76 27.24 A 10.24 10.24 0 1 1 23.24 12.76"
        stroke={`url(#${arcGradId})`}
        stroke-width="1.8"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="23.24" cy="12.76" r="3.0" fill="#38BDF8" />
      <circle cx="23.24" cy="12.76" r="1.5" fill="white" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  const uid = createUniqueId()
  const bgGradId = `splash-bg-grad-${uid}`
  const ambGradId = `splash-amb-grad-${uid}`
  const arcGradId = `splash-arc-grad-${uid}`

  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={bgGradId} x1="0" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0E1F30" />
          <stop offset="100%" stop-color="#070F1A" />
        </linearGradient>
        <radialGradient id={ambGradId} cx="40" cy="50" r="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#12C79A" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#12C79A" stop-opacity="0" />
        </radialGradient>
        <linearGradient id={arcGradId} x1="21.9" y1="68.1" x2="58.1" y2="31.9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#12C79A" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>
      </defs>
      <rect x="0" y="10" width="80" height="80" rx="18" fill={`url(#${bgGradId})`} />
      <rect x="0" y="10" width="80" height="80" rx="18" fill={`url(#${ambGradId})`} />
      <path
        d="M 21.9 68.1 A 25.6 25.6 0 1 1 58.1 31.9"
        stroke={`url(#${arcGradId})`}
        stroke-width="4.5"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="58.1" cy="31.9" r="7.5" fill="#38BDF8" />
      <circle cx="58.1" cy="31.9" r="3.8" fill="white" />
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  const uid = createUniqueId()
  const arcGradId = `logo-arc-grad-${uid}`
  const textGradId = `logo-text-grad-${uid}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 234 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <defs>
        <linearGradient id={arcGradId} x1="8.76" y1="23.24" x2="23.24" y2="8.76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#12C79A" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>
        <linearGradient id={textGradId} x1="44" y1="0" x2="108" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#12C79A" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>
      </defs>
      <g transform="translate(4, 5)">
        <path
          d="M 8.76 23.24 A 10.24 10.24 0 1 1 23.24 8.76"
          stroke={`url(#${arcGradId})`}
          stroke-width="2.2"
          fill="none"
          stroke-linecap="round"
        />
        <circle cx="23.24" cy="8.76" r="3.2" fill="#38BDF8" />
        <circle cx="23.24" cy="8.76" r="1.6" fill="white" />
      </g>
      <text x="44" y="31" font-family="var(--font-sans), sans-serif" font-size="26" letter-spacing="-0.5">
        <tspan font-weight="700" fill={`url(#${textGradId})`}>
          OXE
        </tspan>
        <tspan font-weight="500" fill="var(--icon-strong-base)">
          Space
        </tspan>
      </text>
    </svg>
  )
}


