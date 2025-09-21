// Lotería Game Logic
class LoteriaGame {
    constructor() {
        this.cards = this.loadCards();
        this.currentTabla = [];
        this.initializeEventListeners();
        this.showSection('game-section');
        this.generateTabla();
    }

    // Load cards from localStorage
    loadCards() {
        const savedCards = localStorage.getItem('loteria-cards');
        return savedCards ? JSON.parse(savedCards) : [];
    }

    // Save cards to localStorage with error handling
    saveCards() {
        try {
            localStorage.setItem('loteria-cards', JSON.stringify(this.cards));
            this.updateDeckCount();
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                this.handleStorageQuotaExceeded();
            } else {
                console.error('Error saving cards:', error);
                alert('Error saving cards. Please try again.');
            }
        }
    }

    // Handle storage quota exceeded error
    handleStorageQuotaExceeded() {
        alert('Storage limit exceeded! Your images are too large. Please try uploading smaller images or use fewer cards.');
        console.warn('localStorage quota exceeded. Consider compressing images or reducing the number of cards.');
        
        // Optionally, we could try to compress existing images or remove some cards
        // For now, just inform the user
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
        document.getElementById('draw-card-btn')?.addEventListener('click', () => this.drawCard());
        document.getElementById('generate-tabla-btn').addEventListener('click', () => this.generateTabla());
        document.getElementById('print-tabla-btn').addEventListener('click', () => this.printTabla());

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

    // Compress image to reduce storage size
    compressImage(file, maxWidth = 400, maxHeight = 533, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions maintaining 3:4 aspect ratio
                let { width, height } = img;
                
                // Scale down if image is too large
                if (width > maxWidth || height > maxHeight) {
                    const widthRatio = maxWidth / width;
                    const heightRatio = maxHeight / height;
                    const ratio = Math.min(widthRatio, heightRatio);
                    
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Process uploaded files with compression
    async processFiles(files) {
        const previewContainer = document.getElementById('upload-previews');
        
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    // Compress the image before processing
                    const compressedImageSrc = await this.compressImage(file);
                    this.createPreviewCard(compressedImageSrc, file.name);
                } catch (error) {
                    console.error('Error processing image:', error);
                    alert(`Error processing image ${file.name}. Please try a different image.`);
                }
            }
        }
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

    // Add card from preview with better error handling
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

        // Add to cards array
        this.cards.push(newCard);
        
        // Try to save - if it fails, remove the card from the array
        try {
            this.saveCards();
            previewCard.remove();
            this.showSuccessMessage(`Card "${cardName}" added successfully!`);
        } catch (error) {
            // Remove the card we just added since saving failed
            this.cards.pop();
            console.error('Failed to save card:', error);
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
        window.print();
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
            this.currentTabla = [];
            this.saveCards();
            this.renderDeckView();
            this.showSuccessMessage('All cards have been deleted.');
        }
    }

    // Update deck count display and storage info
    updateDeckCount() {
        const deckCountElement = document.getElementById('deck-count');
        if (deckCountElement) {
            deckCountElement.textContent = this.cards.length;
        }
        
        // Update storage usage info
        this.updateStorageInfo();
    }

    // Update storage usage information
    updateStorageInfo() {
        try {
            const cardsData = JSON.stringify(this.cards);
            const currentSize = new Blob([cardsData]).size;
            const currentSizeMB = (currentSize / (1024 * 1024)).toFixed(2);
            
            // Estimate localStorage limit (usually 5-10MB, we'll use 5MB as conservative estimate)
            const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
            const usagePercent = Math.round((currentSize / estimatedLimit) * 100);
            
            console.log(`Storage usage: ${currentSizeMB}MB (${usagePercent}% of estimated 5MB limit)`);
            
            // Show warning if approaching limit
            if (usagePercent > 80) {
                console.warn('Storage usage is high. Consider using smaller images or fewer cards.');
            }
        } catch (error) {
            console.log('Could not calculate storage usage:', error);
        }
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