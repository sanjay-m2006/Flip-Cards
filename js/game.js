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

// Normalize a string to Title Case (capitalize each word) for display
function toTitleCase(s){
  return (s||'').toString().trim().toLowerCase().split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
  // If player names haven't been entered yet (or count changed), prompt for them first
  if (!window._playerNames || window._playerNames.length !== numPlayers) {
    showNamePrompt(numPlayers, (names) => {
      window._playerNames = names;
      // re-run start now that names are present
      startGame();
    });
    return;
  }
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
  // show centered transient message for the starting player
  try {
    const rawStartingName = (window._playerNames && window._playerNames[currentPlayer]) ? window._playerNames[currentPlayer] : ('Player ' + (currentPlayer + 1));
    const startingName = toTitleCase(rawStartingName);
    const startingColor = (window._playerColors && window._playerColors[currentPlayer]) ? window._playerColors[currentPlayer] : null;
    showCenterMessage(startingName, startingColor);
  } catch (e) {}

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
              // show centered transient message announcing next player's turn
              try {
                const nextName = (window._playerNames && window._playerNames[currentPlayer]) ? window._playerNames[currentPlayer] : ('Player ' + (currentPlayer + 1));
                const nextColor = (window._playerColors && window._playerColors[currentPlayer]) ? window._playerColors[currentPlayer] : null;
                showCenterMessage(nextName, nextColor);
              } catch (e) {}
        }, 800);
      }
    }
  }

      // transient center message helper
      function showCenterMessage(name, color = null, duration = 1000) {
        // create element
        const id = 'centerMessageToast';
        // if a toast already exists, remove it first so new one restarts animation
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = id;
        el.className = 'center-message';

        // avatar
          const displayName = toTitleCase(name);
          const initials = (displayName || '').split(' ').map(p => p[0]).filter(Boolean).slice(0,2).join('').toUpperCase() || '?';
          const avatar = document.createElement('span');
          avatar.className = 'center-avatar';
          avatar.textContent = initials;
          if (color) avatar.style.background = color;

          const textWrap = document.createElement('div');
          textWrap.className = 'center-text';
          const nameEl = document.createElement('div');
          nameEl.className = 'center-name';
          nameEl.textContent = `${displayName}'s`;
          const subEl = document.createElement('div');
          subEl.className = 'center-sub';
          subEl.textContent = 'Turn';
        // ensure the second line reads nicely: "Alice's turn" => name line 'Alice' and sub line "'s turn"
        // but we'll combine visually as Name (large) and "'s turn" below it. If you prefer separate wording like "Turn", change here.

        textWrap.appendChild(nameEl);
        textWrap.appendChild(subEl);

        el.appendChild(avatar);
        el.appendChild(textWrap);

        // append to the board so the message is centered over the cards
        try {
          if (board && board.appendChild) board.appendChild(el);
          else document.body.appendChild(el);
        } catch (e) {
          document.body.appendChild(el);
        }

        // remove after animation duration
        setTimeout(() => {
          try { el.remove(); } catch (e) {}
        }, duration + 50);
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

    // render or update a small turn indicator. Place it into a board-controls area
    // that sits just above the cards table (so it's visually above the board).
    let boardControls = document.getElementById('boardControls');
    if (!boardControls) {
      boardControls = document.createElement('div');
      boardControls.id = 'boardControls';
      boardControls.className = 'board-controls';
      // insert the controls right before the board so they appear above it
      try {
        if (board && board.parentNode) board.parentNode.insertBefore(boardControls, board);
        else document.body.insertBefore(boardControls, document.body.firstChild);
      } catch (e) {
        document.body.insertBefore(boardControls, document.body.firstChild);
      }
    }

    let turnIndicator = document.getElementById('turnIndicator');
    if (!turnIndicator) {
      turnIndicator = document.createElement('div');
      turnIndicator.id = 'turnIndicator';
      turnIndicator.className = 'turn-indicator';
      boardControls.appendChild(turnIndicator);
    }
    const rawActiveName = (window._playerNames && window._playerNames[activeIndex]) ? window._playerNames[activeIndex] : ('Player ' + (activeIndex + 1));
    const activeName = toTitleCase(rawActiveName);
    turnIndicator.textContent = `${activeName}'s turn`;

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

      const rawName = (window._playerNames && window._playerNames[idx]) ? window._playerNames[idx] : ('Player ' + (idx+1));
      const name = toTitleCase(rawName);
      // compute initials for avatar
      const initials = name.split(' ').map(p => p[0]).filter(Boolean).slice(0,2).join('').toUpperCase();

      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.textContent = initials || ('P' + (idx+1));
      // set avatar background color if available (unique per player)
      try {
        const color = (window._playerColors && window._playerColors[idx]) ? window._playerColors[idx] : null;
        if (color) avatar.style.background = color;
      } catch (e) {}

      const info = document.createElement('div');
      info.className = 'score-info';
      info.innerHTML = `<strong>${name}</strong><div>${s} pairs</div>`;

      item.appendChild(avatar);
      item.appendChild(info);
      sb.appendChild(item);
    });
  }

  // prompt overlay for collecting player names
  function showNamePrompt(count, cb) {
    // avoid double prompts
    if (document.getElementById('namePrompt')) return;
    const overlay = document.createElement('div');
    overlay.id = 'namePrompt';
    overlay.className = 'name-prompt';

    const box = document.createElement('div');
    box.className = 'name-prompt-box';

    const title = document.createElement('h3');
    title.textContent = 'Enter player names';
    box.appendChild(title);

    const form = document.createElement('div');
    form.className = 'name-prompt-form';

    const inputs = [];
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'name-input-row';

      const label = document.createElement('label');
      label.textContent = `Player ${i+1}`;

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `Player ${i+1}`;
      input.className = 'name-input';

      row.appendChild(label);
      row.appendChild(input);
      form.appendChild(row);
      inputs.push(input);
    }

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '8px';
    actions.style.marginTop = '12px';

    const err = document.createElement('div');
    err.className = 'name-error';
    err.id = 'namePromptError';
    err.style.display = 'none';
    box.appendChild(err);

    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.className = 'btn ghost';
    cancel.addEventListener('click', () => { overlay.remove(); });

    const ok = document.createElement('button');
    ok.textContent = 'Start';
    ok.className = 'btn primary';
    ok.addEventListener('click', () => {
      const names = inputs.map((inp, i) => (inp.value && inp.value.trim()) ? inp.value.trim() : `Player ${i+1}`);
      // validate uniqueness (case-insensitive)
      const lower = names.map(n => n.toLowerCase());
      const dupes = lower.reduce((acc, cur, i, arr) => {
        if (arr.indexOf(cur) !== i && !acc.includes(cur)) acc.push(cur);
        return acc;
      }, []);
      if (dupes.length) {
        err.textContent = 'Please enter unique player names. Duplicate: ' + dupes.join(', ');
        err.style.display = 'block';
        return;
      }

      // assign unique avatar colors from a palette
      const PALETTE = ['linear-gradient(135deg,#6ea8ff,#a17bff)','linear-gradient(135deg,#FFD36B,#FF7AB6)','linear-gradient(135deg,#7EE787,#66D3FF)','linear-gradient(135deg,#FFB86B,#FF6B9E)','linear-gradient(135deg,#C6A0FF,#8FE3FF)','linear-gradient(135deg,#F78DA7,#FFD36B)','linear-gradient(135deg,#90EE90,#32CDFF)','linear-gradient(135deg,#FF9F9F,#FFCF6B)','linear-gradient(135deg,#A0E7FF,#B38DFF)','linear-gradient(135deg,#FFD2E0,#CFE9FF)'];
      const used = new Set();
      const colors = [];
      function hashString(s){
        let h = 0; for(let i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; } return Math.abs(h);
      }
      for (let i = 0; i < names.length; i++){
        const base = hashString(names[i]) % PALETTE.length;
        let pick = null;
        for (let off=0; off<PALETTE.length; off++){
          const cand = PALETTE[(base + off) % PALETTE.length];
          if (!used.has(cand)) { pick = cand; used.add(cand); break; }
        }
        colors.push(pick || PALETTE[i % PALETTE.length]);
      }

      // store names and colors globally for scoreboard rendering
      // normalize names to Capitalized form (Title Case) for display everywhere
      function toTitleCase(s){
        return (s||'').toString().trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      window._playerNames = names.map(n => toTitleCase(n));
      window._playerColors = colors;

      overlay.remove();
      cb(names);
    });

    actions.appendChild(cancel);
    actions.appendChild(ok);

    box.appendChild(form);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    // focus first input
    if (inputs[0]) inputs[0].focus();
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
      const winnerRaw = (window._playerNames && window._playerNames[winners[0]]) ? window._playerNames[winners[0]] : ('Player ' + (winners[0]+1));
      const winnerName = toTitleCase(winnerRaw);
      title.textContent = `${winnerName} wins!`;
    } else {
      const names = winners.map(w => toTitleCase((window._playerNames && window._playerNames[w]) ? window._playerNames[w] : ('Player ' + (w+1))));
      title.textContent = `It's a tie between ${names.join(' & ')}!`;
    }

    const details = document.createElement('div');
    details.innerHTML = scoresArr.map((s, i) => {
      const raw = (window._playerNames && window._playerNames[i]) ? window._playerNames[i] : ('Player ' + (i+1));
      const name = toTitleCase(raw);
      return `${name}: ${s} pairs`;
    }).join('<br>');

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
  // clear stored player names when resetting the game
  try { delete window._playerNames; delete window._playerColors; } catch (e) {}
}


