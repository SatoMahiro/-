let gameStarted = false;
// 在全局變數區域添加
let startButton;
let audioContext;

// 添加玩家全局變數
let player1;
let player2;

// 在全局變數區域添加
let sounds = {
  bgm: null  // 只保留背景音樂
};
let currentVolume = 0.5; // 預設音量
let isMuted = false;     // 靜音狀態
let lastVolume = 0.5;    // 儲存靜音前的音量

function setup() {
  console.log('Setup starting...'); // 除錯信息
  
  // 不要在這裡調用 noCanvas()，因為我們需要在 startGame 中創建畫布
  startButton = document.getElementById('startButton');
  if (startButton) {
    startButton.addEventListener('click', startGame);
    console.log('Start button listener added'); // 除錯信息
  } else {
    console.error('Start button not found!');
  }

  // 初始化玩家數據
  player1 = {
    x: 100,
    y: 200,
    speedX: 5,
    speedY: 0,
    gravity: 0.8,
    jumpForce: -15,
    isJumping: false,
    groundY: 300,
    currentFrame: 0,
    currentAction: 'idle',
    direction: 1,
    bullets: [],
    health: 100
  };
  
  player2 = {
    x: 800,
    y: 200,
    speedX: 5,
    speedY: 0,
    gravity: 0.8,
    jumpForce: -15,
    isJumping: false,
    groundY: 300,
    currentFrame: 0,
    currentAction: 'idle',
    direction: -1,
    bullets: [],
    health: 100
  };
  
  console.log('Setup completed'); // 除錯信息
}

// 添加開始遊戲函數
function startGame() {
  console.log('Starting game...'); // 除錯信息
  
  const startScreen = document.getElementById('startScreen');
  const gameContainer = document.getElementById('gameContainer');
  
  if (!startScreen || !gameContainer) {
    console.error('Required elements not found!');
    return;
  }
  
  startScreen.style.display = 'none';
  gameContainer.style.display = 'block';
  
  // 創建畫布
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('gameContainer');
  
  // 正確處理音訊上下文並播放背景音樂
  if (getAudioContext()) {
    try {
      userStartAudio().then(() => {
        console.log('Audio context started');
        // 開始播放背景音樂
        if (sounds.bgm && !sounds.bgm.isPlaying()) {
          sounds.bgm.setVolume(currentVolume); // 使用全局音量設定
          sounds.bgm.loop();
        }
      }).catch(error => {
        console.error('Error starting audio context:', error);
      });
    } catch (error) {
      console.error('Error with audio context:', error);
    }
  }
  
  gameStarted = true;
  console.log('Game started, canvas created'); // 除錯信息
}

function draw() {
  if (!gameStarted) return;
  
  // 更新背景位置
  updateBackgroundPosition();
  
  if (sprites.background.img) {
    // 計算縮放比例（基於視窗高度）
    let scale = height / sprites.background.height;
    let scaledWidth = sprites.background.width * scale;
    
    // 繪製背景
    // 主要視圖
    image(sprites.background.img, 
          backgroundPos.x, 0, 
          scaledWidth, height,
          0, 0,
          sprites.background.width, sprites.background.height);
    
    // 為了實現無縫捲動，需要繪製第二份背景
    image(sprites.background.img, 
          backgroundPos.x + scaledWidth, 0, 
          scaledWidth, height,
          0, 0,
          sprites.background.width, sprites.background.height);
    
    // 更新背景位置
    backgroundPos.x -= backgroundPos.scrollSpeed;
    
    // 當背景完全捲動出視圖時重置位置
    if (backgroundPos.x <= -scaledWidth) {
      backgroundPos.x = 0;
    }
  } else {
    // 如果背景圖片未載入，使用純色背景
    background(220);
    console.log('Background image not loaded!'); // 除錯信息
  }
  
  // 繪製其他遊戲元素
  updatePhysics(player1);
  updatePhysics(player2);
  checkKeys();
  checkCollisions();
  drawCharacter(player1, sprites.player1);
  drawCharacter(player2, sprites.player2);
  drawBullets(player1);
  drawBullets(player2);
  drawHealth();
}

// 所有圖片資源配置
let sprites = {
  player1: {
    idle: {
      img: null,
      width: 467/6,
      height: 95,
      frames: 6
    },
    walk: {
      img: null,
      width: 1367/14,
      height: 107,
      frames: 14
    },
    jump: {
      img: null,
      width: 635/8,
      height: 91,
      frames: 8
    }

  },
  player2: {
    idle: {
      img: null,
      width: 732/11,
      height: 69,
      frames: 11
    },
    walk: {
      img: null,
      width: 1168/17,
      height: 59,
      frames: 17
    },
    jump: { 
      img: null,
      width: 967/12,
      height: 78,
      frames: 12
    }
  },

  explosion: {  //爆炸圖
    img: null,
    width: 1192/7,
    height: 115,
    frames: 7
  },
  bullet: { //子彈圖(攻擊
    img: null,
    width: 615/5,
    height: 122,
    frames: 5
  },
  background: { //背景圖
    img: null,
    width: 3840,  // 你的長條形背景圖實際寬度
    height: 1080  // 你的長條形背景圖實際高度
  }
};

// 添加背景位置追蹤
let backgroundPos = {
  x: 0,
  scrollSpeed: 5  // 背景捲動速度
};

function preload() {
  // 添加錯誤處理函數
  function handleImageError(err) {
    console.error('圖片載入錯誤:', err);
  }

  try {
    // 載入角色1的圖片
    sprites.player1.idle.img = loadImage('./player1/idle.png', 
      () => console.log('player1 idle loaded'),
      handleImageError);
    sprites.player1.walk.img = loadImage('./player1/walk.png',
      () => console.log('player1 walk loaded'),
      handleImageError);
    sprites.player1.jump.img = loadImage('./player1/jump.png',
      () => console.log('player1 jump loaded'),
      handleImageError);
    
    // 載入角色2的圖片
    sprites.player2.idle.img = loadImage('./player2/idle.png',
      () => console.log('player2 idle loaded'),
      handleImageError);
    sprites.player2.walk.img = loadImage('./player2/walk.png',
      () => console.log('player2 walk loaded'),
      handleImageError);
    sprites.player2.jump.img = loadImage('./player2/jump.png',
      () => console.log('player2 jump loaded'),
      handleImageError);
    
    // 載入特效圖片
    sprites.bullet.img = loadImage('./bullet/bullet.png',
      () => console.log('bullet loaded'),
      handleImageError);
    sprites.explosion.img = loadImage('./explosion/explosion.png',
      () => console.log('explosion loaded'),
      handleImageError);
      
    // 載入背景圖片
    sprites.background.img = loadImage('./background/background.png',
      () => {
        console.log('Background loaded successfully');
        console.log('Background dimensions:', 
                    sprites.background.img.width, 
                    sprites.background.img.height);
      },
      (err) => {
        console.error('Failed to load background:', err);
        // 載入失敗時使用備用圖片或純色
        sprites.background.img = createGraphics(1920, 1080);
        sprites.background.img.background(200);
      }
    );
  } catch (error) {
    console.error('圖片載入過程發生錯誤:', error);
  }

  // 只載入背景音樂
  try {
    sounds.bgm = loadSound('./sounds/bgm.mp3',
      () => console.log('BGM loaded successfully'),
      (err) => console.error('Failed to load BGM:', err)
    );
  } catch (error) {
    console.error('背景音樂載入錯誤:', error);
  }
}

// 繪製生命值
function drawHealth() {
  // 玩家1生命值 (左側)
  fill(255, 0, 0);
  rect(10, 10, player1.health, 20);
  
  // 玩家2生命值 (右側)
  push();
  translate(width - 10, 10);
  rect(-player2.health, 0, player2.health, 20);
  pop();
}

// 檢查碰撞
function checkCollisions() {
  // 檢查玩家1的子彈是否擊中玩家2
  for (let i = player1.bullets.length - 1; i >= 0; i--) {
    let bullet = player1.bullets[i];
    if (checkBulletHit(bullet, player2)) {
      bullet.isExploding = true; // 開始爆炸動畫
      bullet.explosionFrame = 0;
      player2.health -= 10;
      // 不要立即移除子彈，等爆炸動畫完成
    }
  }
  
  // 檢查玩家2的子彈是否擊中玩家1
  for (let i = player2.bullets.length - 1; i >= 0; i--) {
    let bullet = player2.bullets[i];
    if (checkBulletHit(bullet, player1)) {
      bullet.isExploding = true; // 開始爆炸動畫
      bullet.explosionFrame = 0;
      player1.health -= 10;
      // 不要立即移除子彈，等爆炸動畫完成
    }
  }
}

// 檢查子彈是否擊中
function checkBulletHit(bullet, player) {
  return bullet.x > player.x && 
         bullet.x < player.x + sprites.player1.idle.width &&
         bullet.y > player.y &&
         bullet.y < player.y + sprites.player1.idle.height;
}

// 鍵盤控制
function keyPressed() {
  // 玩家1控制 (WASD + F)
  if (key === 'f' || key === 'F') {
    shoot(player1);
    player1.currentAction = 'jump';
  }
  
  // 玩家2控制
  if (keyCode === 32) { // 空白鍵
    shoot(player2);
    player2.currentAction = 'jump';
  }

  // 音量控制
  if (key === '=') { // '+' 鍵（不需要按 Shift）
    currentVolume = min(currentVolume + 0.1, 1.0);
    if (!isMuted && sounds.bgm) {
      sounds.bgm.setVolume(currentVolume);
    }
    console.log('Volume up:', currentVolume); // 除錯用
  }
  
  if (key === '-') {
    currentVolume = max(currentVolume - 0.1, 0.0);
    if (!isMuted && sounds.bgm) {
      sounds.bgm.setVolume(currentVolume);
    }
    console.log('Volume down:', currentVolume); // 除錯用
  }
  
  if (key === 'm' || key === 'M') {
    toggleMute();
  }

  // 確保音量在有效範圍內
  currentVolume = constrain(currentVolume, 0.0, 1.0);
  
  // 如果音量大於0且未靜音，確保聲音正在播放
  if (currentVolume > 0 && !isMuted && sounds.bgm) {
    if (!sounds.bgm.isPlaying()) {
      sounds.bgm.loop();
    }
    sounds.bgm.setVolume(currentVolume);
  }
}

function checkKeys() {
  // 玩家1移動控制
  if (keyIsDown(65)) { // A鍵
    player1.x -= player1.speedX;
    player1.direction = -1;
    player1.currentAction = 'walk';
  } else if (keyIsDown(68)) { // D鍵
    player1.x += player1.speedX;
    player1.direction = 1;
    player1.currentAction = 'walk';
  } else if (!player1.isJumping) {
    player1.currentAction = 'idle';
  }

  if (keyIsDown(87) && !player1.isJumping) { // W鍵
    player1.speedY = player1.jumpForce;
    player1.isJumping = true;
    player1.currentAction = 'jump';
  }

  // 玩家2移動控制
  if (keyIsDown(LEFT_ARROW)) { //方向左鍵
    player2.x -= player2.speedX;
    player2.direction = -1;
    player2.currentAction = 'walk';
  } else if (keyIsDown(RIGHT_ARROW)) { //方向右鍵
    player2.x += player2.speedX;
    player2.direction = 1;
    player2.currentAction = 'walk';
  } else if (!player2.isJumping) {
    player2.currentAction = 'idle';
  }

  if (keyIsDown(UP_ARROW) && !player2.isJumping) { //方向上鍵
    player2.speedY = player2.jumpForce;
    player2.isJumping = true;
    player2.currentAction = 'jump';
  }
}

// 發射子彈
function shoot(player) {
  if (player.bullets.length < 3) {
    // 取得當前角色精靈的寬度
    let playerWidth = sprites[player === player1 ? 'player1' : 'player2'].idle.width;
    
    let bullet = {
      x: player.x + (player.direction === 1 ? playerWidth : 0), // 使用正確的角色寬度
      y: player.y + playerWidth/2, // 調整垂直位置到角色中間
      speed: 10 * player.direction,
      isExploding: false,
      currentFrame: 0,
      explosionFrame: 0
    };
    
    console.log("Shooting bullet from:", player.x, player.y); // 除錯用
    console.log("Bullet position:", bullet.x, bullet.y);
    
    player.bullets.push(bullet);
    player.currentAction = 'jump';
    
    setTimeout(() => {
      if (!player.isJumping && player.currentAction === 'jump') {
        player.currentAction = 'idle';
      }
    }, 500);
  }
}

function updatePhysics(player) {
  // 應用重力
  if (player.y < player.groundY) {
    player.speedY += player.gravity;
    player.isJumping = true;
  }
  
  // 更新垂直位置
  player.y += player.speedY;
  
  // 檢查是否著地
  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.speedY = 0;
    player.isJumping = false;
    if (player.currentAction === 'jump') {
      player.currentAction = 'idle';
    }
  }
  
  // 確保角色不會超出畫面範圍
  if (player.x < 0) {
    player.x = 0;
  }
  if (player.x > width - sprites.player1.idle.width) {
    player.x = width - sprites.player1.idle.width;
  }
  
  // 如果沒有其他動作，回到待機狀態
  if (!player.isJumping && player.currentAction !== 'walk') {
    player.currentAction = 'idle';
  }
}

function drawBullets(player) {
    
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    let bullet = player.bullets[i];
    
    if (!bullet.isExploding) {
      let sx = bullet.currentFrame * sprites.bullet.width;
      
      push();
      translate(bullet.x + (bullet.speed < 0 ? sprites.bullet.width : 0), bullet.y);
      scale(bullet.speed > 0 ? 1 : -1, 1);
      image(sprites.bullet.img, 
            0, 0,
            sprites.bullet.width, sprites.bullet.height,
            sx, 0,
            sprites.bullet.width, sprites.bullet.height);
      pop();
      
      bullet.x += bullet.speed;
      
      bullet.currentFrame = (bullet.currentFrame + 1) % sprites.bullet.frames;
      
      if (bullet.x < 0 || bullet.x > width) {
        player.bullets.splice(i, 1);
        continue;
      }
    } 
    else {
      // 爆炸效果
      if (!bullet.explosionStartTime) {
        bullet.explosionStartTime = frameCount;
        bullet.explosionFrame = 0;
      }
      
      let currentTime = frameCount - bullet.explosionStartTime;
      
      // 將等待時間改為 1 幀 (約0.01秒)
      if (currentTime < 1) {
        let explosionSprite = sprites.explosion;
        let sx = bullet.explosionFrame * explosionSprite.width;
        
        image(explosionSprite.img, 
              bullet.x - explosionSprite.width/2, 
              bullet.y - explosionSprite.height/2, 
              explosionSprite.width, explosionSprite.height,
              sx, 0,
              explosionSprite.width, explosionSprite.height);
        
        // 立即完成動畫
        bullet.explosionFrame = explosionSprite.frames - 1;
      } 
      else {
        // 立即移除子彈
        player.bullets.splice(i, 1);
      }
    }
  }
}

function drawCharacter(player, spriteData) {
  let currentSprite = spriteData[player.currentAction];
  let sx = player.currentFrame * currentSprite.width;
  
  push();
  translate(player.x + (player.direction === -1 ? currentSprite.width : 0), player.y);
  scale(player.direction, 1);
  image(currentSprite.img,
        0, 0,
        currentSprite.width, currentSprite.height,
        sx, 0,
        currentSprite.width, currentSprite.height);
  pop();
  
  // 更新動畫幀
  if (frameCount % 5 === 0) { // 控制動畫速度
    player.currentFrame = (player.currentFrame + 1) % currentSprite.frames;
  }
}

function windowResized() {
  // 調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
  
  // 重新計算背景位置（可選）
  if (sprites.background.img) {
    let scale = height / sprites.background.height;
    let scaledWidth = sprites.background.width * scale;
    backgroundPos.x = constrain(backgroundPos.x, -scaledWidth, 0);
  }
}

function updateBackgroundPosition() {
  if (!sprites.background.img) return;
  
  // 計算背景位置基於玩家位置
  let playerCenterX = (player1.x + player2.x) / 2;
  let scale = height / sprites.background.height;
  let scaledWidth = sprites.background.width * scale;
  
  // 計算目標背景位置
  let targetX = -((playerCenterX / width) * (scaledWidth - width));
  
  // 平滑過渡到目標位置
  backgroundPos.x += (targetX - backgroundPos.x) * 0.05;
  
  // 限制背景位置
  backgroundPos.x = constrain(backgroundPos.x, -scaledWidth + width, 0);
}

// 可選：添加背景音樂控制函數
function toggleBGM() {
  if (sounds.bgm) {
    if (sounds.bgm.isPlaying()) {
      sounds.bgm.pause();
    } else {
      sounds.bgm.loop();
    }
  }
}

function setBGMVolume(vol) {
  if (sounds.bgm) {
    sounds.bgm.setVolume(vol); // vol 範圍是 0.0 到 1.0
  }
}

// 添加靜音切換函數
function toggleMute() {
  if (sounds.bgm) {
    if (!isMuted) {
      // 儲存當前音量並靜音
      lastVolume = currentVolume;
      sounds.bgm.setVolume(0);
      isMuted = true;
    } else {
      // 恢復之前的音量
      currentVolume = lastVolume;
      if (currentVolume > 0) {
        sounds.bgm.setVolume(currentVolume);
        if (!sounds.bgm.isPlaying()) {
          sounds.bgm.loop();
        }
      }
      isMuted = false;
    }
    console.log('Mute toggled:', isMuted, 'Volume:', currentVolume); // 除錯用
  }
}
