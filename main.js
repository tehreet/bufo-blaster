const playerUrl = 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/awesomebufo.png';
const enemyUrls = [
  'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/blockheads-bufo.png',
  'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/buff-bufo.png',
  'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/bufo_wants_his_money.png'
];

class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  preload() {
    this.load.image('player', playerUrl);
    this.load.image('bullet', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/bullets/bullet6.png');
    this.load.image('xp', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/particles/yellow.png');
    enemyUrls.forEach((url, i) => this.load.image('enemy' + i, url));
  }

  create() {
    this.player = this.physics.add.sprite(400, 300, 'player').setScale(0.5);
    this.player.setCollideWorldBounds(true);

    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.xpOrbs = this.physics.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.level = 1;
    this.xp = 0;
    this.xpForNext = 5;

    this.maxHealth = 5;
    this.health = this.maxHealth;

    this.fireRate = 500;
    this.bulletSpeed = 300;
    this.bulletDamage = 1;
    this.playerSpeed = 200;

    this.lastFired = 0;

    this.time.addEvent({ delay: 1000, loop: true, callback: this.spawnEnemy, callbackScope: this });

    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this.collectXp, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);

    updateHud(this);
  }

  update(time, delta) {
    this.handleMovement();
    if (time > this.lastFired + this.fireRate) {
      this.fireBullet();
      this.lastFired = time;
    }
    this.enemies.getChildren().forEach(e => this.physics.moveToObject(e, this.player, 50 + this.level * 5));
  }

  handleMovement() {
    const speed = this.playerSpeed;
    const cursors = this.cursors;
    const wasd = this.wasd;
    const vx = (cursors.left.isDown || wasd.A.isDown ? -1 : 0) + (cursors.right.isDown || wasd.D.isDown ? 1 : 0);
    const vy = (cursors.up.isDown || wasd.W.isDown ? -1 : 0) + (cursors.down.isDown || wasd.S.isDown ? 1 : 0);
    this.player.setVelocity(vx * speed, vy * speed);
  }

  spawnEnemy() {
    const side = Phaser.Math.Between(0, 3);
    const margin = 50;
    const { width, height } = this.scale;
    let x, y;
    if (side === 0) { x = -margin; y = Phaser.Math.Between(0, height); }
    else if (side === 1) { x = width + margin; y = Phaser.Math.Between(0, height); }
    else if (side === 2) { x = Phaser.Math.Between(0, width); y = -margin; }
    else { x = Phaser.Math.Between(0, width); y = height + margin; }
    const key = 'enemy' + Phaser.Math.Between(0, enemyUrls.length - 1);
    const enemy = this.enemies.create(x, y, key).setScale(0.5);
    enemy.health = 1 + Math.floor(this.level / 2);
  }

  fireBullet() {
    if (this.enemies.getLength() === 0) return;
    const enemy = this.enemies.getFirstAlive();
    if (!enemy) return;
    const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
    bullet.setScale(0.5);
    this.physics.moveToObject(bullet, enemy, this.bulletSpeed);
    bullet.lifespan = 2000;
  }

  hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.health -= this.bulletDamage;
    if (enemy.health <= 0) {
      this.spawnXp(enemy.x, enemy.y);
      enemy.destroy();
    }
  }

  spawnXp(x, y) {
    const orb = this.xpOrbs.create(x, y, 'xp');
    orb.setScale(0.5);
  }

  collectXp(player, orb) {
    orb.destroy();
    this.xp += 1;
    if (this.xp >= this.xpForNext) {
      this.levelUp();
    }
    updateHud(this);
  }

  levelUp() {
    this.level++;
    this.xp -= this.xpForNext;
    this.xpForNext += 5;
    this.scene.pause();
    showLevelUp(this);
    updateHud(this);
  }

  playerHit(player, enemy) {
    enemy.destroy();
    this.health -= 1;
    updateHud(this);
    if (this.health <= 0) {
      this.scene.restart();
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222',
  physics: { default: 'arcade' },
  scene: [GameScene]
};

const game = new Phaser.Game(config);

function showLevelUp(scene) {
  const upgrades = [
    { name: 'Fire Rate +20%', apply: () => scene.fireRate *= 0.8 },
    { name: 'Bullet Speed +20%', apply: () => scene.bulletSpeed *= 1.2 },
    { name: 'Bullet Damage +1', apply: () => scene.bulletDamage += 1 },
    { name: 'Move Speed +10%', apply: () => scene.playerSpeed *= 1.1 }
  ];
  const choices = Phaser.Utils.Array.Shuffle(upgrades).slice(0,3);
  const div = document.getElementById('levelup');
  div.innerHTML = '<h2>Level Up!</h2>';
  choices.forEach(up => {
    const btn = document.createElement('button');
    btn.textContent = up.name;
    btn.onclick = () => {
      up.apply();
      div.style.display = 'none';
      scene.scene.resume();
    };
    div.appendChild(btn);
  });
  div.style.display = 'flex';
}

function updateHud(scene) {
  const hp = document.getElementById('healthBar');
  hp.style.width = (100 * scene.health / scene.maxHealth) + '%';
  const xp = document.getElementById('xpBar');
  xp.style.width = (100 * scene.xp / scene.xpForNext) + '%';
}

