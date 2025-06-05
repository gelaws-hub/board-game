using Microsoft.AspNetCore.SignalR;
using PokerGameCore.Domain.Services;
using PokerGameCore.Domain.Models;
using PokerGameCore.Domain.Enums;

namespace PokerGameCore.Hubs
{
    public class GameHub(GameService gameService) : Hub
    {
        private readonly GameService _gameService = gameService;

        public async Task SendMessage(string username, string message)
        {
            await Clients.All.SendAsync("ReceieveMessage", username, message);
        }

        public async Task BroadcastGameList()
        {
            var games = _gameService.GetAllGames();
            await Clients.All.SendAsync("AvailableGamesUpdated", games);
        }

        public async Task<Game> CreateGame()
        {
            var game = _gameService.CreateGame();

            await BroadcastGameList();
            await Clients.Caller.SendAsync("GameCreated", game);

            return game;
        }

        public async Task<User> CreateUser(string username)
        {
            var user = new User { Id = Guid.NewGuid(), Username = username };
            await Clients.Caller.SendAsync("UserCreated", user);

            return user;
        }

        public async Task JoinGame(Guid gameId, string username)
        {
            var game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }

            if (game.Players.Any(p => p.User.Username == username))
                await Clients.Caller.SendAsync("Error", "Please Choose another Username");

            var user = new User { Id = Guid.NewGuid(), Username = username };
            bool joined = _gameService.AddPlayerToGame(gameId, user);

            if (!joined)
            {
                await Clients.Caller.SendAsync("Error", "Failed to join game.");
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, gameId.ToString());

            await Clients.Group(gameId.ToString()).SendAsync("PlayerJoined", user);

            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);

            await BroadcastGameList();
        }

        public async Task StartGame(Guid gameId)
        {
            var started = _gameService.StartGame(gameId);
            if (!started)
            {
                await Clients.Caller.SendAsync("Error", "Failed to start game.");
                return;
            }

            var game = _gameService.GetGame(gameId);
            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
        }

        public async Task PlayCard(Guid gameId, Guid playerId, string cardSuitString, string cardRankString)
        {
            var game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }

            var player = game.Players.FirstOrDefault(p => p.Id == playerId);
            if (player == null)
            {
                await Clients.Caller.SendAsync("Error", "Player not found.");
                return;
            }

            var card = player.FindCardInHand(cardRankString, cardSuitString);
            if (card == null)
            {
                await Clients.Caller.SendAsync("Error", $"Card not found in your hand: {cardRankString} of {cardSuitString}.");
                return;
            }

            bool played = _gameService.PlayCard(gameId, playerId, card);

            if (!played)
            {
                await Clients.Caller.SendAsync("Error", "Invalid card play.");
                return;
            }

            game = _gameService.GetGame(gameId);
            Console.WriteLine($"playcard log : {game} - {played}");

            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
        }

        public async Task PlayCardTest(Guid gameId, Guid playerId, Card card)
        {
            bool played = _gameService.PlayCard(gameId, playerId, card);

            if (!played)
            {
                await Clients.Caller.SendAsync("Error", "Invalid card play.");
                return;
            }

            await PrivateGameView(gameId);
        }

        public async Task DrawCard(Guid gameId, Guid playerId)
        {
            var card = _gameService.DrawCard(gameId, playerId);
            var game = _gameService.GetGame(gameId);

            Console.WriteLine($"drawcard : {game} - {card} - {playerId}");

            if (card == null)
            {
                await Clients.Caller.SendAsync("Error", "No cards left to draw.");
                return;
            }

            await Clients.Group(gameId.ToString()).SendAsync("CardDrawn", playerId, card);
            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
        }

        public async Task EndTurn(Guid gameId, Guid playerId)
        {
            _gameService.EndTurn(gameId, playerId);
            var game = _gameService.GetGame(gameId);

            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
        }

        private async Task PrivateGameView(Guid gameId)
        {
            var game = _gameService.GetGame(gameId);
            if (game == null)
                return;

            foreach (Player player in game.Players)
            {
                var personalGameView = new
                {
                    gameId = game.Id,
                    currentTurnPlayer = game.CurrentPlayer,
                    playerInfo = player,
                    opponents = game.Players
                        .Where(p => p.Id != player.Id)
                        .Select(p => new
                        {
                            playerId = p.Id,
                            user = p.User,
                            isConnected = p.IsConnected
                        }),
                    boardHistory = game.BoardHistory,

                };
                await Clients.User(player.Id.ToString()).SendAsync("GameStateUpdated", personalGameView);
            }
        }
    }
}
