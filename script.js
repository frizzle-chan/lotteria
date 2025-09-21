// Lotería Game Logic with IndexedDB storage
class LoteriaGame {
    constructor() {
        this.cards = [];
        this.currentTabla = [];
        this.drawnCards = [];
        this.drawnCardsHistory = [];
        this.isFullscreen = false;
        this.dbName = 'LoteriaDB';
        this.dbVersion = 1;
        this.db = null;
        this.initializeDatabase().then(() => {
            this.loadCards().then(() => {
                this.initializeEventListeners();
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