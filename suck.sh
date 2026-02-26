#!/bin/bash
# dornt.com assets downloader
mkdir -p dornt-assets/fonts dornt-assets/css dornt-assets/icons
# Favicon
curl -o dornt-assets/favicon.ico https://www.dornt.com/favicon.ico
# Fonts
curl -o dornt-assets/fonts/font1.woff "https://www.dornt.com/_next/static/media/4473ecc91f70f139-s.p.woff"
curl -o dornt-assets/fonts/font2.woff "https://www.dornt.com/_next/static/media/463dafcda517f24f-s.p.woff"
# CSS
curl -o dornt-assets/css/main.css "https://www.dornt.com/_next/static/css/27b4d6b789fddb24.css"
curl -o dornt-assets/css/secondary.css "https://www.dornt.com/_next/static/css/222c3c68ad57ddf1.css"
# Custom logo SVG
cat > dornt-assets/icons/logo.svg << 'EOF'
<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="24" cy="24" r="10.5"/>
  <circle cx="24" cy="24" r="3.5" fill="currentColor"/>
  <path d="M24 6v4.5M24 37.5V42M6 24h4.5M37.5 24H42M11.2 11.2l3.2 3.2M33.6 33.6l3.2 3.2M11.2 36.8l3.2-3.2M33.6 14.4l3.2-3.2"/>
</svg>
EOF
echo "Done! Assets saved to ./dornt-assets/"
