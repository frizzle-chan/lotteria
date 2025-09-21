# 🎯 Lotería - Mexican Bingo Webapp

A fun web application where you can upload your own photos to create custom cards for playing Lotería (Mexican Bingo). Transform your memories into a personalized bingo game!

## 🎮 Features

- **Custom Card Creation**: Upload photos and add names to create your own Lotería cards
- **4×4 Game Board (Tabla)**: Automatically generates random game boards from your uploaded cards
- **Interactive Gaming**: Click to mark cards on your tabla as they're drawn
- **Deck Management**: View all your cards and manage your deck
- **Win Detection**: Automatically detects when you get a row, column, or diagonal
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Your cards are saved in your browser for future games

## 🚀 Getting Started

### Quick Start
1. Clone this repository or download the files
2. Open `index.html` in your web browser
3. Start uploading your photos to create cards!

### Using a Local Server (Recommended)
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have it installed)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

## 📖 How to Play

### Setting Up Your Game
1. **Upload Cards**: Click "Upload Cards" and add photos with names
2. **Create Your Deck**: You need at least 16 cards to play
3. **Generate Tabla**: Click "New Game" to create your 4×4 game board

### Playing the Game
1. Click "Draw Card" to randomly select a card
2. If the drawn card appears on your tabla, click it to mark it
3. Try to get four in a row (horizontally, vertically, or diagonally)
4. When you win, you'll see "¡LOTERÍA!" 🎉

### Traditional Lotería Rules
- Each player gets one or more tablas (game boards)
- Cards are drawn randomly and announced
- Players mark matching cards on their tabla
- First to complete a linha (row, column, or diagonal) wins
- Traditional games use 54 unique cards

## 🎨 Customization

The webapp stores your cards locally in your browser. You can:
- Upload any image format (PNG, JPG, GIF, etc.)
- Add custom names for each card
- Build up to 54 cards (traditional deck size)
- Clear your deck and start over anytime

## 🛠️ Technical Details

- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **Storage**: Browser localStorage for card persistence
- **Image Handling**: FileReader API for client-side image processing
- **Responsive**: CSS Grid and Flexbox for mobile-friendly design
- **No Backend Required**: Runs entirely in the browser

## 📱 Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript features
- CSS Grid and Flexbox
- FileReader API
- localStorage

## 🤝 Contributing

Feel free to fork this repository and submit pull requests! Some ideas for improvements:
- Sound effects and music
- Multiplayer support
- Text-to-speech card announcements
- Different board sizes (3×3, 5×5)
- Card import/export functionality
- Animation improvements

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🎊 Have Fun!

Enjoy creating your personalized Lotería game with family photos, pet pictures, favorite foods, or anything else you love!