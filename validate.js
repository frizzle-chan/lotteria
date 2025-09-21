// Simple validation script to test core functionality
console.log('🎯 Lotería Webapp Validation');
console.log('=============================');

// Test 1: Check if core functions exist
const fs = require('fs');
const scriptContent = fs.readFileSync('script.js', 'utf8');

const features = [
    'class LoteriaGame',
    'loadCards()',
    'saveCards()',
    'generateTabla()',
    'drawCard()',
    'handleFileSelect',
    'addCardFromPreview',
    'checkForWin()',
    'announceWin(',
    'localStorage'
];

console.log('\n✅ Core Features Check:');
features.forEach(feature => {
    const exists = scriptContent.includes(feature);
    console.log(`  ${exists ? '✅' : '❌'} ${feature}: ${exists ? 'Found' : 'Missing'}`);
});

// Test 2: Check HTML structure
const htmlContent = fs.readFileSync('index.html', 'utf8');
const htmlElements = [
    'upload-section',
    'game-section', 
    'deck-section',
    'tabla',
    'draw-card-btn',
    'file-input',
    'drop-zone'
];

console.log('\n✅ HTML Elements Check:');
htmlElements.forEach(element => {
    const exists = htmlContent.includes(element);
    console.log(`  ${exists ? '✅' : '❌'} ${element}: ${exists ? 'Found' : 'Missing'}`);
});

// Test 3: Check CSS styles
const cssContent = fs.readFileSync('style.css', 'utf8');
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
console.log('1. Open index.html in a web browser');
console.log('2. Upload some images (minimum 16 for full game)');
console.log('3. Click "New Game" to generate a tabla');
console.log('4. Click "Draw Card" to start playing');
console.log('5. Mark cards on your tabla to win!');