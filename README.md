# 🎯 Lotería - Mexican Bingo Webapp

A comprehensive web application for creating custom Lotería (Mexican Bingo) cards with photo upload, printable tabla generation, iPad-optimized Card Draw presentation, cross-device synchronization, and full offline PWA functionality.

## 🎮 Features

### Core Functionality
- **Photo Upload & Card Creation**: Drag & drop interface for uploading multiple images with custom naming
- **Printable Tabla Generation**: Random 4×4 game boards optimized for 3:4 aspect ratio printing
- **Complete Deck Printing**: Print entire deck with cutting guidelines for physical gameplay
- **iPad-Optimized Card Draw**: Professional game master presentation mode with touch-friendly interface
- **Cross-Device Import/Export**: Seamless deck synchronization between desktop and iPad devices
- **Offline-First PWA**: Full functionality without internet connection, installable as standalone app

### Advanced Features
- **IndexedDB Storage**: Unlimited capacity for large image collections
- **Service Worker Caching**: Comprehensive offline functionality with cache-first strategy
- **Print Optimization**: 3:4 aspect ratio cards matching traditional Lotería proportions
- **Touch Interface**: Large buttons and iPad-friendly interactions for presentations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🚀 Getting Started

### GitHub Pages (Recommended)
The webapp is hosted on GitHub Pages and ready to use:
- Visit the live webapp (GitHub Pages URL will be available after deployment)
- No installation required - works directly in your browser
- Can be installed as PWA for offline use

### Local Development
1. Clone this repository
2. Navigate to the `public/` directory
3. Open `index.html` in your web browser or use a local server

### Using a Local Server
```bash
# From the project root, serve the public directory
cd public

# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

## 📖 How to Use

### Complete Workflow
1. **Desktop Creation**: Upload and organize photos with full editing capabilities
2. **Export Deck**: Create timestamped JSON file with complete deck data (optional)
3. **Transfer**: Move file via cloud storage (iCloud, Google Drive, Dropbox) for cross-device use
4. **iPad Import**: Import deck with preview and merge options (optional)
5. **Offline Use**: Install as PWA for complete offline functionality
6. **Generate Tablas**: Create random 4×4 game boards for players
7. **Print Physical Cards**: Print entire deck for cutting and shuffling
8. **Game Master Mode**: Use Card Draw on iPad for professional presentation

### Traditional Lotería Gameplay
- **For Players**: Print tablas (game boards) and mark matching cards as they're called
- **For Game Master**: Use Card Draw mode to randomly draw and display cards to players
- **Winning**: First to complete a row, column, or diagonal calls "¡LOTERÍA!"
- **Traditional Size**: Build up to 54 unique cards for authentic gameplay

### Cross-Device Synchronization
1. Create custom cards on desktop with precise editing
2. Export deck as JSON file with all image data preserved
3. Transfer via cloud storage to iPad/mobile device
4. Import with options to replace, merge, or append cards
5. Use professional Card Draw presentation mode for gameplay

## 🎨 Features Overview

### Photo Upload & Management
- **Drag & Drop Interface**: Upload multiple images simultaneously
- **Image Formats**: Supports JPG, PNG, GIF, WebP formats
- **Custom Naming**: Assign meaningful names to each card
- **IndexedDB Storage**: Unlimited capacity for large image collections
- **Duplicate Prevention**: Avoids cards with identical names

### Printing & Physical Gameplay
- **3:4 Aspect Ratio**: Cards optimized for traditional Lotería proportions
- **Print All Cards**: 6-column grid layout for efficient paper usage
- **Cut-out Guidelines**: Clean black borders for precise cutting
- **Tabla Generation**: Random 4×4 game boards for players
- **Print Optimization**: Designed for standard paper sizes

### iPad Presentation Tools
- **Card Draw Mode**: Large card display (500px) for clear visibility
- **Touch-Friendly Interface**: 60px+ button heights for easy interaction
- **Fullscreen Presentation**: Dark theme for distraction-free gameplay
- **Drawing History**: Track previously drawn cards
- **Progress Indicators**: Show remaining cards in deck

### Progressive Web App (PWA)
- **Offline Functionality**: Complete app functionality without internet
- **Install Capability**: Add to home screen as standalone app
- **Service Worker**: Cache-first strategy for instant loading
- **Cross-Platform**: Works on desktop, iPad, and mobile devices

## 🛠️ Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, and JavaScript ES6+
- **Storage**: IndexedDB for unlimited image storage capacity
- **Offline**: Service Worker with comprehensive caching strategies
- **PWA**: Web App Manifest with proper icons and configuration
- **No Backend**: Runs entirely client-side

### File Structure
```
lotteria/
├── public/              # GitHub Pages hosting directory
│   ├── index.html      # Main application
│   ├── style.css       # Responsive styling
│   ├── script.js       # Application logic
│   ├── sw.js           # Service worker
│   ├── manifest.json   # PWA manifest
│   ├── offline.html    # Offline fallback
│   └── demo.html       # Demo/instructions
├── package.json        # Development configuration
├── README.md          # Documentation
└── LICENSE            # MIT license
```

### Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Required APIs**: IndexedDB, Service Worker, FileReader, Canvas
- **PWA Support**: iOS 11.3+, Android Chrome, Desktop browsers
- **Offline Capability**: Full functionality without internet connection

## 🤝 Contributing

This project welcomes contributions! Areas for enhancement:
- **Accessibility**: Screen reader support and keyboard navigation
- **Internationalization**: Multiple language support
- **Audio Features**: Text-to-speech card announcements
- **Visual Enhancements**: Animations and transitions
- **Game Variations**: Different board sizes and game modes
- **Social Features**: Sharing capabilities and multiplayer support

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🎊 Have Fun!

Enjoy creating your personalized Lotería game with family photos, pet pictures, favorite foods, or anything else you love!