const roomId = new URLSearchParams(window.location.search).get('room');
const socket = io({ query: { roomId } });
const board = document.getElementById('game-board');
const statusText = document.getElementById('status');

let myId = null;
let currentTurn = null;
let canPlay = false;

function renderBoard(cardState) {
  board.innerHTML = '';
  cardState.forEach(card => {
    const div = document.createElement('div');
    div.classList.add('card');
    div.dataset.index = card.index;
    div.innerText = card.flipped || card.matched ? card.emoji : '?';
    if (card.flipped || card.matched) div.classList.add('flipped');
    board.appendChild(div);
  });
}

board.addEventListener('click', (e) => {
  if (!e.target.classList.contains('card')) return;
  const index = parseInt(e.target.dataset.index);
  if (canPlay) socket.emit('flipCard', { index });
});

socket.on('connect', () => {
  myId = socket.id;
});

socket.on('gameStart', ({ cardState, players, currentTurn: turn }) => {
  renderBoard(cardState);
  currentTurn = turn;
  updateStatus();
});

socket.on('cardFlipped', ({ index, emoji }) => {
  const card = board.children[index];
  card.classList.add('flipped');
  card.innerText = emoji;
});

socket.on('cardsMatched', ({ indexes }) => {
  indexes.forEach(i => {
    const card = board.children[i];
    card.classList.add('flipped');
  });
});

socket.on('updateState', ({ cardState, currentTurn: turn }) => {
  renderBoard(cardState);
  currentTurn = turn;
  updateStatus();
});

socket.on('playerLeft', () => {
  board.innerHTML = '<h3>对手离开了，游戏结束。</h3>';
  statusText.innerText = '等待新的对手加入...';
});

function updateStatus() {
  canPlay = myId === currentTurn;
  statusText.innerText = canPlay ? '你的回合！' : '等待对手操作...';
}
