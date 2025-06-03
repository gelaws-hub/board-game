using Microsoft.AspNetCore.SignalR;
using PokerGameCore.Domain.Services;
using PokerGameCore.Domain.Models;

namespace PokerGameCore.Hubs
{
    public class GameHub : Hub
    {
        private readonly GameService _gameService;

        private readonly Dictionary<string, CancellationTokenSource> _heartbeatTokens = new();

        public GameHub(GameService gameService)
        {
            _gameService = gameService;
        }

        public async Task SendMessage(string username, string message)
        {
            await Clients.All.SendAsync("ReceieveMessage", username, message);
        }

        public async Task BroadcastGameList()
        {
            var games = _gameService.GetAllGames();
            await Clients.All.SendAsync("AvailableGamesUpdated", games);
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

        public override async Task OnConnectedAsync()
        {
            var cts = new CancellationTokenSource();
            _heartbeatTokens.TryAdd(Context.ConnectionId, cts);

            _ = Task.Run(async () =>
            {
                try
                {
                    while (!cts.Token.IsCancellationRequested)
                    {
                        await Clients.Caller.SendAsync("Heartbeat", $"Server heartbeat: {DateTime.Now:HH:mm:ss}");

                        // Or, if you want ALL clients to see every heartbeat (less common for a direct test)
                        // await Clients.All.SendAsync("Heartbeat", $"Server heartbeat (to all): {DateTime.Now:HH:mm:ss}");

                        await Task.Delay(3000, cts.Token); // Wait for 3 seconds
                    }
                }
                catch (TaskCanceledException)
                {
                    // This is expected when the client disconnects
                    Console.WriteLine($"Heartbeat task for {Context.ConnectionId} cancelled.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in heartbeat task for {Context.ConnectionId}: {ex.Message}");
                }
            }, cts.Token); // Pass the token to Task.Run

            await base.OnConnectedAsync(); // Call the base method
        }
    }
}
