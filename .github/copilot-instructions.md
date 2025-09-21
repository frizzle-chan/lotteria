# Lotería - Mexican Bingo PWA

**ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

Lotería is a complete Progressive Web App for Mexican Bingo with photo upload, printable tabla generation, iPad-optimized Card Draw presentation, cross-device synchronization, and full offline functionality. The webapp runs entirely client-side with no backend dependencies.

## Working Effectively

### Development Setup
- **Repository Structure**: Web assets are in `/public` directory for GitHub Pages deployment
- **GitHub Pages**: Deploy from `/public` folder on main branch for live hosting
- **Start Development**: `cd public && python3 -m http.server 8000` - serves webapp at http://localhost:8000
- **Alternative Start**: `npm run dev` (equivalent command from project root)
- **Validation**: `npm run validate` - checks core features exist (completes in <1 second)
- **Feature Testing**: `npm run test-features` - demonstrates game logic without DOM (completes in <1 second)

### Build Process
- **NO BUILD REQUIRED** - Pure HTML5/CSS3/JavaScript ES6+ frontend
- **NO DEPENDENCIES** - No npm install needed, no node_modules
- **NO COMPILATION** - Files run directly in browser
- **Development Time**: Server starts instantly (<2 seconds)

### Testing and Validation
- **NEVER CANCEL** development server - it starts immediately
- **Core Validation**: `npm run validate` - NEVER CANCEL, completes in <1 second
- **Feature Testing**: `npm run test-features` - NEVER CANCEL, completes in <1 second
- **Manual Testing**: Always test through browser at http://localhost:8000

## Manual Validation Scenarios

### CRITICAL: After making ANY changes, ALWAYS run these complete scenarios:

1. **Basic Webapp Loading**:
   - Start server: `cd public && python3 -m http.server 8000`
   - Navigate to http://localhost:8000
   - Verify all 5 navigation buttons appear and are clickable
   - Check console for errors (should show IndexedDB initialized, PWA ready)

2. **Upload and Card Creation Flow**:
   - Click "Upload Cards" button
   - Verify upload interface appears with drag-and-drop zone
   - Test drag-and-drop area is responsive to hover
   - Verify "Browse Files" button exists and is clickable

3. **Game Board Generation**:
   - Click "Generate Tabla" button
   - Verify 4×4 game board area is visible
   - Check "Generate New Tabla" and "Print Tabla" buttons exist
   - Verify appropriate messages appear when no cards exist

4. **Card Draw Presentation Mode**:
   - Click "Card Draw" button
   - Verify presentation interface loads
   - Check "Fullscreen" and "Reset Draw" buttons exist
   - Verify card counter shows "0 cards remaining" initially

5. **PWA and Offline Features**:
   - Verify service worker registers (check console for "SW registered successfully")
   - Check IndexedDB initializes ("IndexedDB initialized successfully")
   - Verify offline support activates ("[PWA] All features available offline")

## Core Technology Stack

### Architecture
- **Frontend**: Pure HTML5, CSS3, JavaScript ES6+
- **Storage**: IndexedDB for unlimited image storage capacity
- **Offline**: Service Worker with comprehensive caching strategies  
- **PWA**: Web App Manifest with proper icons and configuration
- **No Backend**: Runs entirely client-side

### Key Files (all in `/public` directory)
- `index.html` (326 lines) - Main application interface
- `script.js` (1,211 lines) - Complete application logic with LoteriaGame class
- `style.css` (1,449 lines) - Responsive styling with print media queries
- `sw.js` (288 lines) - Service worker for offline functionality
- `manifest.json` (90 lines) - PWA manifest with icons and shortcuts
- `offline.html` (135 lines) - Offline fallback page
- `demo.html` (35 lines) - Simple demo/testing page

### Key Features to Test After Changes
- **Photo Upload**: Drag & drop interface with file validation
- **IndexedDB**: Persistent storage for unlimited image collections
- **Tabla Generation**: Random 4×4 game boards optimized for 3:4 aspect ratio printing
- **Card Draw Mode**: iPad-optimized presentation with touch-friendly interface (60px+ buttons)
- **Import/Export**: Cross-device deck synchronization via JSON files
- **Print Optimization**: Cards and tablas designed for physical printing
- **PWA Installation**: Add to home screen capability
- **Offline Functionality**: Complete app functionality without internet

## Validation Commands

### Essential Commands (NEVER CANCEL - all complete in <1 second)
- `npm run validate` - Validates all core features exist in code
- `npm run test-features` - Tests game logic without DOM dependencies
- `cd public && python3 -m http.server 8000` - Starts development server instantly

### Manual Testing Checklist
Run these steps EVERY time after making changes:

1. **Start and Access**:
   ```bash
   cd public && python3 -m http.server 8000
   # Navigate to http://localhost:8000
   # Verify page loads with purple gradient background
   # Check all 5 navigation buttons are visible
   ```

2. **Upload Interface**:
   ```bash
   # Click "Upload Cards" 
   # Verify drag-drop zone appears
   # Check file format tips are displayed
   # Confirm "Browse Files" button works
   ```

3. **Game Functionality**:
   ```bash
   # Click "Generate Tabla"
   # Verify empty 4×4 grid appears  
   # Check buttons: "Generate New Tabla", "Print Tabla"
   # Verify appropriate "need 16 cards" message
   ```

4. **Presentation Mode**:
   ```bash
   # Click "Card Draw"
   # Verify presentation interface loads
   # Check "Fullscreen", "Reset Draw" buttons
   # Confirm "0 cards remaining" counter
   ```

## Common Modification Areas

### When editing `script.js`:
- Always check `class LoteriaGame` constructor
- Verify IndexedDB initialization in `initializeDatabase()`
- Test card loading/saving with `loadCards()` and `saveCards()`
- Validate tabla generation with `generateTabla()`

### When editing `index.html`:
- Always check section IDs: `upload-section`, `game-section`, `deck-section`, `card-draw-section`
- Verify button IDs match JavaScript event listeners
- Test responsive navigation with all 5 main buttons

### When editing `style.css`:
- Always test print media queries for tabla and card printing
- Verify responsive design works on desktop and tablet
- Check `.tabla-cell` styling for 3:4 aspect ratio
- Test modal and overlay interactions

## Error Prevention

### Common Issues and Solutions
- **"Need 16 cards" error**: Normal behavior when no cards uploaded yet - not a bug
- **Service Worker icon errors**: Console warnings about manifest icon data URIs are harmless
- **IndexedDB**: Always check console for "IndexedDB initialized successfully" message
- **File Upload**: Verify drag-and-drop events work in upload section and files are accepted
- **Empty tabla**: Normal when deck has <16 cards - tabla requires minimum 16 cards
- **PWA install prompt**: May not appear immediately - depends on engagement heuristics

### Debug Information
- **Expected Console Messages**: "IndexedDB initialized successfully", "SW registered successfully", "[PWA] All features available offline", "[PWA] Offline support initialized"
- **No build errors possible**: No compilation or build process exists
- **File changes**: Reflect immediately on browser refresh (F5)
- **Service Worker updates**: May require hard refresh (Ctrl+F5) or clear cache
- **Port conflicts**: If 8000 busy, server will show error - use different port

### Performance Expectations
- **Server startup**: Instant (<2 seconds)
- **Page load**: Instant (<2 seconds) 
- **Validation scripts**: <1 second each
- **IndexedDB operations**: <1 second for typical card collections
- **Service Worker cache**: <5 seconds for initial cache population

## Repository Structure Reference

```
lotteria/
├── public/              # GitHub Pages hosting directory (main webapp)
│   ├── index.html      # Main application (326 lines)
│   ├── style.css       # Responsive styling (1,449 lines)  
│   ├── script.js       # Application logic (1,211 lines)
│   ├── sw.js           # Service worker (288 lines)
│   ├── manifest.json   # PWA manifest (90 lines)
│   ├── offline.html    # Offline fallback (135 lines)
│   └── demo.html       # Demo/testing page (35 lines)
├── package.json        # npm scripts only - no dependencies
├── validate.js         # Code validation script (73 lines)
├── test-features.js    # Feature demonstration (144 lines)
├── README.md          # Comprehensive documentation
└── LICENSE            # MIT license
```

**REMEMBER**: This is a frontend-only PWA. No backend, no build process, no dependencies to install. Changes are immediately visible on browser refresh.

## Files to Avoid Modifying
- **`package-lock.json`**: Contains no dependencies - modification unnecessary 
- **`LICENSE`**: MIT license file - do not alter
- **`validate.js` and `test-features.js`**: Validation scripts - only modify if testing new features
- **`.gitignore`**: Standard Node.js gitignore - modifications rarely needed

## Critical Files for Code Changes
- **`public/script.js`**: All application logic - most changes happen here
- **`public/index.html`**: UI structure and layout modifications
- **`public/style.css`**: All styling including responsive design and print layouts
- **`public/manifest.json`**: PWA configuration - modify for app metadata changes