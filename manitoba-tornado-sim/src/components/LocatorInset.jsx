import React from 'react'

// Fixed Canada locator inset: a simplified Canada outline with Manitoba filled
// in gold so stakeholders instantly place the map within the country.
export default function LocatorInset() {
  return (
    <div className="locator" aria-label="Locator map: Manitoba within Canada">
      <svg viewBox="0 0 132 96" width="100%" role="img" aria-hidden="true">
        {/* Canada landmass */}
        <path
          d="M10,70 L8,52 L12,40 L9,30 L14,26 L18,30 L20,24 L30,18 L46,14 L60,16 L74,10
             L92,12 L108,16 L118,26 L112,38 L120,46 L124,52 L116,54 L118,60 L110,64
             L104,60 L98,66 L92,60 L86,66 L80,60 L74,66 L60,68 L40,70 L22,70 Z"
          fill="#DCD9CF" stroke="#16233A" strokeWidth="1" strokeLinejoin="round"
        />
        {/* Hudson Bay notch */}
        <path d="M70,16 C64,30 66,44 74,46 C84,44 86,28 82,16 Z" fill="#FBFAF6" stroke="#C9C6BC" strokeWidth="0.6" />
        {/* Manitoba, highlighted */}
        <path d="M58,46 L70,48 L68,68 L56,68 Z" fill="#B08A2E" stroke="#16233A" strokeWidth="1" strokeLinejoin="round" />
      </svg>
      <span className="locator__cap">Manitoba, Canada</span>
    </div>
  )
}
