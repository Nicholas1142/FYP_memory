function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom() {
  const roomId = generateRoomId();
  const link = `${window.location.origin}/game.html?room=${roomId}`;
  document.getElementById('room-link').innerText = `房间已创建：${link}`;
  window.location.href = `/game.html?room=${roomId}`;
}

function joinRoom() {
  const roomId = document.getElementById('room-input').value.trim().toUpperCase();
  if (roomId) {
    window.location.href = `/game.html?room=${roomId}`;
  }
}
