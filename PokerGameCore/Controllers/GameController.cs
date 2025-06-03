using Microsoft.AspNetCore.Mvc;
using PokerGameCore.Domain.Services;
using PokerGameCore.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace PokerGameCore.Controllers
{
    [ApiController]
    [Route("game")]
    public class GameController : ControllerBase
    {
        private readonly GameService _gameService;
        // Use a traditional constructor or primary constructor for both
        public GameController(GameService gameService, IHubContext<GameHub> hubContext)
        {
            _gameService = gameService;
        }

        [HttpGet("status/{id}")]
        public IActionResult GetStatus(Guid id)
        {
            var game = _gameService.GetGame(id);
            if (game == null)
                return NotFound("Game not found.");

            return Ok(game);
        }
    }
}