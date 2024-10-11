const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

c.fillStyle = 'black';
c.fillRect(0, 0, canvas.width, canvas.height);

const SPEED = 2.5;
const ROTATIONAL_SPEED = 0.1;
const PROJECTILE_SPEED = 5;
const SHOOT_COOLDOWN = 500; // Cooldown time in milliseconds

let canShootPlayer1 = true;
let canShootPlayer2 = true;
let gameOver = false;

const keys = {
  w: { pressed: false }, // Player 1 move up
  a: { pressed: false }, // Player 1 rotate left
  d: { pressed: false }, // Player 1 rotate right
  ArrowUp: { pressed: false }, // Player 2 move up
  ArrowLeft: { pressed: false }, // Player 2 rotate left
  ArrowRight: { pressed: false }, // Player 2 rotate right
};

// Player class (shared by both players)
class Player {
  constructor({ position, velocity, color, lives }) {
    this.position = position;
    this.velocity = velocity;
    this.rotation = 0;
    this.radius = 15;
    this.color = color;
    this.lives = lives;
  }

  draw() {
    c.save();
    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);
    c.beginPath();
    c.moveTo(30, 0); 
    c.lineTo(-10, -10);
    c.lineTo(-10, 10);
    c.closePath();
    c.fillStyle = this.color;
    c.fill();
    c.strokeStyle = 'white';
    c.stroke();
    c.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Wrap around screen
    if (this.position.x > canvas.width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = canvas.width;
    if (this.position.y > canvas.height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = canvas.height;
  }
}

class Projectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 5;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = 'white';
    c.fill();
    c.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Remove projectiles if out of bounds
    if (
      this.position.x + this.radius < 0 ||
      this.position.x - this.radius > canvas.width ||
      this.position.y + this.radius < 0 ||
      this.position.y - this.radius > canvas.height
    ) {
      return true;
    }
    return false;
  }
}

class Asteroid {
  constructor({ position, velocity, radius }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    c.strokeStyle = 'white';
    c.stroke();
    c.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Wrap around screen
    if (this.position.x > canvas.width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = canvas.width;
    if (this.position.y > canvas.height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = canvas.height;
  }
}

// Function to detect collisions between two circles
function circleCollision(circle1, circle2) {
  const xDifference = circle2.position.x - circle1.position.x;
  const yDifference = circle2.position.y - circle1.position.y;
  const distance = Math.sqrt(
    xDifference * xDifference + yDifference * yDifference
  );
  return distance < circle1.radius + circle2.radius;
}

const player1 = new Player({
  position: { x: canvas.width / 3, y: canvas.height / 2 },
  velocity: { x: 0, y: 0 },
  color: 'red',
  lives: 3
});

const player2 = new Player({
  position: { x: 2 * canvas.width / 3, y: canvas.height / 2 },
  velocity: { x: 0, y: 0 },
  color: 'blue',
  lives: 3
});

const projectilesPlayer1 = [];
const projectilesPlayer2 = [];
const asteroids = [];

function updatePlayerControls(player, keys) {
  if (keys.a.pressed) {
    player.rotation -= ROTATIONAL_SPEED;
  }
  if (keys.d.pressed) {
    player.rotation += ROTATIONAL_SPEED;
  }
  if (keys.w.pressed) {
    player.velocity.x = Math.cos(player.rotation) * SPEED;
    player.velocity.y = Math.sin(player.rotation) * SPEED;
  } else {
    player.velocity.x = 0;
    player.velocity.y = 0;
  }
}

function updatePlayer2Controls(player, keys) {
  if (keys.ArrowLeft.pressed) {
    player.rotation -= ROTATIONAL_SPEED;
  }
  if (keys.ArrowRight.pressed) {
    player.rotation += ROTATIONAL_SPEED;
  }
  if (keys.ArrowUp.pressed) {
    player.velocity.x = Math.cos(player.rotation) * SPEED;
    player.velocity.y = Math.sin(player.rotation) * SPEED;
  } else {
    player.velocity.x = 0;
    player.velocity.y = 0;
  }
}

function handleProjectiles(player, projectiles, otherPlayer) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    if (projectile.update()) {
      projectiles.splice(i, 1); 
    } else if (circleCollision(projectile, otherPlayer)) {
      otherPlayer.lives -= 1;
      projectiles.splice(i, 1);
      if (otherPlayer.lives === 0) {
        gameOver = true;
        displayGameOver();
      }
    }
  }
}

function handleAsteroids() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    asteroid.update();

    // Check collision with player1
    if (circleCollision(asteroid, player1)) {
      player1.lives -= 1;
      asteroids.splice(i, 1);
      if (player1.lives === 0) {
        gameOver = true;
        displayGameOver();
      }
    }

    // Check collision with player2
    if (circleCollision(asteroid, player2)) {
      player2.lives -= 1;
      asteroids.splice(i, 1);
      if (player2.lives === 0) {
        gameOver = true;
        displayGameOver();
      }
    }

    // Check if player 1's projectiles hit the asteroid
    for (let j = projectilesPlayer1.length - 1; j >= 0; j--) {
      const projectile = projectilesPlayer1[j];
      if (circleCollision(projectile, asteroid)) {
        projectilesPlayer1.splice(j, 1); // Remove projectile
        asteroids.splice(i, 1); // Remove asteroid
        break;
      }
    }

    // Check if player 2's projectiles hit the asteroid
    for (let j = projectilesPlayer2.length - 1; j >= 0; j--) {
      const projectile = projectilesPlayer2[j];
      if (circleCollision(projectile, asteroid)) {
        projectilesPlayer2.splice(j, 1); // Remove projectile
        asteroids.splice(i, 1); // Remove asteroid
        break;
      }
    }
  }
}

function spawnAsteroids() {
  setInterval(() => {
    const radius = Math.random() * 30 + 10;
    let x;
    let y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }
    const angle = Math.atan2(player1.position.y - y, player1.position.x - x);
    const velocity = { x: Math.cos(angle), y: Math.sin(angle) };
    asteroids.push(new Asteroid({ position: { x, y }, velocity, radius }));
  }, 1000); // Spawn asteroids every second
}

// Event listeners for key controls
window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true;
      break;
    case 'KeyA':
      keys.a.pressed = true;
      break;
    case 'KeyD':
      keys.d.pressed = true;
      break;
    case 'ArrowUp':
      keys.ArrowUp.pressed = true;
      break;
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = true;
      break;
    case 'ArrowRight':
      keys.ArrowRight.pressed = true;
      break;
    case 'Space':
      if (canShootPlayer1) {
        projectilesPlayer1.push(
          new Projectile({
            position: { x: player1.position.x, y: player1.position.y },
            velocity: {
              x: Math.cos(player1.rotation) * PROJECTILE_SPEED,
              y: Math.sin(player1.rotation) * PROJECTILE_SPEED,
            },
          })
        );
        canShootPlayer1 = false;
        setTimeout(() => {
          canShootPlayer1 = true;
        }, SHOOT_COOLDOWN);
      }
      break;
    case 'ShiftRight':
      if (canShootPlayer2) {
        projectilesPlayer2.push(
          new Projectile({
            position: { x: player2.position.x, y: player2.position.y },
            velocity: {
              x: Math.cos(player2.rotation) * PROJECTILE_SPEED,
              y: Math.sin(player2.rotation) * PROJECTILE_SPEED,
            },
          })
        );
        canShootPlayer2 = false;
        setTimeout(() => {
          canShootPlayer2 = true;
        }, SHOOT_COOLDOWN);
      }
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false;
      break;
    case 'KeyA':
      keys.a.pressed = false;
      break;
    case 'KeyD':
      keys.d.pressed = false;
      break;
    case 'ArrowUp':
      keys.ArrowUp.pressed = false;
      break;
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false;
      break;
    case 'ArrowRight':
      keys.ArrowRight.pressed = false;
      break;
  }
});

function displayGameOver() {
  c.fillStyle = 'white';
  c.font = '40px Arial';
  c.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
}

function animate() {
  if (!gameOver) {
    window.requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Update both players
    updatePlayerControls(player1, keys);
    updatePlayer2Controls(player2, keys);

    player1.update();
    player2.update();

    // Handle projectiles
    handleProjectiles(player1, projectilesPlayer1, player2);
    handleProjectiles(player2, projectilesPlayer2, player1);

    // Handle asteroids
    handleAsteroids();

    // Display lives and scores
    c.fillStyle = 'white';
    c.font = '20px Arial';
    c.fillText(`Player 1 Lives: ${player1.lives}`, 20, 30);
    c.fillText(`Player 2 Lives: ${player2.lives}`, canvas.width - 200, 30);
  }
}

animate();
spawnAsteroids();
