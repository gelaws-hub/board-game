using Microsoft.AspNetCore.Mvc;
using PokerGameCore.Domain.Services;
using PokerGameCore.Hubs;
using PokerGameCore.Domain.Models;
using Microsoft.AspNetCore.SignalR;

namespace PokerGameCore.Controllers
{
    [ApiController]
    [Route("game")]
    public class GameController : ControllerBase
    {
        private readonly GameService _gameService;
        private readonly IHubContext<GameHub> _hubContext; // Inject IHubContext here

        // Use a traditional constructor or primary constructor for both
        public GameController(GameService gameService, IHubContext<GameHub> hubContext)
        {
            _gameService = gameService;
            _hubContext = hubContext; // Assign the injected hub context
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateGame() // Make the action async
        {
            var game = _gameService.CreateGame();
            // Directly invoke the broadcast from the controller
            // You need to call GetAllGames() from your service to get the latest list
            var updatedGames = _gameService.GetAllGames();
            await _hubContext.Clients.All.SendAsync("AvailableGamesUpdated", updatedGames);

            return Ok(new
            {
                gameId = game.Id,
                message = "Game created successfully.",
                state = game.State.ToString()
            });
        }

        [HttpGet("status/{id}")]
        public IActionResult GetStatus(Guid id)
        {
            var game = _gameService.GetGame(id);
            if (game == null)
                return NotFound("Game not found.");

            return Ok(game);
        }

        [HttpPost("{id}/join")]
        public async Task<IActionResult> Join(Guid id, [FromQuery] string username)
        {
            var game = _gameService.GetGame(id);
            if (game == null)
                return NotFound("Game not found.");

            var user = new User { Id = Guid.NewGuid(), Username = username };
            bool success = _gameService.AddPlayerToGame(id, user);
            if (!success)
                return BadRequest("Could not join game.");

            // Directly invoke the broadcast from the controller
            var updatedGames = _gameService.GetAllGames();
            await _hubContext.Clients.All.SendAsync("AvailableGamesUpdated", updatedGames);

            return Ok(new { message = "Player joined", userId = user.Id });
        }

        [HttpPost("{id}/start")]
        public async Task<IActionResult> Start(Guid id)
        {
            bool success = _gameService.StartGame(id);
            if (!success)
                return BadRequest("Could not start game.");

            // Directly invoke the broadcast from the controller
            var updatedGames = _gameService.GetAllGames();
            await _hubContext.Clients.All.SendAsync("AvailableGamesUpdated", updatedGames);

            var game = _gameService.GetGame(id);
            return Ok(new { message = "Game started", state = game?.State });
        }
    }
}