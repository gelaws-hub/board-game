using Microsoft.AspNetCore.SignalR;
using PokerGameCalled.Application.Services;
using PokerGameCalled.Domain.Models;

namespace PokerGameCalled.Hubs
{
    public class GameHub : Hub
    {
        private readonly GameService _gameService;

        public GameHub(GameService gameService)
        {
            _gameService = gameService;
        }

        public async Task JoinGame(Guid gameId, string username)
        {
            var game = _gameService.GetGame(gameId);
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
                return;
            }

            var user = new User { Id = Guid.NewGuid(), Username = username };
            bool joined = _gameService.AddPlayerToGame(gameId, user);

            if (!joined)
            {
                await Clients.Caller.SendAsync("Error", "Failed to join game.");
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, gameId.ToString());

            await Clients.Group(gameId.ToString()).SendAsync("PlayerJoined", user.Username);

            // Optional: send updated player list
            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
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
            await Clients.Group(gameId.ToString()).SendAsync("GameStarted", game);
        }

        public async Task PlayCard(Guid gameId, Guid playerId, Card card)
        {
            bool played = _gameService.PlayCard(gameId, playerId, card);
            var game = _gameService.GetGame(gameId);

            if (!played)
            {
                await Clients.Caller.SendAsync("Error", "Invalid card play.");
                return;
            }

            await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdated", game);
        }

        public async Task DrawCard(Guid gameId, Guid playerId)
        {
            var card = _gameService.DrawCard(gameId, playerId);
            var game = _gameService.GetGame(gameId);

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
    }
}
