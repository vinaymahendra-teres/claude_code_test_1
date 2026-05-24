// Stroke-line icon set — 24x24 viewbox, 1.6 stroke. Match warm bakery feel: rounded joints, gentle.

const I = (path, opts = {}) => (props) => {
  const { size = 22, strokeWidth = 1.7, ...rest } = props || {};
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={opts.fill || 'none'} stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      {...rest}
    >{path}</svg>
  );
};

window.Icon = {
  Home: I(<>
    <path d="M3.5 11L12 4l8.5 7" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </>),
  Receipt: I(<>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </>),
  Users: I(<>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
    <path d="M15 4.5a3.5 3.5 0 0 1 0 7" />
    <path d="M16 14c2.5.4 5 2 5 5" />
  </>),
  Cake: I(<>
    <path d="M5 21h14M6 17h12v4H6zM6 13a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4H6v-4z" />
    <path d="M9 11V8M12 11V7M15 11V8" />
    <circle cx="9" cy="6.5" r=".8" fill="currentColor" />
    <circle cx="12" cy="5.5" r=".8" fill="currentColor" />
    <circle cx="15" cy="6.5" r=".8" fill="currentColor" />
  </>),
  Grid: I(<>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </>),
  Plus: I(<>
    <path d="M12 5v14M5 12h14" />
  </>),
  Search: I(<>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </>),
  Chevron: I(<><path d="M9 6l6 6-6 6"/></>),
  ChevronLeft: I(<><path d="M15 6l-6 6 6 6"/></>),
  ChevronDown: I(<><path d="M6 9l6 6 6-6"/></>),
  X: I(<><path d="M6 6l12 12M18 6L6 18"/></>),
  Phone: I(<>
    <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2L18 14v3a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </>),
  Instagram: I(<>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="17" cy="7" r=".8" fill="currentColor" />
  </>),
  Whatsapp: I(<>
    <path d="M21 12a9 9 0 1 1-3.5-7L21 4l-1 3.5A9 9 0 0 1 21 12z"/>
    <path d="M8 10c0 4 2 6 6 6l1.5-1.5-2-1-1.5 1c-1 0-3-2-3-3l1-1.5-1-2L8 8.5c0 .5 0 1 0 1.5z"/>
  </>),
  Mail: I(<>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <path d="M4 7l8 6 8-6" />
  </>),
  Calendar: I(<>
    <rect x="3.5" y="5" width="17" height="15" rx="2"/>
    <path d="M3.5 10h17M8 3v4M16 3v4"/>
  </>),
  Clock: I(<>
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 8v4l3 2"/>
  </>),
  Pin: I(<>
    <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </>),
  Star: I(<><path d="M12 3l2.6 5.6 6.2.8-4.6 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.2 9.4l6.2-.8L12 3z"/></>),
  Heart: I(<><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></>),
  Wallet: I(<>
    <path d="M3.5 7a2 2 0 0 1 2-2H18l1 2v10a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V7z"/>
    <path d="M3.5 10h13a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-13"/>
    <circle cx="15" cy="12.5" r="1" fill="currentColor"/>
  </>),
  Trending: I(<>
    <path d="M3 17l6-6 4 4 7-7"/>
    <path d="M14 8h6v6"/>
  </>),
  Trending2: I(<>
    <path d="M3 12l4 4 5-9 4 7 5-4"/>
  </>),
  Bell: I(<>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z"/>
    <path d="M10 20a2 2 0 0 0 4 0"/>
  </>),
  BellOff: I(<>
    <path d="M6 16V11a6 6 0 0 1 8.5-5.5"/>
    <path d="M18 16v-2M18 18l2 2H4l2-2"/>
    <path d="M10 20a2 2 0 0 0 4 0"/>
    <path d="M3 3l18 18"/>
  </>),
  Sparkle: I(<>
    <path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>
    <path d="M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/>
  </>),
  Megaphone: I(<>
    <path d="M3 10l13-5v14L3 14v-4z"/>
    <path d="M3 10h2v4H3zM7 14v3a2 2 0 0 0 4 0v-2"/>
  </>),
  Bank: I(<>
    <path d="M3 10l9-5 9 5"/>
    <path d="M5 10v8M9 10v8M15 10v8M19 10v8"/>
    <path d="M3 20h18"/>
  </>),
  Settings: I(<>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2l1 3 3-1-1 3 3 1-3 1 1 3-3-1-1 3-1-3-3 1 1-3-3-1 3-1-1-3 3 1z" strokeOpacity="0.4"/>
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" strokeOpacity="0"/>
  </>),
  Gear: I(<>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M4 12H1M23 12h-3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
  </>),
  More: I(<>
    <circle cx="6" cy="12" r="1.4" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
    <circle cx="18" cy="12" r="1.4" fill="currentColor"/>
  </>),
  Check: I(<><path d="M5 12l4 4 10-10"/></>),
  Edit: I(<>
    <path d="M4 20h4l10-10-4-4L4 16v4z"/>
    <path d="M14 6l4 4"/>
  </>),
  Trash: I(<>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>
  </>),
  Truck: I(<>
    <rect x="2" y="7" width="13" height="9" rx="1"/>
    <path d="M15 10h4l3 3v3h-7"/>
    <circle cx="7" cy="18" r="2"/>
    <circle cx="17" cy="18" r="2"/>
  </>),
  Camera: I(<>
    <path d="M4 8h3l2-2h6l2 2h3v11H4V8z"/>
    <circle cx="12" cy="13" r="3.5"/>
  </>),
  Egg: I(<>
    <path d="M12 3c-3 0-6 5-6 10a6 6 0 0 0 12 0c0-5-3-10-6-10z"/>
  </>),
  Drop: I(<>
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>
  </>),
  Box: I(<>
    <path d="M21 8L12 3 3 8l9 5 9-5z"/>
    <path d="M3 8v9l9 5 9-5V8M12 13v9"/>
  </>),
  Doc: I(<>
    <path d="M6 3h9l4 4v14H6z"/>
    <path d="M14 3v5h5M9 13h7M9 17h5"/>
  </>),
  Arrow: I(<>
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </>),
  Filter: I(<>
    <path d="M3 5h18M6 12h12M10 19h4"/>
  </>),
  Share: I(<>
    <circle cx="6" cy="12" r="2.5"/>
    <circle cx="18" cy="6" r="2.5"/>
    <circle cx="18" cy="18" r="2.5"/>
    <path d="M8 11l8-4M8 13l8 4"/>
  </>),
  Tag: I(<>
    <path d="M3 12V3h9l9 9-9 9-9-9z"/>
    <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
  </>),
};
