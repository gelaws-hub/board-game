using Microsoft.AspNetCore.Mvc;
using PokerGameCore.Domain.Services;
using PokerGameCore.Domain.Models;

namespace PokerGameCore.Controllers
{
    [ApiController]
    [Route("game")]
    public class GameController(GameService gameService) : ControllerBase
    {
        private readonly GameService _gameService = gameService;

        [HttpPost("create")]
        public IActionResult CreateGame()
        {
            var game = _gameService.CreateGame();
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
        public IActionResult Join(Guid id, [FromQuery] string username)
        {
            var game = _gameService.GetGame(id);
            if (game == null)
                return NotFound("Game not found.");

            var user = new User { Id = Guid.NewGuid(), Username = username };
            bool success = _gameService.AddPlayerToGame(id, user);
            if (!success)
                return BadRequest("Could not join game.");

            return Ok(new { message = "Player joined", userId = user.Id });
        }

        [HttpPost("{id}/start")]
        public IActionResult Start(Guid id)
        {
            bool success = _gameService.StartGame(id);
            if (!success)
                return BadRequest("Could not start game.");

            var game = _gameService.GetGame(id);
            return Ok(new { message = "Game started", state = game?.State });
        }
    }
}
