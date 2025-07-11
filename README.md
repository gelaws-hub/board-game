# 🎲 Poker Game - Real-time Multiplayer Card Game
This is a Final Project of my Internship program. I didn't have much time to develop this so there are still rooms for improvements and fixes

A modern, real-time multiplayer poker-style card game built with React (frontend) and ASP.NET Core (backend) using SignalR for real-time communication.

## 🚀 Features

### 🎮 Game Features
- **Real-time Multiplayer**: Up to 4 players per game
- **Live Game States**: Waiting for players, In Progress, Finished
- **Turn-based Gameplay**: Players take turns playing cards or drawing from deck
- **Card Validation**: Server-side game rules enforcement
- **Game History**: Track played cards and game progression
- **Spectator Mode**: Watch ongoing games (still being developed)

### 🌐 Networking
- **SignalR Integration**: Real-time bidirectional communication
- **Automatic Reconnection**: Seamless reconnection after connection loss
- **Connection Status**: Visual indicators for connection state
- **Game Session Persistence**: Resume games after disconnection

### 🎨 User Interface
- **Modern Dark Theme**: Sleek glass-morphism design
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Game Board**: Visual card stacks and game state
- **Real-time Updates**: Live player status and game changes
- **Chat System**: In-game messaging between players (still not implemented correctly)

### 👤 Player Management
- **Username System**: Persistent player names with localStorage
- **Player Status**: Ready states, connection indicators
- **Host Controls**: Game leaders can start games
- **Player Hand Management**: Interactive card selection and playing

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **SignalR Client** - Real-time communication
- **Faker.js** - Generate random usernames

### Backend
- **ASP.NET Core 9** - Web API and SignalR hub
- **SignalR** - Real-time communication hub
- **C# 12** - Modern C# with latest features
- **Dependency Injection** - Built-in DI container
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
poker-game/
├── ClientPokerGame/                 # React Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Card.jsx           # Playing card component
│   │   │   ├── GameBoard.jsx      # Game board with card stacks
│   │   │   ├── PlayerHand.jsx     # Player's hand interface
│   │   │   ├── OpponentHand.jsx   # Opponent card display
│   │   │   ├── RemainingDeck.jsx  # Deck with draw button
│   │   │   ├── GameTable.jsx      # Lobby game list
│   │   │   ├── NameInputModal.jsx # Username input modal
│   │   │   └── ConnectionStatus.jsx # Connection indicator
│   │   ├── context/
│   │   │   └── SignalRContext.jsx # SignalR state management
│   │   ├── pages/
│   │   │   ├── GameLobby.jsx      # Main lobby interface
│   │   │   └── Game.jsx           # Game room interface
│   │   └── App.jsx                # Main app component
│   ├── public/                     # Static assets
│   └── package.json               # Dependencies and scripts
│
└── PokerGameCore/                  # ASP.NET Core Backend
    ├── Controllers/
    │   └── GameController.cs       # REST API endpoints
    ├── Domain/
    │   ├── Models/                 # Game entities
    │   │   ├── Game.cs            # Game state model
    │   │   ├── Player.cs          # Player model
    │   │   ├── Card.cs            # Card model
    │   │   ├── Deck.cs            # Deck management
    │   │   └── User.cs            # User model
    │   ├── Enums/                 # Game enumerations
    │   └── Services/              # Business logic
    │       ├── GameService.cs     # Game management
    │       ├── IGameRules.cs      # Game rules interface
    │       └── MinumanGameRules.cs # Game rules implementation
    ├── Hubs/
    │   ├── GameHub.cs             # SignalR hub
    │   └── PlayerConnectionManager.cs # Connection tracking
    └── Program.cs                 # Application startup
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** - For frontend development
- **.NET 9 SDK** - For backend development
- **Modern web browser** - Chrome, Firefox, Safari, Edge

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd poker-game
   \`\`\`

2. **Setup Backend**
   \`\`\`bash
   cd PokerGameCore
   dotnet watch
   \`\`\`
   Backend will run on `http://localhost:5037`

3. **Setup Frontend**
   \`\`\`bash
   cd ClientPokerGame
   npm install
   npm run dev
   \`\`\`
   Frontend will run on `http://localhost:5173`

4. **Environment Configuration**
   Create `.env` file in `ClientPokerGame/`:
   \`\`\`env
   VITE_POKERCORE=http://localhost:5037
   \`\`\`

## 🎯 How to Play

### Game Setup
1. **Enter Your Name**: First-time visitors will be prompted for a username
2. **Create or Join Game**: Create a new game or join an existing one from the lobby
3. **Wait for Players**: Games need at least 2 players to start
4. **Ready Up**: All players must mark themselves as ready
5. **Start Game**: The host can start the game when all players are ready

### Gameplay
1. **Turn-based Play**: Players take turns in order
2. **Play Cards**: Select and play cards that match the current suit
3. **Draw Cards**: Draw from the deck if you can't play
4. **End Turn**: Pass your turn to the next player
5. **Win Condition**: First player to empty their hand wins

### Game Rules
- **Suit Matching**: Cards must match the suit of the first card played in a round
- **Round Winner**: Highest card of the leading suit wins the round
- **Turn Order**: Winner of each round starts the next round
- **Card Hierarchy**: Ace (high) > King > Queen > Jack > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3 > 2 (low)

## 🔧 Development

### Frontend Development
\`\`\`bash
cd ClientPokerGame
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
\`\`\`

### Backend Development
\`\`\`bash
cd PokerGameCore
dotnet run           # Start development server
dotnet build         # Build project
dotnet test          # Run tests (if any)
\`\`\`

### Code Style
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Standard C# conventions
- **Components**: Functional components with hooks
- **State Management**: React Context + SignalR

## 📡 API Reference

### SignalR Hub Methods

#### Client → Server
- `CreateGame(username, gameName)` - Create a new game
- `JoinGame(gameId, username)` - Join an existing game
- `GetPlayerReady(gameId, username)` - Mark player as ready
- `StartGame(gameId, username)` - Start the game (host only)
- `PlayCard(gameId, username, cardSuit, cardRank)` - Play a card
- `DrawCard(gameId, username)` - Draw a card from deck
- `EndTurn(gameId, username)` - End current turn
- `SendMessage(gameId, username, message)` - Send chat message
- `Reconnect(gameId, username)` - Reconnect to game

#### Server → Client
- `AvailableGamesUpdated(games)` - Updated game list
- `GameCreated(game)` - New game created
- `PlayerJoined(user)` - Player joined game
- `GameStateUpdated(game)` - Game state changed (for spectator implementation later)
- `PersonalGameView(gameView)` - Personal game data
- `PlayerReady(player)` - Player ready status
- `CardDrawn(playerId, card)` - Card drawn notification
- `ReceiveMessage(username, message)` - Chat message
- `Error(message)` - Error notification

## 🐛 Troubleshooting

### Common Issues

**Connection Problems**
- Check if backend is running on correct port
- Verify CORS settings in backend
- Check browser console for errors

**Game Not Loading**
- Ensure SignalR connection is established
- Check network connectivity
- Verify game ID is correct

**Cards Not Displaying**
- Check browser console for JavaScript errors
- Ensure card data format is correct
- Verify suit/rank conversion functions

### Debug Mode
Enable debug messages in the lobby to see real-time SignalR events and troubleshoot issues.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SignalR** - For real-time communication
- **Tailwind CSS** - For beautiful styling
- **React** - For the frontend framework
- **ASP.NET Core** - For the robust backend
- **Faker.js** - For generating test data

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Look through existing GitHub issues
3. Create a new issue with detailed description
4. Include browser console logs and steps to reproduce

---

**Happy Gaming! 🎮**
