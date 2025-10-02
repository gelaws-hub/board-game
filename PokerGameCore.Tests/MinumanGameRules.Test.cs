using NUnit.Framework;
using PokerGameCore.Domain.Models;
using PokerGameCore.Domain.Enums;
using PokerGameCore.Domain.Services;
using System.Collections.Generic;
using System.Linq;
using System;

namespace PokerGameCore.Tests
{
    [TestFixture]
    public class MinumanGameRulesTests
    {
        private MinumanGameRules _rules;
        private Game _game;
        private Player _player1;
        private Player _player2;

        [SetUp]
        public void Setup()
        {
            _rules = new MinumanGameRules();

            var user1 = new User { Id = Guid.NewGuid(), Username = "P1" };
            var user2 = new User { Id = Guid.NewGuid(), Username = "P2" };

            _player1 = new Player { Id = Guid.NewGuid(), User = user1 };
            _player2 = new Player { Id = Guid.NewGuid(), User = user2 };

            _game = new Game { Name = "Test Game" };
            _game.Players.AddRange(new[] { _player1, _player2 });
        }

        [Test]
        public void TryPlayCard_WhenCardNotInHand_ReturnsFalse()
        {
            var cardToPlay = new Card { Rank = CardRank.Ace, Suit = CardSuit.Spades };
            _player1.Hand.Add(new Card { Rank = CardRank.King, Suit = CardSuit.Hearts });

            var result = _rules.TryPlayCard(_game, _player1, cardToPlay);

            Assert.That(result, Is.False);
        }

        [Test]
        public void TryPlayCard_WhenBoardIsEmpty_AllowsAnyCardInHand()
        {
            var cardToPlay = new Card { Rank = CardRank.Ace, Suit = CardSuit.Spades };
            _player1.Hand.Add(cardToPlay);

            var result = _rules.TryPlayCard(_game, _player1, cardToPlay);

            Assert.That(result, Is.True);
            Assert.That(_player1.Hand, Is.Empty);
            Assert.That(_game.CurrentSubRoundPlays, Has.Count.EqualTo(1));
        }

        [Test]
        public void TryPlayCard_WhenFollowingSuit_ReturnsTrue()
        {
            var leadCard = new Card { Rank = CardRank.Ten, Suit = CardSuit.Clubs };
            _game.CurrentSubRoundCards.Add(leadCard);

            var cardToPlay = new Card { Rank = CardRank.Jack, Suit = CardSuit.Clubs };
            _player1.Hand.Add(cardToPlay);

            var result = _rules.TryPlayCard(_game, _player1, cardToPlay);

            Assert.That(result, Is.True);
            Assert.That(_player1.Hand, Is.Empty);
        }

        [Test]
        public void TryPlayCard_WhenNotFollowingSuit_ReturnsFalse()
        {
            var leadCard = new Card { Rank = CardRank.Ten, Suit = CardSuit.Clubs };
            _game.CurrentSubRoundCards.Add(leadCard);

            var cardToPlay = new Card { Rank = CardRank.Jack, Suit = CardSuit.Diamonds };
            _player1.Hand.Add(cardToPlay);

            var result = _rules.TryPlayCard(_game, _player1, cardToPlay);

            Assert.That(result, Is.False);
            Assert.That(_player1.Hand, Has.Count.EqualTo(1));
        }

        [Test]
        public void NextTurn_WhenSubRoundInProgress_AdvancesPlayerIndex()
        {
            _game.CurrentPlayerIndex = 0;
            _game.CurrentSubRoundPlays.Add((new Card(), _player1));

            _rules.NextTurn(_game);

            Assert.That(_game.CurrentPlayerIndex, Is.EqualTo(1));
        }

        [Test]
        public void NextTurn_WhenSubRoundEnds_DeterminesWinnerAndResetsBoard()
        {

            var card1 = new Card { Rank = CardRank.Ten, Suit = CardSuit.Spades };
            var card2 = new Card { Rank = CardRank.King, Suit = CardSuit.Spades };
            _game.CurrentSubRoundPlays.Add((card1, _player1));
            _game.CurrentSubRoundPlays.Add((card2, _player2));

            _rules.NextTurn(_game);

            Assert.That(_game.SubRoundWinner, Is.EqualTo(_player2));
            Assert.That(_game.CurrentPlayerIndex, Is.EqualTo(1));
            Assert.That(_game.CurrentSubRoundPlays, Is.Empty);
            Assert.That(_game.BoardHistory, Has.Count.EqualTo(2));
            Assert.That(_game.BoardHistory, Contains.Item(card1));
            Assert.That(_game.BoardHistory, Contains.Item(card2));
        }

        [Test]
        public void CheckGameEnd_WhenPlayerHasNoCards_ReturnsTrueAndSetsWinner()
        {
            _player1.Hand.Clear();
            _player2.Hand.Add(new Card());

            var result = _rules.CheckGameEnd(_game, out Player? winner);

            Assert.That(result, Is.True);
            Assert.That(winner, Is.EqualTo(_player1));
        }

        [Test]
        public void CheckGameEnd_WhenAllPlayersHaveCards_ReturnsFalse()
        {
            _player1.Hand.Add(new Card());
            _player2.Hand.Add(new Card());

            var result = _rules.CheckGameEnd(_game, out Player? winner);

            Assert.That(result, Is.False);
            Assert.That(winner, Is.Null);
        }

        [Test]
        public void DrawCard_WhenPileHasCards_AddsCardToPlayerHand()
        {

            var initialHandCount = _player1.Hand.Count;
            var initialPileCount = _game.MinumPile.Count;

            var drawnCard = _rules.DrawCard(_game, _player1);

            Assert.That(drawnCard, Is.Not.Null);
            Assert.That(_player1.Hand, Has.Count.EqualTo(initialHandCount + 1));
            Assert.That(_game.MinumPile.Count, Is.EqualTo(initialPileCount - 1));
        }

        [Test]
        public void DrawCard_WhenPileIsEmpty_RefillsFromHistoryAndDraws()
        {
            while (!_game.MinumPile.IsEmpty) { _game.MinumPile.DrawCard(); }
            Assert.That(_game.MinumPile.IsEmpty, Is.True);

            var historyCards = new List<Card>
            {
                new Card { Rank = CardRank.Two, Suit = CardSuit.Clubs },
                new Card { Rank = CardRank.Three, Suit = CardSuit.Hearts }
            };
            _game.BoardHistory.AddRange(historyCards);

            var drawnCard = _rules.DrawCard(_game, _player1);

            Assert.That(drawnCard, Is.Not.Null);
            Assert.That(_player1.Hand, Has.Count.EqualTo(1));
            Assert.That(_game.BoardHistory, Is.Empty);
            Assert.That(_game.MinumPile.Count, Is.EqualTo(1));
        }

        [Test]
        public void DrawCard_WhenPileAndHistoryAreEmpty_ReturnsNull()
        {

            while (!_game.MinumPile.IsEmpty) { _game.MinumPile.DrawCard(); }
            _game.BoardHistory.Clear();

            var drawnCard = _rules.DrawCard(_game, _player1);

            Assert.That(drawnCard, Is.Null);
            Assert.That(_player1.Hand, Is.Empty);
        }
    }
}