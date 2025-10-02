using NUnit.Framework;
using Moq;
using PokerGameCore.Domain.Models;
using PokerGameCore.Domain.Enums;
using PokerGameCore.Domain.Services;
using System;
using System.Linq;

namespace PokerGameCore.Tests
{
    [TestFixture]
    public class GameServiceTests
    {
        private Mock<IGameRules> _mockRules;
        private GameService _gameService;
        private User _user1;
        private User _user2;

        [SetUp]
        public void Setup()
        {
            _mockRules = new Mock<IGameRules>();
            _gameService = new GameService(_mockRules.Object);
            _user1 = new User { Id = Guid.NewGuid(), Username = "Alice" };
            _user2 = new User { Id = Guid.NewGuid(), Username = "Bob" };
        }

        private Game SetupTestGame(int playerCount = 2, bool makeReady = false)
        {
            var game = _gameService.CreateGame(_user1, "Test Game");
            if (playerCount > 1)
            {
                _gameService.AddPlayerToGame(game.Id, _user2);
            }

            if (makeReady)
            {
                foreach (var player in game.Players)
                {
                    _gameService.GetPlayerReady(game.Id, player);
                }
            }
            return game;
        }

        [Test]
        public void CreateGame_ShouldCreateNewGame_WithGameLeaderAsFirstPlayer()
        {

            var game = _gameService.CreateGame(_user1, "My New Game");


            Assert.That(game, Is.Not.Null);
            Assert.That(game.Name, Is.EqualTo("My New Game"));
            Assert.That(game.Players, Has.Count.EqualTo(1));
            Assert.That(game.GameLeader?.User.Id, Is.EqualTo(_user1.Id));
            Assert.That(game.State, Is.EqualTo(GameState.WaitingForPlayers));
            Assert.That(_gameService.GetGame(game.Id), Is.Not.Null);
        }

        [Test]
        public void AddPlayerToGame_WhenGameIsWaiting_ShouldAddPlayer()
        {

            var game = _gameService.CreateGame(_user1, "Test Game");


            var result = _gameService.AddPlayerToGame(game.Id, _user2);
            var updatedGame = _gameService.GetGame(game.Id);


            Assert.That(result, Is.True);
            Assert.That(updatedGame?.Players, Has.Count.EqualTo(2));
            Assert.That(updatedGame.Players, Has.Some.Matches<Player>(p => p.User.Id == _user2.Id));
        }

        [Test]
        public void AddPlayerToGame_WhenPlayerAlreadyExists_ShouldReturnFalse()
        {

            var game = _gameService.CreateGame(_user1, "Test Game");


            var result = _gameService.AddPlayerToGame(game.Id, _user1);
            var updatedGame = _gameService.GetGame(game.Id);


            Assert.That(result, Is.False);
            Assert.That(updatedGame?.Players, Has.Count.EqualTo(1));
        }

        [Test]
        public void AddPlayerToGame_WhenGameIsInProgress_ShouldReturnFalse()
        {

            var game = SetupTestGame(2, true);
            _gameService.StartGame(game.Id, 5);
            var user3 = new User { Id = Guid.NewGuid(), Username = "Charlie" };


            var result = _gameService.AddPlayerToGame(game.Id, user3);


            Assert.That(result, Is.False);
            Assert.That(game.Players, Has.Count.EqualTo(2));
        }

        [Test]
        public void GetPlayerReady_ShouldSetPlayerIsReadyToTrue()
        {

            var game = SetupTestGame(2);
            var player2 = game.Players.First(p => p.User.Id == _user2.Id);
            Assert.That(player2.IsReady, Is.False);


            _gameService.GetPlayerReady(game.Id, player2);


            Assert.That(player2.IsReady, Is.True);
        }

        [Test]
        public void StartGame_WhenAllPlayersReadyAndEnoughPlayers_ShouldStartGame()
        {
            int numOfPlayers = 2;
            var game = SetupTestGame(numOfPlayers, makeReady: true);
            int cardsToDeal = 7;


            var result = _gameService.StartGame(game.Id, cardsToDeal);


            Assert.That(result, Is.True);
            Assert.That(game.State, Is.EqualTo(GameState.InProgress));
            Assert.That(game.Players, Has.Count.EqualTo(numOfPlayers));
            Assert.That(game.CurrentSubRoundCards, Has.Count.EqualTo(1));
        }

        [Test]
        public void StartGame_WhenNotEnoughPlayers_ShouldReturnFalse()
        {

            var game = _gameService.CreateGame(_user1, "Solo Game");
            _gameService.GetPlayerReady(game.Id, game.Players.First());


            var result = _gameService.StartGame(game.Id, 5);


            Assert.That(result, Is.False);
            Assert.That(game.State, Is.EqualTo(GameState.WaitingForPlayers));
        }

        [Test]
        public void StartGame_WhenPlayersNotReady_ShouldReturnFalse()
        {

            var game = SetupTestGame(2, makeReady: false);


            var result = _gameService.StartGame(game.Id, 5);


            Assert.That(result, Is.False);
            Assert.That(game.State, Is.EqualTo(GameState.WaitingForPlayers));
        }

        [Test]
        public void PlayCard_WhenValidPlay_ShouldCallRulesAndAdvanceTurn()
        {

            var game = SetupTestGame(2, true);
            _gameService.StartGame(game.Id, 5);
            var currentPlayer = game.CurrentPlayer;
            var cardToPlay = currentPlayer?.Hand.First();

            _mockRules.Setup(r => r.TryPlayCard(game, currentPlayer!, cardToPlay!)).Returns(true);
            _mockRules.Setup(r => r.CheckGameEnd(game, out It.Ref<Player>.IsAny!)).Returns(false);


            var result = _gameService.PlayCard(game.Id, currentPlayer!, cardToPlay!);


            Assert.That(result, Is.True);
            _mockRules.Verify(r => r.TryPlayCard(game, currentPlayer!, cardToPlay!), Times.Once);
            _mockRules.Verify(r => r.NextTurn(game), Times.Once);
            _mockRules.Verify(r => r.CheckGameEnd(game, out It.Ref<Player>.IsAny!), Times.Once);
        }

        [Test]
        public void PlayCard_WhenPlayEndsTheGame_ShouldSetWinnerAndFinishState()
        {

            var game = SetupTestGame(2, true);
            _gameService.StartGame(game.Id, 1);
            var currentPlayer = game.CurrentPlayer;
            var cardToPlay = currentPlayer?.Hand.First();
            Player winner = currentPlayer!;

            _mockRules.Setup(r => r.TryPlayCard(game, currentPlayer!, cardToPlay!)).Returns(true);
            _mockRules.Setup(r => r.CheckGameEnd(game, out winner!)).Returns(true);


            var result = _gameService.PlayCard(game.Id, currentPlayer!, cardToPlay!);


            Assert.That(result, Is.True);
            Assert.That(game.State, Is.EqualTo(GameState.Finished));
            Assert.That(game.GameWinner?.Id, Is.EqualTo(winner.Id));
        }

        [Test]
        public void PlayCard_WhenNotCurrentPlayer_ShouldReturnFalse()
        {

            var game = SetupTestGame(2, true);
            _gameService.StartGame(game.Id, 5);
            var nonCurrentPlayer = game.Players[1];
            var cardToPlay = nonCurrentPlayer.Hand.First();


            var result = _gameService.PlayCard(game.Id, nonCurrentPlayer, cardToPlay);


            Assert.That(result, Is.False);
            _mockRules.Verify(r => r.TryPlayCard(It.IsAny<Game>(), It.IsAny<Player>(), It.IsAny<Card>()), Times.Never);
        }

        [Test]
        public void DrawCard_WhenCurrentPlayer_ShouldCallRulesAndReturnCard()
        {

            var game = SetupTestGame(2, true);
            _gameService.StartGame(game.Id, 5);
            var currentPlayer = game.CurrentPlayer;
            var drawnCard = new Card { Rank = CardRank.Ace, Suit = CardSuit.Spades };

            _mockRules.Setup(r => r.DrawCard(game, currentPlayer!)).Returns(drawnCard);


            var result = _gameService.DrawCard(game.Id, currentPlayer!);


            Assert.That(result, Is.Not.Null);
            Assert.That(result, Is.EqualTo(drawnCard));
            _mockRules.Verify(r => r.DrawCard(game, currentPlayer!), Times.Once);
        }

        [Test]
        public void DrawCard_WhenNotCurrentPlayer_ShouldReturnNull()
        {

            var game = SetupTestGame(2, true);
            _gameService.StartGame(game.Id, 5);
            var nonCurrentPlayer = game.Players[1];


            var result = _gameService.DrawCard(game.Id, nonCurrentPlayer);


            Assert.That(result, Is.Null);
            _mockRules.Verify(r => r.DrawCard(It.IsAny<Game>(), It.IsAny<Player>()), Times.Never);
        }

        [Test]
        public void EndTurn_WhenCalledByCurrentPlayer_ShouldCallNextTurn()
        {

            var game = SetupTestGame(2, true);
            _gameService.StartGame(game.Id, 5);
            var currentPlayer = game.CurrentPlayer;


            _gameService.EndTurn(game.Id, currentPlayer!);


            _mockRules.Verify(r => r.NextTurn(game), Times.Once);
        }

        [Test]
        public void EndTurn_WhenCalledByNonCurrentPlayer_ShouldDoNothing()
        {

            var game = SetupTestGame(2, true);
            _gameService.StartGame(game.Id, 5);
            var nonCurrentPlayer = game.Players[1];


            _gameService.EndTurn(game.Id, nonCurrentPlayer);


            _mockRules.Verify(r => r.NextTurn(It.IsAny<Game>()), Times.Never);
        }

        [Test]
        public void DeleteGame_ShouldRemoveGameFromService()
        {

            var game = _gameService.CreateGame(_user1, "To Be Deleted");
            Assert.That(_gameService.GetGame(game.Id), Is.Not.Null);


            _gameService.DeleteGame(game.Id);


            Assert.That(_gameService.GetGame(game.Id), Is.Null);
        }

        [Test]
        public void GetAllGames_ShouldReturnAllActiveGames()
        {

            var game1 = _gameService.CreateGame(_user1, "Game 1");
            var game2 = _gameService.CreateGame(_user2, "Game 2");


            var allGames = _gameService.GetAllGames();


            Assert.That(allGames, Has.Count.EqualTo(2));
            Assert.That(allGames, Has.Some.Property("Id").EqualTo(game1.Id));
            Assert.That(allGames, Has.Some.Property("Id").EqualTo(game2.Id));
        }
    }
}