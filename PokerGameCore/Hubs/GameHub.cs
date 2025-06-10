using Microsoft.AspNetCore.SignalR;
using PokerGameCore.Domain.Services;
using PokerGameCore.Domain.Models;
using PokerGameCore.Domain.Enums;

namespace PokerGameCore.Hubs
{
    public class GameHub(GameService gameService, PlayerConnectionManager connectionManager) : Hub
    {
        private readonly GameService _gameService = gameService;
        private readonly PlayerConnectionManager _connections = connectionManager;
        private static readonly Dictionary<Guid, Timer> _cleanupTimers = [];

        private List<object> BuildBasicGameList()
        {
            List<Game> games = _gameService.GetAllGames();

            return games.Select(g => new
            {
                gameId = g.Id,
                gameName = g.Name,
                playerCount = g.Players.Count,
                gameState = g.State.ToString(),
                gameLeader = g.GameLeader?.User.Username ?? "None"
            }).Cast<object>().ToList();
        }

        public async Task SendMessage(Guid gameId, string username, string message)
        {
            await Clients.Group(gameId.ToString()).SendAsync("ReceiveMessage", username, message);
        }

        public async Task BroadcastGameList()
        {
            var basicGameList = BuildBasicGameList();
            await Clients.All.SendAsync("AvailableGamesUpdated", basicGameList);
        }

        public async Task<Game> CreateGame(string username, string gameName = "New Game")
        {
            User user = new() { Id = Guid.NewGuid(), Username = username };
            Game game = _gameService.CreateGame(user, gameName);

            // Map connection ID after player is added
            var player = game.FindPlayerByUsername(username);
            if (player != null)
            {
                _connections.MapPlayerToConnection(player.Id, Context.ConnectionId);
            }

            await BroadcastGameList();
            await Clients.Caller.SendAsync("GameCreated", game);
            await Groups.AddToGroupAsync(Context.ConnectionId, game.Id.ToString());

            return game;
        }

        public async Task<User> CreateUser(string username)
        {
            User user = new() { Id = Guid.NewGuid(), Username = username };
            await Clients.Caller.SendAsync("UserCreated", user);

            return user;
        }

        public async Task JoinGame(Guid gameId, string username)
        {
            Game? game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }

            if (game.Players.Any(p => p.User.Username == username))
            {
                await Clients.Caller.SendAsync("Error", "Please choose another username.");
                return;
            }

            User user = new() { Id = Guid.NewGuid(), Username = username };
            bool joined = _gameService.AddPlayerToGame(gameId, user);

            if (!joined)
            {
                await Clients.Caller.SendAsync("Error", "Failed to join game.");
                return;
            }

            // Find and map the player
            Player? player = game.FindPlayerByUsername(username);
            if (player != null)
            {
                _connections.MapPlayerToConnection(player.Id, Context.ConnectionId);
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, gameId.ToString());
            await Clients.Group(gameId.ToString()).SendAsync("PlayerJoined", user);
            await PrivateGameView(gameId);
            await Clients.Caller.SendAsync("GameJoined", game);
            await BroadcastGameList();
        }

        public async Task GetPlayerReady(Guid gameId, string username)
        {
            Game? game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }

            Player? player = game.FindPlayerByUsername(username);
            if (player == null)
            {
                await Clients.Caller.SendAsync("Error", "Player not found.");
                return;
            }

            _gameService.GetPlayerReady(gameId, player);

            await Clients.Group(gameId.ToString()).SendAsync("PlayerReady", player);
            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
            await Clients.Group(gameId.ToString()).SendAsync("IsAllPlayersReady", game.IsAllPlayersReady);
            await PrivateGameView(gameId);
        }

        public async Task StartGame(Guid gameId, string username, int initialCards = 5)
        {

            Game? game = _gameService.GetGame(gameId);
            Player? player = game?.FindPlayerByUsername(username);
            if (player != game?.GameLeader)
                throw new Exception("Only the game leader can start the game");

            if (player == null)
                return;

            await GetPlayerReady(gameId, player.User.Username);

            bool started = _gameService.StartGame(gameId, initialCards);
            if (!started)
            {
                await Clients.Caller.SendAsync("Error", "Failed to start game.");
                return;
            }

            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
            await PrivateGameView(gameId);
        }

        public async Task PlayCard(Guid gameId, string username, string cardSuitString, string cardRankString)
        {
            Game? game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }

            Player? player = game?.FindPlayerByUsername(username);
            if (player == null)
            {
                await Clients.Caller.SendAsync("Error", "Player not found.");
                return;
            }

            Card? card = player.FindCardInHand(cardRankString, cardSuitString);
            if (card == null)
            {
                await Clients.Caller.SendAsync("Error", $"Card not found in your hand: {cardRankString} of {cardSuitString}.");
                return;
            }

            bool played = _gameService.PlayCard(gameId, player, card);

            if (!played)
            {
                await Clients.Caller.SendAsync("Error", "Invalid card play.");
                return;
            }

            game = _gameService.GetGame(gameId);

            // Delete the game from dictionary after finishing
            if (game?.State == GameState.Finished && !_cleanupTimers.ContainsKey(game.Id))
            {
                Timer timer = new(_ =>
                {
                    _gameService.DeleteGame(game.Id);
                    _cleanupTimers.Remove(game.Id);
                    Console.WriteLine($"Game {game.Id} deleted 5 minutes after finishing.");

                }, null, TimeSpan.FromMinutes(5), Timeout.InfiniteTimeSpan);


                _cleanupTimers[game.Id] = timer;
            }


            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
            await PrivateGameView(gameId);
        }

        public async Task DrawCard(Guid gameId, string username)

        {
            Game? game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }

            Player? _player = game.FindPlayerByUsername(username);
            if (_player == null)
            {
                await Clients.Caller.SendAsync("Error", "Player not found.");
                return;
            }

            Card? card = _gameService.DrawCard(gameId, _player!);

            Console.WriteLine($"drawcard : {game} - {card} - {_player!.Id}");

            if (card == null)
            {
                await Clients.Caller.SendAsync("Error", "No cards left to draw.");
                return;
            }

            await Clients.Group(gameId.ToString()).SendAsync("CardDrawn", _player!.Id, card);
            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
            await PrivateGameView(gameId);
        }

        public async Task EndTurn(Guid gameId, string username)
        {
            Game? game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }
            Player? player = game.FindPlayerByUsername(username);
            _gameService.EndTurn(gameId, player);

            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
        }

        public async Task PrivateGameView(Guid gameId)
        {
            Game? game = _gameService.GetGame(gameId);
            if (game == null)
                return;

            foreach (Player player in game.Players)
            {
                var personalGameView = new
                {
                    gameId = game.Id,
                    gameState = game.State,
                    currentTurnPlayer = game.CurrentPlayer,
                    playerInfo = player,
                    opponents = game.Players
                        .Where(p => p.Id != player.Id)
                        .Select(p => new
                        {
                            playerId = p.Id,
                            userId = p.User.Id,
                            username = p.User.Username,
                            isConnected = p.IsConnected,
                            remainingCards = p.RemainingCardNum
                        }),
                    minumPile = game.MinumPile,
                    boardHistory = game.BoardHistory,
                    currentSubRoundCards = game.CurrentSubRoundCards,
                    currentBoardCard = game.CurrentBoardCard,
                };
                if (_connections.TryGetConnection(player.Id, out string? connId))
                {
                    await Clients.Client(connId!).SendAsync("PersonalGameView", personalGameView);
                }
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _connections.RemoveConnection(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async Task Reconnect(Guid gameId, string username)
        {
            Game? game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }

            Player? player = game.FindPlayerByUsername(username);
            if (player == null)
            {
                await Clients.Caller.SendAsync("Error", "Player not found.");
                return;
            }

            // Remove any old connections and map new one
            _connections.RemoveConnection(Context.ConnectionId);
            _connections.MapPlayerToConnection(player.Id, Context.ConnectionId);

            // Add player back to SignalR group for the game
            await Groups.AddToGroupAsync(Context.ConnectionId, gameId.ToString());

            // Notify the client with updated game view
            var personalGameView = new
            {
                gameId = game.Id,
                gameState = game.State,
                currentTurnPlayer = game.CurrentPlayer,
                playerInfo = player,
                opponents = game.Players
                    .Where(p => p.Id != player.Id)
                    .Select(p => new
                    {
                        playerId = p.Id,
                        userId = p.User.Id,
                        username = p.User.Username,
                        isConnected = p.IsConnected,
                        remainingCards = p.RemainingCardNum
                    }),
                minumPile = game.MinumPile,
                boardHistory = game.BoardHistory,
                currentSubRoundCards = game.CurrentSubRoundCards,
                currentBoardCard = game.CurrentBoardCard,
            };

            Console.WriteLine($"Player {player.User.Username} - {player.Id} reconnected with {Context.ConnectionId}");

            // Send updated personal view to client
            await Clients.Caller.SendAsync("PersonalGameView", personalGameView);
            // Optional: also update general game state for all
            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
        }

    }
}
