# Lotería - Mexican Bingo PWA

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

Lotería is a Progressive Web App (PWA) for Mexican Bingo that allows users to upload custom photos, generate printable game boards (tablas), and use an iPad-optimized Card Draw presentation mode. The app supports offline functionality, cross-device synchronization, and can be installed as a standalone application.

## Working Effectively

### Bootstrap and Validate Repository
**All commands execute in under 5 seconds - no long timeouts needed:**
```bash
# Validate core functionality (completes in ~0.2 seconds)
npm run validate

# Test game logic features (completes in ~0.2 seconds)  
npm run test-features
```

### Run the Web Application
**The application starts instantly - no build step required:**
```bash
# Serve from docs/ directory (immediate startup)
npm run start
# OR alternatively:
npm run dev
# OR using Python directly:
cd docs && python3 -m http.server 8000
# OR using Node.js:  
cd docs && npx serve .
# OR using PHP:
cd docs && php -S localhost:8000

# Access at: http://localhost:8000
```

### Alternative Hosting Options
**GitHub Pages is the recommended deployment method:**
- Live URL: `https://frizzle-chan.github.io/lotteria/` (when GitHub Pages is enabled)
- Configure in repository Settings → Pages → Deploy from main branch → /docs folder
- No build process - static files served directly from /docs

## Validation & Testing

### Manual Validation Scenarios
**ALWAYS run through these complete end-to-end scenarios after making changes:**

1. **Basic App Functionality:**
   - Start web server and open http://localhost:8000
   - Verify all 5 navigation buttons work: Upload Cards, Generate Tabla, View Deck, Print All Cards, Card Draw
   - Test PWA installation prompt and offline functionality

2. **Photo Upload Workflow:**
   - Click "Upload Cards" → "Browse Files" 
   - Verify upload area accepts drag & drop
   - Test image preview generation and card creation
   - Confirm cards save to IndexedDB storage

3. **Game Board Generation:**
   - Upload at least 16 cards
   - Click "Generate Tabla" → "Generate New Tabla"
   - Verify 4×4 grid displays with random card selection
   - Test "Print Tabla" functionality

4. **Card Draw Presentation:**
   - Click "Card Draw" with cards in deck
   - Test "Draw Card" button and card display
   - Verify "Fullscreen" mode works
   - Test "Reset Draw" functionality

5. **Import/Export Features:**
   - Click "View Deck" → "Export Deck" 
   - Verify JSON file downloads with timestamp
   - Test "Import Deck" with previously exported file
   - Confirm deck merge and preview functionality

### Automated Validation Commands
```bash
# Core feature validation (✅ All features verified in ~0.2s)
npm run validate

# Game logic testing (✅ Demonstrates win conditions in ~0.2s)
npm run test-features
```

## Project Structure

### Key Directories and Files
```
/docs/              # Production web application (served by GitHub Pages)
├── index.html      # Main application entry point
├── script.js       # Core game logic with IndexedDB storage
├── style.css       # Responsive CSS with print media queries
├── sw.js          # Service Worker for PWA offline functionality
├── manifest.json   # PWA manifest with icons and shortcuts
├── offline.html    # Offline fallback page
└── demo.html       # Demo page (if exists)

validate.js         # Validation script for core functionality
test-features.js    # Feature demonstration script
package.json        # NPM scripts and project metadata
README.md          # Comprehensive user documentation
```

### Common Navigation Paths
- **Main application code:** `docs/script.js` (LoteriaGame class)
- **UI components:** `docs/index.html` (sections: upload, game, deck, card-draw)
- **Styling:** `docs/style.css` (includes print media queries)
- **PWA functionality:** `docs/sw.js` (offline caching) + `docs/manifest.json`
- **Validation tools:** `validate.js` and `test-features.js` in project root

## Architecture Details

### Technology Stack
- **Frontend:** Pure HTML5, CSS3, JavaScript ES6+ (no framework)
- **Storage:** IndexedDB for offline persistence
- **PWA:** Service Worker + Web App Manifest
- **No build process** - static files served directly

### Core Classes and Functions
**Located in `docs/script.js`:**
- `class LoteriaGame` - Main application controller
- `loadCards()` / `saveCards()` - IndexedDB persistence
- `generateTabla()` - 4×4 game board generation
- `drawCard()` - Random card selection for presentation
- `exportDeck()` / `importDeck()` - JSON import/export
- `handleFileSelect()` - Photo upload processing

### Browser Support
- **Modern browsers** with IndexedDB, Service Worker, and File API support
- **Mobile responsive** design for iPad presentation mode
- **PWA installation** supported on compatible devices

## Common Tasks

### Making Changes to Game Logic
1. Edit `docs/script.js` - focus on the `LoteriaGame` class
2. Run `npm run validate` to verify core functions still exist
3. Run `npm run test-features` to test game logic
4. Start web server and manually test affected workflows
5. **Always test in browser** - validation scripts only check code structure

### Updating UI/Styling
1. Edit `docs/index.html` for structure changes
2. Edit `docs/style.css` for styling changes  
3. Run `npm run validate` to verify HTML elements and CSS classes exist
4. Test responsive design on different screen sizes
5. **Always test print functionality** if modifying print styles

### PWA/Offline Features
1. Service Worker logic: `docs/sw.js`
2. App manifest: `docs/manifest.json`
3. Test offline functionality by going offline in browser dev tools
4. Verify cache updates and offline fallbacks work correctly

### Troubleshooting Common Issues
- **Cards not persisting:** Check IndexedDB in browser dev tools
- **PWA not installing:** Verify manifest.json and HTTPS/localhost serving
- **Upload not working:** Check File API support and CORS issues
- **Print layouts broken:** Test CSS print media queries

## Development Environment

### No Dependencies Required
- **No npm install needed** - package.json only contains scripts
- **No build step** - direct file serving
- **No transpilation** - modern JavaScript only
- **No bundling** - individual file loading

### Quick Commands Reference
```bash
npm run start       # Start development server (instant)
npm run validate    # Validate codebase (~0.2s)
npm run test-features # Test game logic (~0.2s)
```

All operations complete nearly instantly. The application is designed for simplicity and direct file serving.