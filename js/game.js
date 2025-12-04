// memory game logic - single consolidated file

// Utility: shuffle an array and return a new shuffled copy
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Wire up start button when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startGame');
  if (startBtn) startBtn.addEventListener('click', startGame);
  const resetBtn = document.getElementById('resetGame');
  if (resetBtn) resetBtn.addEventListener('click', resetGame);
});

function startGame() {
  const numPlayers = parseInt(document.getElementById('numPlayers').value, 10) || 2;
  const difficulty = (document.getElementById('difficulty') || {}).value || 'medium';
  const board = document.getElementById('gameBoard');
  const winnerEl = document.getElementById('winner');
  const playerInput = document.getElementById('player-input');
  const appContainer = document.querySelector('.container');

  // Reset UI
  board.innerHTML = '';
  board.classList.remove('hidden');
  // mark app as playing to change control layout
  if (appContainer) appContainer.classList.add('playing');
  winnerEl.classList.add('hidden');
  winnerEl.innerHTML = '';

  // Determine pairs based on difficulty (grid sizes requested):
  // easy = 4x4 => 16 cards => 8 pairs
  // medium = 6x5 => 30 cards => 15 pairs
  // hard = 8x6 => 48 cards => 24 pairs
  let pairsCount = 15; // default (medium = 6x5)
  if (difficulty === 'easy') pairsCount = (4 * 4) / 2; // 8 pairs
  else if (difficulty === 'medium') pairsCount = (6 * 5) / 2; // 15 pairs
  else if (difficulty === 'hard') pairsCount = (8 * 6) / 2; // 24 pairs

  const totalCards = pairsCount * 2;

  // Emoji / image set (must have at least `pairsCount` unique items)
  const IMAGES = [
    '🍎','🍌','🍓','🍇','🍉','🍒','🍋','🥝','🍑','🍍','🥥','🍐','🍊','🥭','🍈','🍠',
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔',
    '🦄','🐝','🐙','🐬','🦖','🦋','🦅','🦉','🌵','🍄'
  ];
  const chosen = shuffleArray(IMAGES).slice(0, pairsCount);
  const cardValues = shuffleArray([...chosen, ...chosen]); // duplicate and shuffle

  // Prepare scoreboard
  const scores = Array(numPlayers).fill(0);
  let currentPlayer = 0;
  let flipped = [];
  let matchedPairs = 0;
  renderScoreboard(playerInput, scores, currentPlayer);

  // Responsive board class based on difficulty so layout matches requested grid
  board.className = '';
  if (difficulty === 'easy') board.classList.add('small');
  else if (difficulty === 'medium') board.classList.add('medium');
  else if (difficulty === 'hard') board.classList.add('large');


  // Create cards
  cardValues.forEach((value, i) => {
    const card = createCard(value, i);
    board.appendChild(card);
  });

  // Helper: create a card element
  function createCard(value, index) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.value = value;
    el.dataset.index = index;

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const back = document.createElement('div');
    back.className = 'card-back';
    back.textContent = '❓';

    const front = document.createElement('div');
    front.className = 'card-front';
    front.textContent = value;

    inner.appendChild(front);
    inner.appendChild(back);
    el.appendChild(inner);

    el.addEventListener('click', () => onCardClick(el));
    return el;
  }

  function onCardClick(cardEl) {
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;
    if (flipped.length === 2) return;

    cardEl.classList.add('flipped');
    flipped.push(cardEl);

    if (flipped.length === 2) {
      const [a, b] = flipped;
      if (a.dataset.value === b.dataset.value) {
        // match: keep both cards flipped for a short delay so player sees them,
        // then mark them vacant (and matched) after the delay.
        scores[currentPlayer] += 1;
        matchedPairs += 1;
        renderScoreboard(playerInput, scores, currentPlayer);

        setTimeout(() => {
          // mark matched so styles can reflect the match
          a.classList.add('matched');
          b.classList.add('matched');

          // start a small removal animation, then mark them vacant
          a.classList.add('removing');
          b.classList.add('removing');

          // remove flipped class so the removal animation isn't fighting the flip transform
          a.classList.remove('flipped');
          b.classList.remove('flipped');

          // after the removal animation completes, mark vacant and clean up
          setTimeout(() => {
            a.classList.add('vacant');
            b.classList.add('vacant');
            a.classList.remove('removing');
            b.classList.remove('removing');

            if (matchedPairs === pairsCount) {
              showWinner(scores);
            }
          }, 350); // matches the CSS animation duration
        }, 600);

        flipped = [];
      } else {
        // no match
        setTimeout(() => {
          a.classList.remove('flipped');
          b.classList.remove('flipped');
          flipped = [];
          currentPlayer = (currentPlayer + 1) % scores.length;
          renderScoreboard(playerInput, scores, currentPlayer);
        }, 800);
      }
    }
  }

  function renderScoreboard(container, scoresArr, activeIndex) {
    // update container class so CSS can change background based on active player
    try {
      const appContainer = document.querySelector('.container');
      if (appContainer) {
        appContainer.classList.remove('player-1','player-2','player-3','player-4');
        appContainer.classList.add('player-' + (activeIndex + 1));
      }
    } catch (e) {
      // ignore in non-browser or unusual environments
    }

    // render or update a small turn indicator
    let turnIndicator = document.getElementById('turnIndicator');
    if (!turnIndicator) {
      turnIndicator = document.createElement('div');
      turnIndicator.id = 'turnIndicator';
      turnIndicator.className = 'turn-indicator';
      container.appendChild(turnIndicator);
    }
    turnIndicator.textContent = `Player ${activeIndex + 1}'s turn`;

    let sb = document.getElementById('scoreboard');
    if (!sb) {
      sb = document.createElement('div');
      sb.id = 'scoreboard';
      container.appendChild(sb);
    }
    sb.innerHTML = '';
    scoresArr.forEach((s, idx) => {
      const item = document.createElement('div');
      item.className = 'score' + (idx === activeIndex ? ' active' : '');
      item.innerHTML = `<strong>Player ${idx+1}</strong><div>${s} pairs</div>`;
      sb.appendChild(item);
    });
  }

  function showWinner(scoresArr) {
    const max = Math.max(...scoresArr);
    const winners = scoresArr
      .map((s, i) => ({ s, i }))
      .filter(x => x.s === max)
      .map(x => x.i);

    const winnerDiv = document.getElementById('winner');
    winnerDiv.classList.remove('hidden');
    const trophy = document.createElement('div');
    trophy.className = 'trophy';
    trophy.textContent = '🏆';

    const title = document.createElement('h2');
    if (winners.length === 1) {
      title.textContent = `Player ${winners[0]+1} wins!`;
    } else {
      title.textContent = `It's a tie between ${winners.map(w => 'Player ' + (w+1)).join(' & ')}!`;
    }

    const details = document.createElement('div');
    details.innerHTML = scoresArr.map((s, i) => `Player ${i+1}: ${s} pairs`).join('<br>');

    const restart = document.createElement('button');
    restart.textContent = 'Play Again';
    restart.addEventListener('click', () => {
    // use the global reset so all UI pieces (scoreboard, turn indicator, body class) are cleared
    resetGame();
    });

    winnerDiv.innerHTML = '';
    winnerDiv.appendChild(trophy);
    winnerDiv.appendChild(title);
    winnerDiv.appendChild(details);
    winnerDiv.appendChild(document.createElement('br'));
    winnerDiv.appendChild(restart);
  }
}

function resetGame() {
  const board = document.getElementById('gameBoard');
  const winnerDiv = document.getElementById('winner');
  const scoreboardEl = document.getElementById('scoreboard');
  // clear board and hide
  if (board) {
    board.innerHTML = '';
    board.classList.add('hidden');
  }
  // hide winner
  if (winnerDiv) winnerDiv.classList.add('hidden');
  // remove scoreboard
  if (scoreboardEl) scoreboardEl.remove();
  // remove turn indicator if present
  const turnIndicator = document.getElementById('turnIndicator');
  if (turnIndicator) turnIndicator.remove();
  // remove player classes from the main container (if any)
  try {
    const appContainer = document.querySelector('.container');
    if (appContainer) appContainer.classList.remove('player-1','player-2','player-3','player-4');
  } catch (e) {}
  // return controls to starting vertical layout
  const appContainer = document.querySelector('.container');
  if (appContainer) appContainer.classList.remove('playing');
  // nothing else to clean up for layout sizing
}


