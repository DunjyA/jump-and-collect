let config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 700,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 300,
      },
      debug: false,
    },
  },
};

let game = new Phaser.Game(config);
let cursors;
let runner;
let coins;
let scoreText;
let maxScoreText;
let endGameText;
let startGameText;
let score = 0;
let maxScore = 0;
let accelerationY = -250;
let isGameOver = false;
let gameStarted = false;
let collectSound;
let failSound;
let currentScene;

//za telefon
let isDragging = false;
let dragStartX = 0;
let dragCurrentX = 0;

function preload() {
  maxScore = localStorage.getItem('maxScore') || 0;
  maxScore = parseInt(maxScore);
  console.log('Loaded max score: ', maxScore);

  this.load.image('stars', 'images/stars.png');
  this.load.image('mountainsHigh', 'images/mountains_high.png');
  this.load.image('mountainsLow', 'images/mountains_low.png');
  this.load.image('ground', 'images/ground.png');
  this.load.image('coin', 'images/coin.png');
  this.load.spritesheet('runner', 'images/runner.png', {
    frameWidth: 100,
    frameHeight: 130,
  });
  this.load.audio('fail', 'sounds/fail.mp3');
  this.load.audio('collect', 'sounds/collect.mp3');
}

function create() {
  currentScene = this;
  cursors = this.input.keyboard.createCursorKeys();

  let graphics = this.add.graphics();
  graphics.fillGradientStyle(0x0d0020, 0x0d0020, 0x445664, 0x445664, 1);
  graphics.fillRect(0, 0, 1280, 700);

  this.stars = this.add.tileSprite(0, 0, 1280, 700, 'stars');
  this.stars.setOrigin(0, 0);

  this.mountainsHigh = this.add.tileSprite(0, 0, 1280, 700, 'mountainsHigh');
  this.mountainsHigh.setOrigin(0, 0);

  this.mountainsLow = this.add.tileSprite(0, 0, 1280, 700, 'mountainsLow');
  this.mountainsLow.setOrigin(0, 0);
  this.mountainsLow.setAlpha(0.9);

  let groundImage = this.add.image(640, 650, 'ground');
  groundImage.setDisplaySize(1280, 100);

  let ground = this.physics.add.staticImage(640, 675, null);
  ground.setSize(1280, 50).setVisible(false);

  runner = this.physics.add.sprite(100, 450, 'runner');
  runner.setBounce(0.1); //odbijanje od predmete
  runner.setCollideWorldBounds(true); //true znaci da nece moci da izadje iz scene
  this.physics.add.collider(runner, ground); //oznacava da ce objekat runner detektovati objekat ground
  // ground.body.setOffset(0, 60); //da bi trcao po travi, runner se spusta za 60px na podlogu

  coins = this.physics.add.group();
  this.physics.add.collider(coins, ground, gameOver, null, this); //detektuje koliziju?
  this.physics.add.overlap(runner, coins, collectCoin, null, this); //potvrdjuje preklapanje dva objekta -> kolizija

  this.anims.create({
    key: 'stand',
    frames: this.anims.generateFrameNumbers('runner', {
      start: 0,
      end: 1,
    }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('runner', {
      start: 2,
      end: 6,
    }),
    frameRate: 10,
    repeat: -1,
  });

  // scoreText = this.add.text(16, 16, 'Score: 0', {
  //   fontSize: '32px',
  //   fill: 'white',
  //   strokeThickness: 1,
  // });
  // scoreText.setOrigin(0, -1.2);
  scoreText = this.add.text(
    this.cameras.main.width * 0.02,
    this.cameras.main.height * 0.12,
    'Score: 0',
    {
      fontSize: Math.floor(this.cameras.main.width * 0.025) + 'px', // Dinamička veličina
      fill: 'white',
      strokeThickness: 1,
    }
  );

  // maxScoreText = this.add.text(16, 16, 'Highest score: ' + maxScore, {
  //   fontSize: '32px',
  //   fill: 'yellow',
  //   strokeThickness: 1,
  // });
  // maxScoreText.setOrigin(0, 0);
  maxScoreText = this.add.text(
    this.cameras.main.width * 0.02,
    this.cameras.main.height * 0.05,
    'Highest score: ' + maxScore,
    {
      fontSize: Math.floor(this.cameras.main.width * 0.025) + 'px', // Dinamička veličina
      fill: 'yellow',
      strokeThickness: 1,
    }
  );

  // endGameText = this.add.text(650, 300, 'GAME OVER\nPress R to Restart', {
  //   fontSize: '75px',
  //   fill: '#fff',
  //   // fontWeight: 700,
  //   stroke: '#000',
  //   strokeThickness: 5,
  //   align: 'center',
  // });
  // endGameText.setVisible(false);
  endGameText = this.add.text(
    this.cameras.main.centerX,
    this.cameras.main.centerY,
    'GAME OVER\nPress R or TAP to Restart',
    {
      fontSize: Math.floor(this.cameras.main.width * 0.05) + 'px', // 5% od širine
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 5,
      align: 'center',
    }
  );
  endGameText.setOrigin(0.5, 0.5);
  endGameText.setVisible(false);

  // startGameText = this.add.text(650, 300, 'Press SPACE to start the game', {
  //   fontSize: '65px',
  //   fill: '#fff',
  //   //fontWeight: 700,
  //   stroke: '#000',
  //   strokeThickness: 5,
  //   align: 'center',
  // });
  startGameText = this.add.text(
    this.cameras.main.centerX,
    this.cameras.main.centerY,
    'Press SPACE or TAP to start',
    {
      fontSize: Math.floor(this.cameras.main.width * 0.045) + 'px', // 4.5% od širine
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 5,
      align: 'center',
    }
  );

  startGameText.setOrigin(0.5, 0.5);
  startGameText.setVisible(!gameStarted);

  collectSound = this.sound.add('collect');
  failSound = this.sound.add('fail');

  this.input.keyboard.on('keydown-R', function () {
    if (isGameOver) {
      restartGame();
    }
  });

  this.input.keyboard.on('keydown-SPACE', () => {
    if (!gameStarted && !isGameOver) {
      gameStarted = true;
      releaseCoin(currentScene);
      startGameText.setVisible(false);
    }
  });

  this.input.on('pointerdown', handlePointerDown); //za telefon
  this.input.on('pointermove', handlePointerMove);
  this.input.on('pointerup', handlePointerUp);

  if (gameStarted) {
    releaseCoin(this);
  }
}

function update() {
  this.stars.tilePositionX += 0.5;
  this.mountainsHigh.tilePositionX += 1;
  this.mountainsLow.tilePositionX += 1;
  // this.groundTile.tilePositionX += 1;

  if (!gameStarted || isGameOver) return;

  if (cursors.left.isDown) {
    runner.setVelocityX(-400); //brzina trcanja
    runner.flipX = true; //okrecemo sprajt
    runner.anims.play('run', true); //aktivira se animacija run
  } else if (cursors.right.isDown) {
    runner.setVelocityX(400); //brzina trcanja
    runner.flipX = false;
    runner.anims.play('run', true);
  } else if (!isDragging) {
    runner.setVelocityX(0); //brzina je 0
    runner.anims.play('stand', true); //akt se stand anim
  }

  if (cursors.up.isDown) {
    if (runner.body.touching.down) {
      runner.setVelocityY(-435); //skakanje
    }
  }

  // if (!runner.body.touching.down && runner.body.velocity.y > 0) {
  //   runner.setFrame(8);
  //   runner.body.setVelocityY(runner.body.velocity.y + 15);
  // }

  // let isOnGround =
  //   runner.body.touching.down ||
  //   (runner.y >= 580 && Math.abs(runner.body.velocity.y) < 50);
  // if (cursors.up.isDown && isOnGround) {
  //   runner.setVelocityY(-435); //skakanje
  // }

  // if (!isOnGround) {
  //   runner.setFrame(7);

  //   if (runner.body.velocity.y > 0) {
  //     runner.setFrame(8);
  //     runner.body.velocity.y += 7;
  //   }
  // }

  if (!runner.body.touching.down) {
    runner.setFrame(7);
  }

  if (runner.body.velocity.y > 0) {
    runner.setFrame(8);
    runner.body.velocity.y += 7;
  }

  if (isGameOver) {
    return;
  }
}

function collectCoin(runner, coin) {
  collectSound.play();
  score = score + 10;
  scoreText.setText('Score: ' + score);

  if (score > maxScore) {
    maxScore = score;
    maxScoreText.setText('Highest score: ' + maxScore);
    maxScoreText.setTint(0x00ff00);

    localStorage.setItem('maxScore', maxScore);
    console.log('New highest score!', maxScore);
  }

  coin.disableBody(true, true); //uklanjanje novcica sa scene
}

function releaseCoin(scene) {
  if (isGameOver || !gameStarted) return;

  let x = Phaser.Math.Between(100, 1000); //raspon padanja novcica

  let coin = coins.create(x, -100, 'coin');
  coin.setBounce(0.2);
  coin.setCollideWorldBounds(true);
  coin.setVelocity(Phaser.Math.Between(-60, 60), 0);

  coin.setAccelerationY(accelerationY);
  accelerationY = accelerationY + 5;

  if (!isGameOver) {
    let delay = Phaser.Math.Between(800, 3000); //generisanje novcica
    let timer = scene.time.delayedCall(delay, releaseCoin, [scene], this);
  }
}

function gameOver() {
  if (isGameOver) return;

  failSound.play();
  currentScene.physics.pause();
  runner.anims.play('stand');
  isGameOver = true;

  let canvas = document.querySelector('canvas');

  startGameText.setVisible(false);
  endGameText.setVisible(true);
  endGameText.setOrigin(0.5, 0.5);
}

function restartGame() {
  score = 0;
  accelerationY = -250;
  isGameOver = false;

  scoreText.setText('Score: 0');
  maxScoreText.setTint(0xffff00);

  startGameText.setVisible(false);
  endGameText.setVisible(false);
  currentScene.scene.restart();
}

//za telefon

// function handleTouch(pointer) {
//   if (!gameStarted && !isGameOver) {
//     gameStarted = true;
//     releaseCoin(currentScene);
//     startGameText.setVisible(false);
//   }
//   // Skakanje tokom igre
//   else if (gameStarted && !isGameOver) {
//     if (runner.body.touching.down) {
//       runner.setVelocityY(-435);
//     }
//   }
//   // Restart nakon game over
//   else if (isGameOver) {
//     restartGame();
//   }
// }

function handlePointerDown(pointer) {
  if (!gameStarted && !isGameOver) {
    gameStarted = true;
    releaseCoin(currentScene);
    startGameText.setVisible(false);
    return;
  }

  if (isGameOver) {
    restartGame();
    return;
  }

  // Počni drag
  isDragging = true;
  dragStartX = pointer.x;
  dragCurrentX = pointer.x;

  // Skok
  if (runner.body.touching.down) {
    runner.setVelocityY(-435);
  }
}

function handlePointerMove(pointer) {
  if (!isDragging || !gameStarted || isGameOver) return;

  dragCurrentX = pointer.x;

  // Računaj razliku u kretanju
  let dragDistance = dragCurrentX - dragStartX;

  // Pomeri runner-a na osnovu drag-a
  if (Math.abs(dragDistance) > 10) {
    // Threshold da spreči slučajno kretanje
    if (dragDistance > 0) {
      // Drag desno
      runner.setVelocityX(400);
      runner.flipX = false;
      runner.anims.play('run', true);
    } else {
      // Drag levo
      runner.setVelocityX(-400);
      runner.flipX = true;
      runner.anims.play('run', true);
    }
  }
}

function handlePointerUp(pointer) {
  isDragging = false;

  // Zaustavi runner-a kada se otpusti dodir
  if (gameStarted && !isGameOver) {
    runner.setVelocityX(0);
    runner.anims.play('stand', true);
  }
}
