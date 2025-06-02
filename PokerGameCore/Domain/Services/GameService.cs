using PokerGameCalled.Domain.Models;
using PokerGameCalled.Domain.Services;
using PokerGameCalled.Domain.Enums;
using System.Collections.Concurrent;

namespace PokerGameCalled.Application.Services
{
    public class GameService
    {
        private readonly IGameRules _rules;
        private readonly ConcurrentDictionary<Guid, Game> _games = new();

        public GameService(IGameRules rules)
        {
            _rules = rules;
        }

        public Game CreateGame()
        {
            var game = new Game();
            _games[game.Id] = game;
            return game;
        }

        public Game? GetGame(Guid gameId)
        {
            _games.TryGetValue(gameId, out var game);
            return game;
        }

        public bool AddPlayerToGame(Guid gameId, User user)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return false;

            if (game.State != GameState.WaitingForPlayers)
                return false;

            if (game.Players.Any(p => p.User.Id == user.Id))
                return false;

            game.Players.Add(new Player { Id = Guid.NewGuid(), User = user });

            return true;
        }

        public bool StartGame(Guid gameId)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return false;

            if (game.Players.Count < 2)
                return false;

            // Deal 5 cards each (or more)
            foreach (var player in game.Players)
            {
                for (int i = 0; i < 5; i++)
                {
                    var card = game.MinumPile.DrawCard();
                    if (card != null)
                        player.Hand.Add(card);
                }
            }

            // Initialize first board card
            var boardCard = game.MinumPile.DrawCard();
            if (boardCard != null)
                game.BoardHistory.Add(boardCard);

            game.State = GameState.InProgress;
            return true;
        }

        public bool PlayCard(Guid gameId, Guid playerId, Card card)
        {
            var game = GetGame(gameId);
            var player = game?.Players.FirstOrDefault(p => p.Id == playerId);

            if (game == null || player == null)
                return false;

            if (game.CurrentPlayer.Id != playerId)
                return false;

            var success = _rules.TryPlayCard(game, player, card);

            if (success)
            {
                if (_rules.CheckGameEnd(game, out var winner))
                {
                    game.State = GameState.Finished;
                }
                else
                {
                    _rules.NextTurn(game);
                }
            }

            return success;
        }

        public Card? DrawCard(Guid gameId, Guid playerId)
        {
            var game = GetGame(gameId);
            var player = game?.Players.FirstOrDefault(p => p.Id == playerId);

            if (game == null || player == null || game.CurrentPlayer.Id != playerId)
                return null;

            return _rules.DrawCard(game, player);
        }

        public void EndTurn(Guid gameId, Guid playerId)
        {
            var game = GetGame(gameId);
            if (game?.CurrentPlayer.Id == playerId)
            {
                _rules.NextTurn(game);
            }
        }
    }
}
