const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

c.fillStyle = 'black';
c.fillRect(0, 0, canvas.width, canvas.height);

const SPEED = 2.5;
const ROTATIONAL_SPEED = 0.1;
const PROJECTILE_SPEED = 5;
let canShoot = true; //
const SHOOT_COOLDOWN = 500; // Cooldown time in milliseconds
let lives = 3;
let score = 0;
let gameOver = false; // Flag to check if the game is over

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  d: { pressed: false },
};

// Player class (same)
class Player {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.rotation = 0;
    this.radius = 15; // Add a radius to the player for better collision detection
  }

  draw() {
    c.save();
    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);
    // Draw the red tip (ship)
    c.beginPath();
    c.moveTo(30, 0); // front tip
    c.lineTo(-10, -10); // left wing
    c.lineTo(-10, 10); // right wing
    c.closePath();
    c.fillStyle = 'red';
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

// Projectile class
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
      return true; // return true if projectile needs to be removed
    }
    return false; // return false if still in bounds
  }
}

// Asteroid class
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

// Function to display "Game Over" and final score
function displayGameOver() {
  c.fillStyle = 'white';
  c.font = '40px Arial';
  c.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
  c.font = '30px Arial';
  c.fillText(`Final Score: ${score}`, canvas.width / 2 - 100, canvas.height / 2 + 50);
}

// Function to spawn asteroids continuously
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
    const angle = Math.atan2(player.position.y - y, player.position.x - x);
    const velocity = { x: Math.cos(angle), y: Math.sin(angle) };
    asteroids.push(new Asteroid({ position: { x, y }, velocity, radius }));
  }, 1000);
}

// Check for collisions between two circles (for player-asteroid and projectile-asteroid collisions)
function circleCollision(circle1, circle2) {
  const xDifference = circle2.position.x - circle1.position.x;
  const yDifference = circle2.position.y - circle1.position.y;
  const distance = Math.sqrt(
    xDifference * xDifference + yDifference * yDifference
  );
  return distance < circle1.radius + circle2.radius;
}

// Update player controls for rotation and movement
function updatePlayerControls() {
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

// Handle asteroids and player collision (same except player-asteroid collision check fix)
function handleAsteroids() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    asteroid.update();

    // Check if player collides with an asteroid
    if (circleCollision(player, asteroid)) {
      asteroids.splice(i, 1);
      lives -= 1;
      if (lives === 0 && !gameOver) {
        gameOver = true; // Set game over flag
        setTimeout(() => {
          displayGameOver(); // Show game over screen
        }, 0); // Ensure game loop completes before showing Game Over screen
        return; // Exit the function to stop further updates
      }
    }

    // Check if a projectile hits an asteroid
    for (let j = projectiles.length - 1; j >= 0; j--) {
      const projectile = projectiles[j];
      if (circleCollision(asteroid, projectile)) {
        score += 1;
        console.log('Score: ', score);
        asteroids.splice(i, 1);
        projectiles.splice(j, 1);
        break;
      }
    }
  }
}

// Handle projectiles and garbage collection for out-of-bounds projectiles
function handleProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    if (projectile.update()) {
      projectiles.splice(i, 1); // Remove out-of-bounds projectiles
    }
  }
}

const player = new Player({
  position: { x: canvas.width / 2, y: canvas.height / 2 },
  velocity: { x: 0, y: 0 },
});

const projectiles = [];
const asteroids = [];

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
    case 'Space':
  if (canShoot) {
    // Fire a projectile
    projectiles.push(
      new Projectile({
        position: { x: player.position.x, y: player.position.y },
        velocity: {
          x: Math.cos(player.rotation) * PROJECTILE_SPEED,
          y: Math.sin(player.rotation) * PROJECTILE_SPEED,
        },
      })
    );
    
    // Disable shooting for cooldown duration
    canShoot = false;
    setTimeout(() => {
      canShoot = true; // Re-enable shooting after cooldown
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
  }
});

// Main game loop
function animate() {
  if (!gameOver) {
    window.requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Update player movement and rotation
    updatePlayerControls();
    player.update();

    // Handle asteroids and projectiles
    handleAsteroids();
    handleProjectiles();

     // Draw the score and lives counter
    c.fillStyle = 'white';
    c.font = '20px Arial';
    c.fillText(`Lives: ${lives}`, 20, 30);
    c.fillText(`Score: ${score}`, 20, 60);
  } else {
    // Display Game Over screen if the game is over
    displayGameOver();
  }
}

animate();
spawnAsteroids();

