using PokerGameCore.Domain.Models;
using PokerGameCore.Domain.Enums;
using System.Collections.Concurrent;

namespace PokerGameCore.Domain.Services
{
    public class GameService(IGameRules rules)
    {
        private readonly IGameRules _rules = rules;
        private readonly ConcurrentDictionary<Guid, Game> _games = new();

        public Game CreateGame(User user, string gameName)
        {
            Game game = new() { Name = gameName };
            _games[game.Id] = game;
            game.GameLeader = new Player { Id = Guid.NewGuid(), User = user };
            game.Players.Add(game.GameLeader);

            return game;
        }

        public Game? GetGame(Guid gameId)
        {
            _games.TryGetValue(gameId, out Game? game);
            return game;
        }

        public bool AddPlayerToGame(Guid gameId, User user)
        {
            if (!_games.TryGetValue(gameId, out Game? game))
                return false;

            if (game.State != GameState.WaitingForPlayers)
                return false;

            if (game.Players.Any(p => p.User.Id == user.Id || p.User.Username == user.Username))
                return false;

            game.Players.Add(new Player { Id = Guid.NewGuid(), User = user });

            return true;
        }

        public void GetPlayerReady(Guid gameId, Player player)
        {
            if (_games.TryGetValue(gameId, out Game? game))
            {
                if (player != null)
                {
                    player.IsReady = true;
                }
            }
        }

        public bool StartGame(Guid gameId, int numberOfCards)
        {
            if (!_games.TryGetValue(gameId, out Game? game))
                return false;

            if (game.Players.Count < 2)
                return false;

            if (game.State != GameState.WaitingForPlayers || !game.IsAllPlayersReady)
                return false;

            // Deal 5 cards each (or more)
            foreach (Player player in game.Players)
            {
                for (int i = 0; i < numberOfCards; i++)
                {
                    Card? card = game.MinumPile.DrawCard();
                    if (card != null)
                        player.Hand.Add(card);
                }
            }

            // Initialize first board card
            Card? boardCard = game.MinumPile.DrawCard();
            if (boardCard != null)
                game.CurrentSubRoundCards.Add(boardCard);

            game.State = GameState.InProgress;
            return true;
        }

        public bool PlayCard(Guid gameId, Player player, Card card)
        {
            Game? game = GetGame(gameId);
            Player? _player = game?.Players.FirstOrDefault(p => p.Id == player.Id);

            if (game?.State != GameState.InProgress)
                return false;

            if (game == null || _player == null)
                return false;

            if (game.CurrentPlayer?.Id != player.Id)
                return false;

            bool success = _rules.TryPlayCard(game, _player, card);

            if (success)
            {
                _rules.NextTurn(game);

                if (_rules.CheckGameEnd(game, out Player? winner))
                {
                    game.GameWinner = winner;
                    game.State = GameState.Finished;
                }
            }
            return success;
        }

        public Card? DrawCard(Guid gameId, Player player)
        {
            Game? game = GetGame(gameId);
            Player? _player = game?.Players.FirstOrDefault(p => p.Id == player.Id);

            if (game?.State != GameState.InProgress)
                return null;

            if (game == null || _player == null || game.CurrentPlayer?.Id != player.Id)
                return null;

            return _rules.DrawCard(game, _player);
        }

        public void EndTurn(Guid gameId, Player player)
        {
            Game? game = GetGame(gameId);
            if (game?.CurrentPlayer == null)
                return;

            if (game.CurrentPlayer == player)
            {
                _rules.NextTurn(game);
            }
        }

        public List<Game> GetAllGames()
        {
            return _games.Values.ToList();
        }

        public void DeleteGame(Guid gameId)
        {
            if (_games.Remove(gameId, out _))
                Console.WriteLine($"Game {gameId} has been deleted.");
        }

    }
}
