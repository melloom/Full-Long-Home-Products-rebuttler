const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Copy existing icon to all required sizes
const sourceIcon = path.join(__dirname, '../assets/icon.png');
const targetIcon = path.join(__dirname, '../public/icons/icon-192x192.png');

// Copy the source icon to the target location
if (fs.existsSync(sourceIcon)) {
  fs.copyFileSync(sourceIcon, targetIcon);
  console.log('✅ Copied icon to public/icons/icon-192x192.png');
} else {
  console.log('⚠️  Source icon not found at assets/icon.png');
}

// Create a simple placeholder icon if source doesn't exist
if (!fs.existsSync(sourceIcon)) {
  const placeholderIcon = `
<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#1e40af"/>
  <circle cx="96" cy="96" r="60" fill="white"/>
  <path d="M80 70L120 96L80 122V70Z" fill="#1e40af"/>
</svg>`;
  
  fs.writeFileSync(path.join(__dirname, '../public/icons/icon-192x192.svg'), placeholderIcon);
  console.log('✅ Created placeholder icon');
}

console.log('📱 PWA icons setup complete!');
console.log('📝 Note: You may want to create proper icons for all sizes:');
iconSizes.forEach(size => {
  console.log(`   - icon-${size}x${size}.png`);
}); 