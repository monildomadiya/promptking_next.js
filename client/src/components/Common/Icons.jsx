import React from 'react';

/**
 * High-performance, lightweight local SVG icons (Offline).
 * mimicks lucide-react API.
 */
const IconWrapper = ({ 
  children, 
  size = 24, 
  color = 'currentColor', 
  strokeWidth = 2, 
  className = "",
  style = {}
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const Search = (props) => (
  <IconWrapper {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></IconWrapper>
);

export const Crown = (props) => (
  <IconWrapper {...props}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/></IconWrapper>
);

export const Grid = (props) => (
  <IconWrapper {...props}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></IconWrapper>
);

export const MessageSquare = (props) => (
  <IconWrapper {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></IconWrapper>
);

export const Sparkles = (props) => (
  <IconWrapper {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </IconWrapper>
);

export const Image = (props) => (
  <IconWrapper {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></IconWrapper>
);

export const Zap = (props) => (
  <IconWrapper {...props}><path d="M4 14.5a1 1 0 0 1-.96-1.39l2.8-6.1c.15-.33.5-.51.86-.51h3.3c.4 0 .7.3.7.7v1.8l3.3.1c.4 0 .7.3.7.7v2c0 .4-.2.7-.6.8l-7.3 3.5c-.1.1-.3.1-.4.1z"/></IconWrapper>
);

export const Heart = (props) => (
  <IconWrapper {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.04 3 5.5l7 7Z"/></IconWrapper>
);

export const Filter = (props) => (
  <IconWrapper {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></IconWrapper>
);

export const Code = (props) => (
  <IconWrapper {...props}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></IconWrapper>
);

export const Instagram = (props) => (
  <IconWrapper {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></IconWrapper>
);

export const Youtube = (props) => (
  <IconWrapper {...props}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17Z"/><path d="m10 15 5-3-5-3z"/></IconWrapper>
);

export const ArrowRight = (props) => (
  <IconWrapper {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></IconWrapper>
);

export const ArrowLeft = (props) => (
  <IconWrapper {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></IconWrapper>
);

export const Copy = (props) => (
  <IconWrapper {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></IconWrapper>
);

export const Check = (props) => (
  <IconWrapper {...props}><path d="M20 6 9 17l-5-5"/></IconWrapper>
);

export const Eye = (props) => (
  <IconWrapper {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></IconWrapper>
);

export const Lock = (props) => (
  <IconWrapper {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></IconWrapper>
);

export const Unlock = (props) => (
  <IconWrapper {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></IconWrapper>
);

export const LogOut = (props) => (
  <IconWrapper {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></IconWrapper>
);

export const Settings = (props) => (
  <IconWrapper {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></IconWrapper>
);

export const User = (props) => (
  <IconWrapper {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></IconWrapper>
);

export const Users = (props) => (
  <IconWrapper {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconWrapper>
);

export const Mail = (props) => (
  <IconWrapper {...props}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></IconWrapper>
);

export const Shield = (props) => (
  <IconWrapper {...props}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1v7z"/></IconWrapper>
);

export const Star = (props) => (
  <IconWrapper {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></IconWrapper>
);

export const Layout = (props) => (
  <IconWrapper {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></IconWrapper>
);

export const Menu = (props) => (
  <IconWrapper {...props}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></IconWrapper>
);

export const X = (props) => (
  <IconWrapper {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></IconWrapper>
);

export const LogIn = (props) => (
  <IconWrapper {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></IconWrapper>
);

export const ChevronDown = (props) => (
  <IconWrapper {...props}><path d="m6 9 6 6 6-6"/></IconWrapper>
);

export const Camera = (props) => (
  <IconWrapper {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></IconWrapper>
);

export const Activity = (props) => (
  <IconWrapper {...props}><path d="M22 12h-24l3-9 8 18 3-9h4"/></IconWrapper>
);

export const Sparkle = (props) => (
  <Sparkles {...props} />
);

export const Plus = (props) => (
  <IconWrapper {...props}><path d="M5 12h14"/><path d="M12 5v14"/></IconWrapper>
);

export const Edit = (props) => (
  <IconWrapper {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></IconWrapper>
);

export const Save = (props) => (
  <IconWrapper {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></IconWrapper>
);

export const Smartphone = (props) => (
  <IconWrapper {...props}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></IconWrapper>
);

export const Compass = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></IconWrapper>
);

export const PlusCircle = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></IconWrapper>
);

export const FileText = (props) => (
  <IconWrapper {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></IconWrapper>
);

export const MoreVertical = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></IconWrapper>
);

export const Trash2 = (props) => (
  <IconWrapper {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></IconWrapper>
);

export const HelpCircle = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></IconWrapper>
);

export const Home = (props) => (
  <IconWrapper {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></IconWrapper>
);

export const ExternalLink = (props) => (
  <IconWrapper {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></IconWrapper>
);

export const Edit3 = (props) => (
  <Edit {...props} />
);

export const ShieldCheck = (props) => (
  <IconWrapper {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></IconWrapper>
);

export const Facebook = (props) => (
  <IconWrapper {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></IconWrapper>
);

export const Twitter = (props) => (
  <IconWrapper {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></IconWrapper>
);

export const Github = (props) => (
  <IconWrapper {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></IconWrapper>
);

export const Send = (props) => (
  <IconWrapper {...props}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></IconWrapper>
);

export const Globe = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"/></IconWrapper>
);

export const MessageCircle = (props) => (
  <IconWrapper {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></IconWrapper>
);

export const Table = (props) => (
  <IconWrapper {...props}><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></IconWrapper>
);

export const TableProperties = (props) => (
  <IconWrapper {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></IconWrapper>
);

export const ChevronLeft = (props) => (
  <IconWrapper {...props}><path d="m15 18-6-6 6-6"/></IconWrapper>
);

export const ChevronRight = (props) => (
  <IconWrapper {...props}><path d="m9 18 6-6-6-6"/></IconWrapper>
);

export const Share2 = (props) => (
  <IconWrapper {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></IconWrapper>
);

export const Palette = (props) => (
  <IconWrapper {...props}><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1 0 1.9-.1 2.7-.4.5-.1.9-.6.8-1.1l-.1-.5c-.2-.7.3-1.4 1-1.6 1.1-.3 2.5 0 3.6.5 1.1.5 2.1-.4 2-1.6l-.1-.5c-.3-1.1.3-2.2 1.3-2.6 1.1-.5 1.8-1.5 1.8-2.7C22 6.5 17.5 2 12 2z"/></IconWrapper>
);

export const Gavel = (props) => (
  <IconWrapper {...props}><path d="m14 13-5 5 7 7 5-5-7-7Z"/><path d="m16 16 5 5"/><path d="m8 10 3 3"/><path d="m2 21 5-5"/><path d="M5 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="m12 12-1 1"/></IconWrapper>
);

export const Scale = (props) => (
  <IconWrapper {...props}><path d="m16 16 3-8 3 8c-.87.44-1.92.67-3 .67s-2.13-.23-3-.67Z"/><path d="m2 16 3-8 3 8c-.87.44-1.92.67-3 .67s-2.13-.23-3-.67Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></IconWrapper>
);

export const FileSignature = (props) => (
  <IconWrapper {...props}><path d="M20 19.5c0 .8-.7 1.5-1.5 1.5H5.5c-.8 0-1.5-.7-1.5-1.5V14"/><path d="M18 10.13V2l-6 5 6 3.13Z"/><path d="M22 20c0-2.2-1.8-4-4-4s-4 1.8-4 4"/></IconWrapper>
);

export const AlertCircle = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></IconWrapper>
);

export const Target = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></IconWrapper>
);

export const Rocket = (props) => (
  <IconWrapper {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4.5c1.11-1.12 3-1.5 3-1.5"/><path d="M12 15v5s3.03-.55 4.5-2c1.12-1.11 1.5-3 1.5-3"/></IconWrapper>
);

export const Award = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></IconWrapper>
);

export const CheckCircle = (props) => (
  <IconWrapper {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></IconWrapper>
);

export const Clock = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></IconWrapper>
);

export const Calendar = (props) => (
  <IconWrapper {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></IconWrapper>
);

export const Info = (props) => (
  <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></IconWrapper>
);

export const Cookie = (props) => (
  <IconWrapper {...props}><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Z"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></IconWrapper>
);

export const AlertTriangle = (props) => (
  <IconWrapper {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></IconWrapper>
);

export const Cpu = (props) => (
  <IconWrapper {...props}><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></IconWrapper>
);

export const Layers = (props) => (
  <IconWrapper {...props}><path d="m12 2 8 4-8 4-8-4 8-4Z"/><path d="m2 11 10 5L22 11"/><path d="m2 16 10 5 10-5"/></IconWrapper>
);

export const ChevronUp = (props) => (
  <IconWrapper {...props}><path d="m18 15-6-6-6 6"/></IconWrapper>
);

export const Trash = Trash2;

export const Laptop = (props) => (
  <IconWrapper {...props}><rect width="18" height="12" x="3" y="4" rx="2" ry="2"/><line x1="2" x2="22" y1="20" y2="20"/></IconWrapper>
);

export const Monitor = (props) => (
  <IconWrapper {...props}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></IconWrapper>
);

export const PieChart = (props) => (
  <IconWrapper {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></IconWrapper>
);

export const Coffee = (props) => (
  <IconWrapper {...props}><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="9" x2="9" y1="2" y2="4"/><line x1="13" x2="13" y1="2" y2="4"/></IconWrapper>
);
