// Simple validation script to test core functionality
console.log('🎯 Lotería Webapp Validation');
console.log('=============================');

// Test 1: Check if core functions exist
const fs = require('fs');
const scriptContent = fs.readFileSync('docs/script.js', 'utf8') + fs.readFileSync('docs/deck.js', 'utf8');

const features = [
    'class LoteriaGame',
    'class Deck',
    'class IndexedDBCardStore',
    'class MemoryCardStore',
    'generateTabla()',
    'drawCard()',
    'handleFileSelect',
    'addCardFromPreview',
    'exportDeck()',
    'importDeck(',
    'IndexedDB'
];

console.log('\n✅ Core Features Check:');
features.forEach(feature => {
    const exists = scriptContent.includes(feature);
    console.log(`  ${exists ? '✅' : '❌'} ${feature}: ${exists ? 'Found' : 'Missing'}`);
});

// Test 2: Check HTML structure
const htmlContent = fs.readFileSync('docs/index.html', 'utf8');
const htmlElements = [
    'upload-section',
    'game-section', 
    'deck-section',
    'card-draw-section',
    'tabla',
    'card-draw-btn',
    'export-deck-btn',
    'import-deck-btn',
    'file-input',
    'drop-zone'
];

console.log('\n✅ HTML Elements Check:');
htmlElements.forEach(element => {
    const exists = htmlContent.includes(element);
    console.log(`  ${exists ? '✅' : '❌'} ${element}: ${exists ? 'Found' : 'Missing'}`);
});

// Test 3: Check CSS styles
const cssContent = fs.readFileSync('docs/style.css', 'utf8');
const cssClasses = [
    '.container',
    '.tabla',
    '.tabla-cell',
    '.drawn-card',
    '.upload-previews',
    '.modal',
    '@media'
];

console.log('\n✅ CSS Classes Check:');
cssClasses.forEach(cssClass => {
    const exists = cssContent.includes(cssClass);
    console.log(`  ${exists ? '✅' : '❌'} ${cssClass}: ${exists ? 'Found' : 'Missing'}`);
});

console.log('\n🎉 Validation Complete!');
console.log('\nTo test the webapp:');
console.log('1. Serve from docs/ directory (e.g., python3 -m http.server 8000)');
console.log('2. Open http://localhost:8000 in a web browser');
console.log('3. Upload images to create custom cards');
console.log('4. Generate tablas for printing');
console.log('5. Use Card Draw mode for presentations');
console.log('6. Test import/export and offline functionality');