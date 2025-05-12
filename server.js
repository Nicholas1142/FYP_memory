const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

function initGame(roomId) {
  const emojis = ['🍎','🍌','🍇','🍉','🍍','🍓','🍒','🥝'];
  let cards = [...emojis, ...emojis];
  cards.sort(() => 0.5 - Math.random());
  rooms[roomId].cardState = cards.map((emoji, i) => ({
    index: i,
    emoji,
    flipped: false,
    matched: false
  }));
  rooms[roomId].currentTurn = rooms[roomId].players[0];
}

io.on('connection', (socket) => {
  const roomId = socket.handshake.query.roomId;
  if (!roomId) return;

  socket.join(roomId);
  if (!rooms[roomId]) {
    rooms[roomId] = { players: [], cardState: [], currentTurn: null };
  }

  const room = rooms[roomId];
  room.players.push(socket.id);
  console.log(`${socket.id} joined room ${roomId}`);

  if (room.players.length === 2) {
    initGame(roomId);
    io.to(roomId).emit('gameStart', {
      cardState: room.cardState,
      players: room.players,
      currentTurn: room.currentTurn
    });
  }

  socket.on('flipCard', ({ index }) => {
    const room = rooms[roomId];
    if (!room || socket.id !== room.currentTurn) return;
    const card = room.cardState[index];
    if (card.flipped || card.matched) return;

    card.flipped = true;
    io.to(roomId).emit('cardFlipped', { index, emoji: card.emoji });

    const flipped = room.cardState.filter(c => c.flipped && !c.matched);
    if (flipped.length === 2) {
      if (flipped[0].emoji === flipped[1].emoji) {
        flipped[0].matched = true;
        flipped[1].matched = true;
        io.to(roomId).emit('cardsMatched', {
          indexes: [flipped[0].index, flipped[1].index]
        });
      }

      setTimeout(() => {
        room.cardState.forEach(c => { if (!c.matched) c.flipped = false; });
        room.currentTurn = room.players.find(id => id !== room.currentTurn);
        io.to(roomId).emit('updateState', {
          cardState: room.cardState,
          currentTurn: room.currentTurn
        });
      }, 1000);
    }
  });

  socket.on('disconnect', () => {
    const room = rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(p => p !== socket.id);
    io.to(roomId).emit('playerLeft');

    if (room.players.length === 0) {
      delete rooms[roomId];
    }
  });
});

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
