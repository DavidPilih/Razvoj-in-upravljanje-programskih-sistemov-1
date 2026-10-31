// Inline SVG so the CSS in scenes.css can animate individual limbs.

export function Knight({ color }) {
  return <svg className="knight" viewBox="0 0 120 140" aria-hidden="true" style={{ '--tabard': color }}>
    <ellipse cx="58" cy="133" rx="34" ry="5" fill="#000" opacity=".18" />
    <path className="knight-plume" d="M50 10C34 -2 16 4 12 22c10-6 22-6 34 0z" fill="var(--tabard)" />
    <rect x="38" y="104" width="15" height="28" rx="5" fill="#8c97a5" />
    <rect x="60" y="104" width="15" height="28" rx="5" fill="#8c97a5" />
    <rect x="34" y="124" width="22" height="10" rx="5" fill="#59616d" />
    <rect x="58" y="124" width="22" height="10" rx="5" fill="#59616d" />
    <path d="M32 72q26-10 50 0l6 38q-31 8-62 0z" fill="var(--tabard)" />
    <path d="M57 74v32M44 88h26" stroke="#ffd766" strokeWidth="5" strokeLinecap="round" />
    <circle cx="30" cy="88" r="17" fill="#6f4522" stroke="#ffd766" strokeWidth="3" />
    <circle cx="30" cy="88" r="4" fill="#ffd766" />
    <rect x="28" y="16" width="60" height="54" rx="25" fill="#c5ced8" stroke="#7d8896" strokeWidth="3" />
    <rect x="38" y="36" width="50" height="16" rx="8" fill="#ffd9b3" />
    <circle cx="62" cy="44" r="3.4" fill="#2d2118" />
    <circle cx="77" cy="44" r="3.4" fill="#2d2118" />
    <path d="M38 34h50" stroke="#7d8896" strokeWidth="5" strokeLinecap="round" />
    <path d="M56 56h32" stroke="#7d8896" strokeWidth="3" strokeLinecap="round" />
    <g className="knight-arm">
      <rect x="66" y="78" width="30" height="13" rx="6" fill="#8c97a5" />
      <g transform="translate(96 84) rotate(-62)">
        <rect x="-12" y="-3.5" width="24" height="7" rx="3" fill="#6f4522" />
        <rect x="8" y="-11" width="7" height="22" rx="3" fill="#ffd766" />
        <path d="M15 -6h44l11 6-11 6h-44z" fill="#eef3f8" stroke="#8c97a5" strokeWidth="2" />
      </g>
    </g>
  </svg>
}

export function Horse({ coat = '#a5683a', silk = '#2f5fa8', crown = false }) {
  return <svg className="horse" viewBox="0 0 110 76" aria-hidden="true" style={{ '--coat': coat, '--silk': silk }}>
    <path className="horse-tail" d="M16 34C2 34 2 50 6 58c4-5 8-12 14-16z" fill="#3f2a1a" />
    <g className="horse-leg horse-leg-back"><rect x="24" y="42" width="8" height="28" rx="4" fill="var(--coat)" /><rect x="23" y="65" width="10" height="7" rx="3" fill="#3f2a1a" /></g>
    <g className="horse-leg horse-leg-front"><rect x="66" y="42" width="8" height="28" rx="4" fill="var(--coat)" /><rect x="65" y="65" width="10" height="7" rx="3" fill="#3f2a1a" /></g>
    <rect x="14" y="26" width="66" height="28" rx="14" fill="var(--coat)" />
    <g className="horse-leg horse-leg-front2"><rect x="60" y="42" width="8" height="28" rx="4" fill="var(--coat)" /><rect x="59" y="65" width="10" height="7" rx="3" fill="#3f2a1a" /></g>
    <g className="horse-leg horse-leg-back2"><rect x="18" y="42" width="8" height="28" rx="4" fill="var(--coat)" /><rect x="17" y="65" width="10" height="7" rx="3" fill="#3f2a1a" /></g>
    <path d="M64 34l14-20 12 8-10 26z" fill="var(--coat)" />
    <path d="M76 12q14-5 25 8q3 6-2 9q-7 3-12-1l-13-3z" fill="var(--coat)" />
    <path d="M78 12l1-8 6 7z" fill="var(--coat)" />
    <path d="M77 11C68 14 62 24 60 34l6 1c2-8 6-15 12-20z" fill="#3f2a1a" />
    <circle cx="87" cy="17" r="2.2" fill="#2d2118" />
    <path d="M32 26h26l3 16q-16 5-32 0z" fill="var(--silk)" stroke="#ffd766" strokeWidth="2" />
    <path d="M36 28l6-14h12l6 14z" fill="var(--silk)" />
    <circle cx="49" cy="9" r="8" fill="#ffd9b3" />
    <path d="M41 9a8 8 0 0 1 16 0z" fill="#c5ced8" stroke="#7d8896" strokeWidth="1.5" />
    {crown && <path d="M41 1V-6l4 3 4-5 4 5 4-3v7z" fill="#ffd766" stroke="#a9750f" strokeWidth="1" />}
  </svg>
}

export function Dragon() {
  return <svg className="dragon" viewBox="0 0 172 132" aria-hidden="true">
    <ellipse cx="82" cy="122" rx="66" ry="7" fill="#000" opacity=".25" />
    <path d="M36 96C14 100 4 88 8 72c8 12 18 12 32 8z" fill="#3f9a56" />
    <path d="M8 72l-5-9 12 3z" fill="#ffc83d" />
    <path className="dragon-wing" d="M64 66C50 34 26 26 12 34c10 6 12 14 12 22 8-6 14-4 18 4 6-4 12-2 16 8z" fill="#7bd08c" stroke="#3f9a56" strokeWidth="3" />
    <ellipse cx="74" cy="90" rx="44" ry="31" fill="#54b56b" />
    <ellipse cx="82" cy="97" rx="28" ry="22" fill="#d9f2b4" />
    <g className="dragon-head">
      <path d="M100 42l-7-18 15 10zM124 34l2-19 10 15z" fill="#ffc83d" />
      <ellipse cx="118" cy="60" rx="31" ry="26" fill="#54b56b" />
      <ellipse cx="143" cy="68" rx="19" ry="14" fill="#6ec785" />
      <circle cx="150" cy="63" r="2.4" fill="#2a6b3b" />
      <g className="dragon-eye-open">
        <circle cx="121" cy="50" r="9" fill="#fff" /><circle cx="124" cy="51" r="4.6" fill="#2d2118" /><circle cx="126" cy="49" r="1.5" fill="#fff" />
      </g>
      <path className="dragon-eye-shut" d="M112 51q9 7 18 0" fill="none" stroke="#24592f" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M130 76q12 4 24-2" fill="none" stroke="#2a6b3b" strokeWidth="3" strokeLinecap="round" />
    </g>
    <ellipse cx="52" cy="116" rx="17" ry="9" fill="#3f9a56" />
    <ellipse cx="98" cy="116" rx="17" ry="9" fill="#3f9a56" />
  </svg>
}

export function Chest() {
  return <svg className="chest" viewBox="0 0 120 104" aria-hidden="true">
    <ellipse className="chest-gold" cx="60" cy="48" rx="42" ry="12" fill="#ffd766" stroke="#c98f12" strokeWidth="2" />
    <rect x="12" y="46" width="96" height="52" rx="6" fill="#8a5428" stroke="#57331a" strokeWidth="3" />
    <path d="M12 64h96" stroke="#57331a" strokeWidth="3" />
    <rect x="24" y="46" width="10" height="52" fill="#d4a02c" />
    <rect x="86" y="46" width="10" height="52" fill="#d4a02c" />
    <g className="chest-lid">
      <path d="M12 46V34q0-22 22-22h52q22 0 22 22v12z" fill="#a0642f" stroke="#57331a" strokeWidth="3" />
      <rect x="24" y="12" width="10" height="34" fill="#d4a02c" />
      <rect x="86" y="12" width="10" height="34" fill="#d4a02c" />
    </g>
    <rect x="50" y="40" width="20" height="22" rx="4" fill="#ffd766" stroke="#a9750f" strokeWidth="2" />
    <circle cx="60" cy="50" r="3.5" fill="#57331a" />
  </svg>
}

export function Crest() {
  return <svg className="crest" viewBox="0 0 48 56" aria-hidden="true">
    <path d="M4 4h40v24c0 13-9 20-20 25C13 48 4 41 4 28z" fill="#b3362b" stroke="#ffd766" strokeWidth="3" />
    <path d="M24 5v48M4 24h40" stroke="#ffd766" strokeWidth="2" opacity=".55" />
    <path d="M14 36L32 14M34 36L16 14" stroke="#fff6df" strokeWidth="4" strokeLinecap="round" />
  </svg>
}

export function Swords() {
  return <svg viewBox="0 0 64 64" aria-hidden="true">
    <g strokeLinecap="round">
      <path d="M12 8l36 38" stroke="#c5ced8" strokeWidth="7" />
      <path d="M52 8L16 46" stroke="#eef3f8" strokeWidth="7" />
      <path d="M38 50l14-13M26 50L12 37" stroke="#d4a02c" strokeWidth="6" />
      <path d="M49 47l7 8M15 47l-7 8" stroke="#6f4522" strokeWidth="7" />
    </g>
  </svg>
}

export function Scroll() {
  return <svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="12" y="10" width="42" height="44" rx="4" fill="#fff0c9" stroke="#8a5428" strokeWidth="3" />
    <path d="M20 22h26M20 31h26M20 40h17" stroke="#8a5428" strokeWidth="3" strokeLinecap="round" />
    <path d="M8 48c0 8 12 8 12 0v-6H8z" fill="#e7c98f" stroke="#8a5428" strokeWidth="3" />
    <path d="M56 8c0-6-12-6-12 0v6h12z" fill="#e7c98f" stroke="#8a5428" strokeWidth="3" />
  </svg>
}

export function Landscape() {
  return <div className="landscape" aria-hidden="true">
    <span className="cloud cloud-a" />
    <span className="cloud cloud-b" />
    <svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice">
      <path d="M0 240C200 170 380 200 560 230s420 10 880-70v200H0z" fill="#8fc27a" />
      <g fill="#a9a2b5">
        <rect x="1010" y="110" width="210" height="130" />
        <rect x="985" y="70" width="52" height="170" /><rect x="1100" y="40" width="58" height="200" /><rect x="1200" y="80" width="52" height="160" />
        <path d="M980 72l31-44 31 44zM1095 42l34-52 34 52zM1195 82l31-44 31 44z" fill="#b3362b" />
      </g>
      <path d="M1130 -10v-26l26 9-26 9" fill="#ffd766" />
      <rect x="1098" y="178" width="44" height="62" rx="20" fill="#5b4632" />
      <path d="M0 300C260 230 520 290 760 280s460-50 680-30v110H0z" fill="#6ca85c" />
    </svg>
  </div>
}
