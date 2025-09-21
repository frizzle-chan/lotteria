// Lotería Game Logic
class LoteriaGame {
    constructor() {
        this.cards = this.loadCards();
        this.drawnCards = [];
        this.currentTabla = [];
        this.markedCells = new Set();
        this.initializeEventListeners();
        this.showSection('game-section');
        this.updateDeckCount();
        this.generateTabla();
    }

    // Load cards from localStorage
    loadCards() {
        const savedCards = localStorage.getItem('loteria-cards');
        return savedCards ? JSON.parse(savedCards) : [];
    }

    // Save cards to localStorage
    saveCards() {
        localStorage.setItem('loteria-cards', JSON.stringify(this.cards));
        this.updateDeckCount();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Navigation
        document.getElementById('upload-btn').addEventListener('click', () => this.showSection('upload-section'));
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('view-deck-btn').addEventListener('click', () => this.showDeckView());

        // Upload functionality
        document.getElementById('browse-btn').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        dropZone.addEventListener('click', () => document.getElementById('file-input').click());

        // Game controls
        document.getElementById('draw-card-btn').addEventListener('click', () => this.drawCard());
        document.getElementById('generate-tabla-btn').addEventListener('click', () => this.generateTabla());

        // Modal controls
        document.getElementById('save-card-btn').addEventListener('click', () => this.saveCurrentCard());
        document.getElementById('cancel-card-btn').addEventListener('click', () => this.hideModal());

        // Deck management
        document.getElementById('clear-deck-btn').addEventListener('click', () => this.clearDeck());
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

    // Process uploaded files
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

    // Add card from preview
    addCardFromPreview(button, imageSrc) {
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

        this.cards.push(newCard);
        this.saveCards();
        previewCard.remove();
        
        // Show success message
        this.showSuccessMessage(`Card "${cardName}" added successfully!`);
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

    // Generate a new tabla (4x4 game board)
    generateTabla() {
        if (this.cards.length < 16) {
            alert('You need at least 16 cards to generate a tabla. Please upload more cards.');
            return;
        }

        // Shuffle cards and select 16 for the tabla
        const shuffledCards = [...this.cards].sort(() => Math.random() - 0.5);
        this.currentTabla = shuffledCards.slice(0, 16);
        this.markedCells.clear();
        
        this.renderTabla();
    }

    // Render the tabla
    renderTabla() {
        const tablaContainer = document.getElementById('tabla');
        tablaContainer.innerHTML = '';

        this.currentTabla.forEach((card, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'tabla-cell';
            cellDiv.dataset.cardId = card.id;
            cellDiv.innerHTML = `
                <img src="${card.image}" alt="${card.name}">
                <div class="cell-name">${card.name}</div>
                <div class="cell-number">#${card.number}</div>
            `;
            
            cellDiv.addEventListener('click', () => this.toggleCell(index, card.id));
            tablaContainer.appendChild(cellDiv);
        });
    }

    // Toggle cell marking
    toggleCell(index, cardId) {
        const cell = document.querySelector(`[data-card-id="${cardId}"]`);
        
        if (this.markedCells.has(cardId)) {
            this.markedCells.delete(cardId);
            cell.classList.remove('marked');
        } else {
            this.markedCells.add(cardId);
            cell.classList.add('marked');
        }

        this.checkForWin();
    }

    // Check for winning condition (simplified - any row, column, or diagonal)
    checkForWin() {
        if (this.markedCells.size < 4) return;

        const marked = Array.from(this.markedCells);
        const tablaIds = this.currentTabla.map(card => card.id);
        
        // Convert to 4x4 grid positions
        const markedPositions = marked.map(cardId => tablaIds.indexOf(cardId));
        
        // Check rows
        for (let row = 0; row < 4; row++) {
            const rowPositions = [row * 4, row * 4 + 1, row * 4 + 2, row * 4 + 3];
            if (rowPositions.every(pos => markedPositions.includes(pos))) {
                this.announceWin('Row');
                return;
            }
        }

        // Check columns
        for (let col = 0; col < 4; col++) {
            const colPositions = [col, col + 4, col + 8, col + 12];
            if (colPositions.every(pos => markedPositions.includes(pos))) {
                this.announceWin('Column');
                return;
            }
        }

        // Check diagonals
        const diagonal1 = [0, 5, 10, 15];
        const diagonal2 = [3, 6, 9, 12];
        
        if (diagonal1.every(pos => markedPositions.includes(pos))) {
            this.announceWin('Diagonal');
        } else if (diagonal2.every(pos => markedPositions.includes(pos))) {
            this.announceWin('Diagonal');
        }
    }

    // Announce win
    announceWin(type) {
        setTimeout(() => {
            alert(`¡LOTERÍA! You won with a ${type}! 🎉`);
        }, 100);
    }

    // Draw a card
    drawCard() {
        if (this.cards.length === 0) {
            alert('No cards available. Please upload some cards first.');
            return;
        }

        const availableCards = this.cards.filter(card => !this.drawnCards.includes(card.id));
        
        if (availableCards.length === 0) {
            alert('All cards have been drawn! Starting a new round.');
            this.drawnCards = [];
            return;
        }

        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        this.drawnCards.push(randomCard.id);
        
        this.displayDrawnCard(randomCard);
        this.updateDrawnCount();

        // Announce the card
        this.announceCard(randomCard);
    }

    // Display drawn card
    displayDrawnCard(card) {
        const drawnCardContainer = document.getElementById('drawn-card');
        drawnCardContainer.className = 'drawn-card';
        drawnCardContainer.innerHTML = `
            <img src="${card.image}" alt="${card.name}">
            <div class="card-name">${card.name}</div>
            <div class="card-number">#${card.number}</div>
        `;
    }

    // Announce card (could be enhanced with text-to-speech)
    announceCard(card) {
        console.log(`Card drawn: ${card.name} (#${card.number})`);
        
        // Simple visual feedback
        const drawnCard = document.getElementById('drawn-card');
        drawnCard.style.transform = 'scale(1.1)';
        setTimeout(() => {
            drawnCard.style.transform = 'scale(1)';
        }, 300);
    }

    // Start new game
    newGame() {
        this.drawnCards = [];
        this.markedCells.clear();
        this.showSection('game-section');
        this.generateTabla();
        this.updateDrawnCount();
        
        // Reset drawn card display
        const drawnCardContainer = document.getElementById('drawn-card');
        drawnCardContainer.className = 'drawn-card-placeholder';
        drawnCardContainer.innerHTML = '<p>Click "Draw Card" to start the game!</p>';
    }

    // Show deck view
    showDeckView() {
        this.showSection('deck-section');
        this.renderDeckView();
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

    // Clear all cards
    clearDeck() {
        if (confirm('Are you sure you want to delete all cards? This action cannot be undone.')) {
            this.cards = [];
            this.drawnCards = [];
            this.currentTabla = [];
            this.markedCells.clear();
            this.saveCards();
            this.renderDeckView();
            this.showSuccessMessage('All cards have been deleted.');
        }
    }

    // Update deck count display
    updateDeckCount() {
        document.getElementById('deck-count').textContent = this.cards.length;
    }

    // Update drawn count display
    updateDrawnCount() {
        document.getElementById('drawn-count').textContent = this.drawnCards.length;
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