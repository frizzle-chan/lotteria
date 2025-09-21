// Lotería Game Logic with IndexedDB storage
class LoteriaGame {
    constructor() {
        this.cards = [];
        this.currentTabla = [];
        this.drawnCards = [];
        this.drawnCardsHistory = [];
        this.isFullscreen = false;
        this.pendingImportData = null;
        this.isOnline = navigator.onLine;
        this.dbName = 'LoteriaDB';
        this.dbVersion = 1;
        this.db = null;
        this.initializeDatabase().then(() => {
            this.loadCards().then(() => {
                this.initializeEventListeners();
                this.initializeDragAndDrop();
                this.initializeOfflineSupport();
                this.showSection('game-section');
                this.generateTabla();
            });
        });
    }

    // Initialize IndexedDB
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for cards
                if (!db.objectStoreNames.contains('cards')) {
                    const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
                    cardStore.createIndex('name', 'name', { unique: true });
                    cardStore.createIndex('number', 'number', { unique: false });
                }
            };
        });
    }

    // Load cards from IndexedDB
    async loadCards() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction(['cards'], 'readonly');
            const store = transaction.objectStore('cards');
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.cards = request.result || [];
                console.log(`Loaded ${this.cards.length} cards from IndexedDB`);
                resolve(this.cards);
            };
            
            request.onerror = () => {
                console.error('Failed to load cards:', request.error);
                reject(request.error);
            };
        });
    }

    // Save all cards to IndexedDB
    async saveCards() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction(['cards'], 'readwrite');
            const store = transaction.objectStore('cards');
            
            // Clear existing cards and add all current cards
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                // Add all cards
                let addedCount = 0;
                const totalCards = this.cards.length;
                
                if (totalCards === 0) {
                    this.updateDeckCount();
                    resolve();
                    return;
                }
                
                this.cards.forEach(card => {
                    const addRequest = store.add(card);
                    
                    addRequest.onsuccess = () => {
                        addedCount++;
                        if (addedCount === totalCards) {
                            console.log(`Saved ${addedCount} cards to IndexedDB`);
                            this.updateDeckCount();
                            resolve();
                        }
                    };
                    
                    addRequest.onerror = () => {
                        console.error('Failed to save card:', card.name, addRequest.error);
                        reject(addRequest.error);
                    };
                });
            };
            
            clearRequest.onerror = () => {
                console.error('Failed to clear cards store:', clearRequest.error);
                reject(clearRequest.error);
            };
        });
    }

    // Add a single card to IndexedDB
    async addCard(card) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction(['cards'], 'readwrite');
            const store = transaction.objectStore('cards');
            const request = store.add(card);
            
            request.onsuccess = () => {
                console.log('Card added to IndexedDB:', card.name);
                resolve(card);
            };
            
            request.onerror = () => {
                console.error('Failed to add card:', request.error);
                reject(request.error);
            };
        });
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Navigation
        document.getElementById('upload-btn').addEventListener('click', () => this.showSection('upload-section'));
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('view-deck-btn').addEventListener('click', () => this.showDeckView());
        document.getElementById('print-cards-btn').addEventListener('click', () => this.showPrintCardsView());
        document.getElementById('card-draw-btn').addEventListener('click', () => this.showCardDrawView());

        // Upload functionality
        document.getElementById('browse-btn').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        dropZone.addEventListener('click', () => document.getElementById('file-input').click());

        // Game controls
        document.getElementById('draw-card-btn')?.addEventListener('click', () => this.drawCard());
        document.getElementById('generate-tabla-btn').addEventListener('click', () => this.generateTabla());
        document.getElementById('print-tabla-btn').addEventListener('click', () => this.printTabla());

        // Print all cards controls
        document.getElementById('print-all-cards-btn').addEventListener('click', () => this.printAllCards());

        // Card Draw controls
        document.getElementById('draw-next-card-btn').addEventListener('click', () => this.drawNextCard());
        document.getElementById('reset-draw-btn').addEventListener('click', () => this.resetCardDraw());
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());

        // Modal controls
        document.getElementById('save-card-btn').addEventListener('click', () => this.saveCurrentCard());
        document.getElementById('cancel-card-btn').addEventListener('click', () => this.hideModal());

        // Deck management
        document.getElementById('clear-deck-btn').addEventListener('click', () => this.clearDeck());

        // Import/Export functionality  
        document.getElementById('export-deck-btn').addEventListener('click', () => this.exportDeck());
        document.getElementById('import-deck-btn').addEventListener('click', () => this.importDeck());
        document.getElementById('import-file-input').addEventListener('change', (e) => this.handleImportFile(e));
        document.getElementById('confirm-import-btn').addEventListener('click', () => this.confirmImport());
        document.getElementById('cancel-import-btn').addEventListener('click', () => this.cancelImport());

        // Keyboard shortcuts for card draw
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('card-draw-section').classList.contains('hidden')) return;
            
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.drawNextCard();
            } else if (e.code === 'Escape') {
                e.preventDefault();
                if (this.isFullscreen) {
                    this.toggleFullscreen();
                }
            }
        });
    }

    // Show specific section and hide others
    showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.add('hidden'));
        document.getElementById(sectionId).classList.remove('hidden');

        // Update navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        if (sectionId === 'upload-section') {
            document.getElementById('upload-btn').classList.add('active');
        } else if (sectionId === 'game-section') {
            document.getElementById('new-game-btn').classList.add('active');
        } else if (sectionId === 'deck-section') {
            document.getElementById('view-deck-btn').classList.add('active');
        } else if (sectionId === 'print-cards-section') {
            document.getElementById('print-cards-btn').classList.add('active');
        } else if (sectionId === 'card-draw-section') {
            document.getElementById('card-draw-btn').classList.add('active');
        }
    }

    // Handle file selection
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
    }

    // Handle drag over
    handleDragOver(event) {
        event.preventDefault();
        event.target.classList.add('dragover');
    }

    // Handle file drop
    handleDrop(event) {
        event.preventDefault();
        event.target.classList.remove('dragover');
        const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        this.processFiles(files);
    }

    // Process uploaded files without compression
    processFiles(files) {
        const previewContainer = document.getElementById('upload-previews');
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.createPreviewCard(e.target.result, file.name);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Create preview card for uploaded image
    createPreviewCard(imageSrc, fileName) {
        const previewContainer = document.getElementById('upload-previews');
        const cardDiv = document.createElement('div');
        cardDiv.className = 'preview-card';
        
        // Extract name without extension
        const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
        
        cardDiv.innerHTML = `
            <img src="${imageSrc}" alt="Preview">
            <input type="text" placeholder="Card name" value="${baseName}" maxlength="30">
            <button class="btn btn-primary" onclick="game.addCardFromPreview(this, '${imageSrc}')">Add Card</button>
            <button class="btn" onclick="this.parentElement.remove()">Remove</button>
        `;
        
        previewContainer.appendChild(cardDiv);
    }

    // Add card from preview with IndexedDB storage
    async addCardFromPreview(button, imageSrc) {
        const previewCard = button.parentElement;
        const nameInput = previewCard.querySelector('input');
        const cardName = nameInput.value.trim();
        
        if (!cardName) {
            alert('Please enter a card name');
            return;
        }

        // Check if card already exists
        if (this.cards.some(card => card.name.toLowerCase() === cardName.toLowerCase())) {
            alert('A card with this name already exists');
            return;
        }

        const newCard = {
            id: Date.now() + Math.random(),
            name: cardName,
            image: imageSrc,
            number: this.cards.length + 1
        };

        try {
            // Add to local array first
            this.cards.push(newCard);
            
            // Add to IndexedDB
            await this.addCard(newCard);
            
            previewCard.remove();
            this.showSuccessMessage(`Card "${cardName}" added successfully!`);
            this.updateDeckCount();
        } catch (error) {
            // Remove from local array if IndexedDB save failed
            this.cards.pop();
            console.error('Failed to save card:', error);
            alert(`Failed to save card "${cardName}". Please try again.`);
        }
    }

    // Show success message
    showSuccessMessage(message) {
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #38a169;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        msgDiv.textContent = message;
        document.body.appendChild(msgDiv);
        
        setTimeout(() => msgDiv.remove(), 3000);
    }

    // Generate a new tabla (4x4 board) optimized for printing
    generateTabla() {
        if (this.cards.length < 16) {
            alert('You need at least 16 cards to generate a tabla. Please upload more cards.');
            return;
        }

        // Shuffle cards and select 16 for the tabla
        const shuffledCards = [...this.cards].sort(() => Math.random() - 0.5);
        this.currentTabla = shuffledCards.slice(0, 16);
        
        this.renderTabla();
    }

    // Render the tabla (optimized for printing, no interactivity)
    renderTabla() {
        const tablaContainer = document.getElementById('tabla');
        tablaContainer.innerHTML = '';

        this.currentTabla.forEach((card, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'tabla-cell';
            cellDiv.innerHTML = `
                <img src="${card.image}" alt="${card.name}">
                <div class="cell-info">
                    <div class="cell-name">${card.name}</div>
                    <div class="cell-number">#${card.number}</div>
                </div>
            `;
            
            // No click event listeners - tabla is for printing only
            tablaContainer.appendChild(cellDiv);
        });
    }

    // Print tabla function
    printTabla() {
        if (this.currentTabla.length === 0) {
            alert('No tabla available to print. Please generate a tabla first.');
            return;
        }

        // Add class to body to identify what we're printing
        document.body.classList.add('printing-tabla');
        
        // Print the page
        window.print();
        
        // Remove the class after printing
        setTimeout(() => {
            document.body.classList.remove('printing-tabla');
        }, 1000);
    }

    // Generate new tabla (simplified for printing focus)
    newGame() {
        this.showSection('game-section');
        this.generateTabla();
    }

    // Show deck view
    showDeckView() {
        this.showSection('deck-section');
        this.renderDeckView();
    }

    // Show print cards view
    showPrintCardsView() {
        this.showSection('print-cards-section');
        this.renderAllCardsForPrint();
    }

    // Render all cards for printing
    renderAllCardsForPrint() {
        const allCardsGrid = document.getElementById('all-cards-grid');
        allCardsGrid.innerHTML = '';

        if (this.cards.length === 0) {
            allCardsGrid.innerHTML = '<p style="text-align: center; color: #718096; grid-column: 1/-1;">No cards available. Upload some images to get started!</p>';
            return;
        }

        // Sort cards by number for consistent printing order
        const sortedCards = [...this.cards].sort((a, b) => a.number - b.number);

        sortedCards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'print-card';
            cardDiv.innerHTML = `
                <img src="${card.image}" alt="${card.name}">
                <div class="card-info">
                    <div class="card-name">${card.name}</div>
                    <div class="card-number">#${card.number}</div>
                </div>
            `;
            allCardsGrid.appendChild(cardDiv);
        });
    }

    // Print all cards
    printAllCards() {
        if (this.cards.length === 0) {
            alert('No cards available to print. Please upload some cards first.');
            return;
        }

        // Add class to body to identify what we're printing
        document.body.classList.add('printing-cards');
        
        // Print the page
        window.print();
        
        // Remove the class after printing
        setTimeout(() => {
            document.body.classList.remove('printing-cards');
        }, 1000);
    }

    // Show card draw view
    showCardDrawView() {
        this.showSection('card-draw-section');
        this.updateCardDrawStatus();
        this.renderDrawnCardsHistory();
    }

    // Draw next card for presentation
    drawNextCard() {
        if (this.cards.length === 0) {
            alert('No cards available to draw. Please upload some cards first.');
            return;
        }

        // Get available cards (not yet drawn)
        const availableCards = this.cards.filter(card => 
            !this.drawnCards.includes(card.id)
        );

        if (availableCards.length === 0) {
            alert('All cards have been drawn! Click "Reset Draw" to start over.');
            document.getElementById('draw-next-card-btn').disabled = true;
            return;
        }

        // Pick random card from available cards
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const drawnCard = availableCards[randomIndex];

        // Add to drawn cards
        this.drawnCards.push(drawnCard.id);
        this.drawnCardsHistory.unshift(drawnCard); // Add to beginning for most recent first

        // Display the drawn card
        this.displayDrawnCard(drawnCard);
        
        // Update status and history
        this.updateCardDrawStatus();
        this.renderDrawnCardsHistory();

        // Announce the card (could add text-to-speech here)
        console.log(`Card drawn: ${drawnCard.name} (#${drawnCard.number})`);
    }

    // Display the drawn card in the main area
    displayDrawnCard(card) {
        const mainDrawnCard = document.getElementById('main-drawn-card');
        mainDrawnCard.innerHTML = `
            <div class="drawn-card-display">
                <img src="${card.image}" alt="${card.name}">
                <div class="drawn-card-info">
                    <div class="drawn-card-name">${card.name}</div>
                    <div class="drawn-card-number">#${card.number}</div>
                </div>
            </div>
        `;

        // Add animation effect
        mainDrawnCard.style.transform = 'scale(0.8)';
        mainDrawnCard.style.opacity = '0';
        
        setTimeout(() => {
            mainDrawnCard.style.transition = 'all 0.5s ease';
            mainDrawnCard.style.transform = 'scale(1)';
            mainDrawnCard.style.opacity = '1';
        }, 100);
    }

    // Reset card draw session
    resetCardDraw() {
        if (confirm('Are you sure you want to reset the card draw? This will clear all drawn cards.')) {
            this.drawnCards = [];
            this.drawnCardsHistory = [];
            
            // Reset main display
            const mainDrawnCard = document.getElementById('main-drawn-card');
            mainDrawnCard.innerHTML = `
                <div class="card-placeholder">
                    <h3>Ready to start drawing cards</h3>
                    <p>Click "Draw Card" to begin</p>
                </div>
            `;

            // Re-enable draw button
            document.getElementById('draw-next-card-btn').disabled = false;
            
            // Update status and clear history
            this.updateCardDrawStatus();
            this.renderDrawnCardsHistory();
        }
    }

    // Update card draw status display
    updateCardDrawStatus() {
        const remainingCards = this.cards.length - this.drawnCards.length;
        document.getElementById('cards-remaining').textContent = remainingCards;
        
        // Update draw button state
        const drawButton = document.getElementById('draw-next-card-btn');
        if (remainingCards === 0) {
            drawButton.textContent = 'All Cards Drawn';
            drawButton.disabled = true;
        } else {
            drawButton.textContent = 'Draw Card';
            drawButton.disabled = false;
        }
    }

    // Render drawn cards history
    renderDrawnCardsHistory() {
        const historyContainer = document.getElementById('drawn-cards-list');
        historyContainer.innerHTML = '';

        if (this.drawnCardsHistory.length === 0) {
            historyContainer.innerHTML = '<p style="text-align: center; color: #718096;">No cards drawn yet</p>';
            return;
        }

        this.drawnCardsHistory.forEach(card => {
            const historyCard = document.createElement('div');
            historyCard.className = 'history-card';
            historyCard.innerHTML = `
                <img src="${card.image}" alt="${card.name}">
                <div class="history-card-info">
                    <div class="history-card-name">${card.name}</div>
                    <div class="history-card-number">#${card.number}</div>
                </div>
            `;
            historyContainer.appendChild(historyCard);
        });
    }

    // Toggle fullscreen mode
    toggleFullscreen() {
        const cardDrawSection = document.getElementById('card-draw-section');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        
        if (!this.isFullscreen) {
            // Enter fullscreen
            cardDrawSection.classList.add('fullscreen-mode');
            fullscreenBtn.textContent = 'Exit Fullscreen';
            this.isFullscreen = true;
            
            // Hide other UI elements
            document.querySelector('header').style.display = 'none';
        } else {
            // Exit fullscreen
            cardDrawSection.classList.remove('fullscreen-mode');
            fullscreenBtn.textContent = 'Fullscreen';
            this.isFullscreen = false;
            
            // Show other UI elements
            document.querySelector('header').style.display = 'block';
        }
    }

    // Export deck to JSON file
    exportDeck() {
        if (this.cards.length === 0) {
            alert('No cards available to export. Please upload some cards first.');
            return;
        }

        // Create export data structure
        const exportData = {
            version: "1.0",
            deckName: `Custom Lotería Deck`,
            exportDate: new Date().toISOString(),
            cardCount: this.cards.length,
            cards: this.cards.map(card => ({
                id: card.id,
                name: card.name,
                image: card.image,
                number: card.number
            }))
        };

        // Create and download file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `loteria-deck-${timestamp}.json`;
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Show success feedback
        this.showExportSuccess(filename);
    }

    // Show export success message
    showExportSuccess(filename) {
        const successDiv = document.createElement('div');
        successDiv.className = 'export-success';
        successDiv.textContent = `Deck exported as ${filename}`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    // Import deck from JSON file
    importDeck() {
        document.getElementById('import-file-input').click();
    }

    // Handle import file selection
    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.json')) {
            alert('Please select a valid JSON file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                this.validateAndPreviewImport(importData);
            } catch (error) {
                console.error('Import error:', error);
                alert('Invalid JSON file. Please check the file format and try again.');
            }
        };
        reader.readAsText(file);
    }

    // Validate and preview import data
    validateAndPreviewImport(importData) {
        // Validate required fields
        if (!importData.version || !importData.cards || !Array.isArray(importData.cards)) {
            alert('Invalid deck file format. Missing required fields.');
            return;
        }

        // Validate cards structure
        const validCards = importData.cards.filter(card => 
            card.id && card.name && card.image && card.number !== undefined
        );

        if (validCards.length === 0) {
            alert('No valid cards found in the import file.');
            return;
        }

        if (validCards.length !== importData.cards.length) {
            const skipped = importData.cards.length - validCards.length;
            console.warn(`Skipped ${skipped} invalid cards during import validation.`);
        }

        // Store import data and show preview
        this.pendingImportData = {
            ...importData,
            cards: validCards
        };

        this.showImportPreview();
    }

    // Show import preview modal
    showImportPreview() {
        const modal = document.getElementById('import-options-modal');
        const infoDiv = document.getElementById('import-deck-info');
        
        const data = this.pendingImportData;
        const exportDate = new Date(data.exportDate).toLocaleDateString();
        
        infoDiv.innerHTML = `
            <h4>${data.deckName || 'Imported Deck'}</h4>
            <p><strong>Cards:</strong> ${data.cardCount} cards</p>
            <p><strong>Export Date:</strong> ${exportDate}</p>
            <p><strong>Valid Cards:</strong> ${data.cards.length}</p>
            <p><strong>Current Deck:</strong> ${this.cards.length} cards</p>
        `;
        
        modal.classList.remove('hidden');
    }

    // Confirm import with selected options
    async confirmImport() {
        const modal = document.getElementById('import-options-modal');
        const importMode = document.querySelector('input[name="import-mode"]:checked').value;
        
        if (!this.pendingImportData) {
            alert('No import data available.');
            return;
        }

        // Show progress
        this.showImportProgress();

        try {
            let finalCards = [];
            
            switch (importMode) {
                case 'replace':
                    finalCards = [...this.pendingImportData.cards];
                    break;
                    
                case 'merge':
                    finalCards = [...this.cards];
                    this.pendingImportData.cards.forEach(newCard => {
                        const exists = finalCards.some(card => 
                            card.name.toLowerCase() === newCard.name.toLowerCase()
                        );
                        if (!exists) {
                            finalCards.push(newCard);
                        }
                    });
                    break;
                    
                case 'append':
                    finalCards = [...this.cards, ...this.pendingImportData.cards];
                    break;
            }

            // Update cards and save to IndexedDB
            this.cards = finalCards;
            await this.saveCards();
            
            // Update UI
            this.renderDeckView();
            this.updateDeckCount();
            
            // Hide modal and show success
            modal.classList.add('hidden');
            this.hideImportProgress();
            
            const importedCount = this.pendingImportData.cards.length;
            alert(`Successfully imported ${importedCount} cards!`);
            
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please try again.');
            this.hideImportProgress();
        }
        
        // Clean up
        this.pendingImportData = null;
        document.getElementById('import-file-input').value = '';
    }

    // Cancel import
    cancelImport() {
        const modal = document.getElementById('import-options-modal');
        modal.classList.add('hidden');
        this.pendingImportData = null;
        document.getElementById('import-file-input').value = '';
    }

    // Show import progress
    showImportProgress() {
        // Could be enhanced with actual progress bar
        console.log('Import in progress...');
    }

    // Hide import progress
    hideImportProgress() {
        console.log('Import completed.');
    }

    // Initialize drag and drop for import
    initializeDragAndDrop() {
        const dropZones = [
            document.getElementById('deck-section'),
            document.body
        ];

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                
                // Only show drop effect for JSON files
                if (this.isDeckSection(e.target)) {
                    zone.classList.add('drag-over-import');
                }
            });

            zone.addEventListener('dragleave', (e) => {
                // Only remove class if leaving the zone entirely
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drag-over-import');
                }
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over-import');
                
                const files = Array.from(e.dataTransfer.files);
                const jsonFile = files.find(file => file.name.toLowerCase().endsWith('.json'));
                
                if (jsonFile && this.isDeckSection(e.target)) {
                    this.handleImportFileDirectly(jsonFile);
                }
            });
        });
    }

    // Check if target is within deck section
    isDeckSection(target) {
        const deckSection = document.getElementById('deck-section');
        return deckSection && (deckSection.contains(target) || !deckSection.classList.contains('hidden'));
    }

    // Handle import file directly (for drag and drop)
    handleImportFileDirectly(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                this.validateAndPreviewImport(importData);
            } catch (error) {
                console.error('Import error:', error);
                alert('Invalid JSON file. Please check the file format and try again.');
            }
        };
        reader.readAsText(file);
    }

    // Initialize offline support and PWA features
    initializeOfflineSupport() {
        // Monitor network status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnlineStatusChange();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOnlineStatusChange();
        });

        // Initialize offline indicators
        this.updateOfflineUI();

        // Preload critical assets
        this.preloadCriticalAssets();

        // Setup cache status monitoring
        this.initializeCacheStatus();

        console.log('[PWA] Offline support initialized');
    }

    // Handle online/offline status changes
    handleOnlineStatusChange() {
        this.updateOfflineUI();
        
        if (this.isOnline) {
            console.log('[PWA] Back online');
            this.showConnectionStatus('Connected', 'success');
        } else {
            console.log('[PWA] Gone offline');
            this.showConnectionStatus('Offline Mode', 'warning');
        }
    }

    // Update UI based on offline status
    updateOfflineUI() {
        const body = document.body;
        const offlineIndicator = document.getElementById('offline-indicator');
        
        if (this.isOnline) {
            body.classList.remove('offline-mode');
            if (offlineIndicator) {
                offlineIndicator.classList.add('hidden');
            }
        } else {
            body.classList.add('offline-mode');
            if (offlineIndicator) {
                offlineIndicator.classList.remove('hidden');
            }
        }

        // Update button states for offline mode
        this.updateButtonStatesForOffline();
    }

    // Update button states when offline
    updateButtonStatesForOffline() {
        // All core features work offline with IndexedDB
        // No buttons need to be disabled
        console.log('[PWA] All features available offline');
    }

    // Show connection status notification
    showConnectionStatus(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `connection-status ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Preload critical assets for offline use
    async preloadCriticalAssets() {
        if ('caches' in window) {
            try {
                const cache = await caches.open('loteria-runtime-v1.0');
                
                // Critical assets that should be available offline
                const criticalAssets = [
                    './style.css',
                    './script.js',
                    './manifest.json'
                ];

                for (const asset of criticalAssets) {
                    try {
                        await cache.add(asset);
                        console.log(`[PWA] Cached: ${asset}`);
                    } catch (error) {
                        console.warn(`[PWA] Failed to cache: ${asset}`, error);
                    }
                }
            } catch (error) {
                console.error('[PWA] Cache initialization failed:', error);
            }
        }
    }

    // Initialize cache status monitoring
    initializeCacheStatus() {
        if ('caches' in window) {
            this.monitorCacheStatus();
        }
    }

    // Monitor cache status and usage
    async monitorCacheStatus() {
        try {
            const cacheNames = await caches.keys();
            const totalCaches = cacheNames.length;
            
            if (totalCaches > 0) {
                console.log(`[PWA] ${totalCaches} caches active`);
                this.showCacheStatus(`${totalCaches} caches ready`);
            }
        } catch (error) {
            console.error('[PWA] Cache status check failed:', error);
        }
    }

    // Show cache status indicator
    showCacheStatus(message) {
        const indicator = document.createElement('div');
        indicator.className = 'cache-status';
        indicator.textContent = message;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.classList.add('visible');
        }, 100);
        
        setTimeout(() => {
            indicator.classList.remove('visible');
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }, 2000);
    }

    // Enhanced data persistence for offline use
    async enhancedSaveCards() {
        try {
            // Save to IndexedDB (primary storage)
            await this.saveCards();
            
            // Backup to cache storage for additional redundancy
            if ('caches' in window) {
                const cache = await caches.open('loteria-data-backup-v1.0');
                const dataBlob = new Blob([JSON.stringify(this.cards)], { 
                    type: 'application/json' 
                });
                const response = new Response(dataBlob);
                await cache.put('./cards-backup.json', response);
                console.log('[PWA] Cards backed up to cache');
            }
            
        } catch (error) {
            console.error('[PWA] Enhanced save failed:', error);
            // Fallback to regular save
            await this.saveCards();
        }
    }

    // Offline-aware error handling
    handleOfflineError(operation, error) {
        console.error(`[PWA] ${operation} failed:`, error);
        
        if (!this.isOnline) {
            alert(`${operation} failed in offline mode. This feature requires an internet connection.`);
        } else {
            alert(`${operation} failed. Please try again.`);
        }
    }

    // Clear all caches (for debugging/reset)
    async clearAllCaches() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log('[PWA] All caches cleared');
                alert('All cached data cleared. The app will reload.');
                window.location.reload();
            } catch (error) {
                console.error('[PWA] Cache clearing failed:', error);
            }
        }
    }

    // Render deck view
    renderDeckView() {
        const deckGrid = document.getElementById('deck-grid');
        deckGrid.innerHTML = '';

        if (this.cards.length === 0) {
            deckGrid.innerHTML = '<p style="text-align: center; color: #718096; grid-column: 1/-1;">No cards in deck. Upload some images to get started!</p>';
            return;
        }

        this.cards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'deck-card';
            cardDiv.innerHTML = `
                <img src="${card.image}" alt="${card.name}">
                <div class="card-name">${card.name}</div>
                <div class="card-number">#${card.number}</div>
            `;
            deckGrid.appendChild(cardDiv);
        });
    }

    // Clear all cards from IndexedDB
    async clearDeck() {
        if (confirm('Are you sure you want to delete all cards? This action cannot be undone.')) {
            try {
                this.cards = [];
                this.currentTabla = [];
                await this.saveCards();
                this.renderDeckView();
                this.showSuccessMessage('All cards have been deleted.');
            } catch (error) {
                console.error('Failed to clear deck:', error);
                alert('Failed to clear deck. Please try again.');
            }
        }
    }

    // Update deck count display
    updateDeckCount() {
        const deckCountElement = document.getElementById('deck-count');
        if (deckCountElement) {
            deckCountElement.textContent = this.cards.length;
        }
        
        // Log current storage info for IndexedDB
        console.log(`Cards in IndexedDB: ${this.cards.length}`);
    }

    // Modal functionality
    showModal(imageSrc) {
        const modal = document.getElementById('card-modal');
        const modalImage = document.getElementById('modal-image');
        modalImage.src = imageSrc;
        modal.classList.remove('hidden');
    }

    hideModal() {
        const modal = document.getElementById('card-modal');
        modal.classList.add('hidden');
        document.getElementById('card-name').value = '';
    }

    // Save current card from modal
    saveCurrentCard() {
        const cardName = document.getElementById('card-name').value.trim();
        const imageSrc = document.getElementById('modal-image').src;
        
        if (!cardName) {
            alert('Please enter a card name');
            return;
        }

        const newCard = {
            id: Date.now() + Math.random(),
            name: cardName,
            image: imageSrc,
            number: this.cards.length + 1
        };

        this.cards.push(newCard);
        this.saveCards();
        this.hideModal();
        this.showSuccessMessage(`Card "${cardName}" added successfully!`);
    }
}

// Initialize the game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new LoteriaGame();
});

// Prevent default drag behaviors
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());