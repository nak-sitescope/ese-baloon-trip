// 横移動は妥協してこの辺を参考に
// https://fal-works.github.io/make-games-with-p5js/

const MAX_VELOCITY = -10;
const GRAVITY = 0.3;
const VISCOSITY_COEFFICIENT = 0.02;
const LIFT_FORCE = -10;
const SCROLL_SPEED = 3;

const MAX_OBSTACLES_COUNT = 10;
const OBSTACLES_RADIUS = 5;
const OBSTACLES_CREATION_ESTABLISHMENT = 0.1

let player;
let playerImage;
let obstacles = [];
let score;
let isGameOver = false;

//#region p5jsのイベント類
function setup() {
    playerImage = loadImage('assets/images/kuroko_shitting.png');
    player = new Player(GRAVITY, LIFT_FORCE, MAX_VELOCITY, VISCOSITY_COEFFICIENT, playerImage);
    score = 0
    createCanvas(480, 320);
}

function draw() {
    background(220);

    // プレイヤーステート更新
    player.display();
    player.update();

    // ゲームステート更新
    score++;

    // 障害物生成
    if (obstacles.length < MAX_OBSTACLES_COUNT && random() < OBSTACLES_CREATION_ESTABLISHMENT) {
      obstacles.push(new Obstacle(SCROLL_SPEED, OBSTACLES_RADIUS));
    }

    // hack: デクリメントでforループすると、現在の要素を消してもループカウンタに影響が無い https://joyplot.com/documents/javascript-splice/
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].display();

        // TODO: プレイヤーがボトムに接触時もゲームオーバー？？
        if (obstacles[i].hit(player)) {
            gameOver();
        }

        if (obstacles[i].offscreen()) {
            obstacles.splice(i, 1);
        }
    }

    // UI更新
    fill(0);
    textSize(32);
    textAlign(CENTER, BOTTOM);
    text(`score: ${('00000' + score).slice(-5)}`, width / 2, height - 35);
}
// #endregion

function mousePressed() {
    if(isGameOver) {
        resetGameState();
        return;
    }
    player.flap();
    // TODO: ゲームループが停止中→コンティニュー
}

function keyPressed() {
    if(isGameOver) {
        resetGameState();
        return;
    }
    player.flap();
    // TODO: ゲームループが停止中→コンティニュー
}

function gameOver() {
    noLoop();// ゲームループ停止
    isGameOver = true;
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(`Game Over`, width / 2, height / 2);
}

function resetGameState() {
    return;
    // FIXME: メインループには復帰するが諸々のオブジェクトが消える
    player = new Player(GRAVITY, LIFT_FORCE, MAX_VELOCITY, VISCOSITY_COEFFICIENT);
    obstacles = [];
    score = 0;
    isGameOver = false;
    loop();
}

// TODO: ライフを追加したい（無敵時間など付随ステータスも必要になりそう）
class Player {
    constructor(gravity, liftForce, maxVelocity, viscosityCoefficient = 0.0, playerImage = null) {
        this.type = "Player";
        this.playerImage = player;
        this.x = width / 4;
        this.y = height / 2;
        this.radius = 15;
        this.gravity = gravity;
        this.liftForce = liftForce; // 1回羽ばたく際に増加する速度
        this.velocity = 0; // プレイヤーの速度（x方向のみ）
        this.maxVelocity = maxVelocity;// velocityの上限
        this.viscosityCoefficient = viscosityCoefficient;  // 粘性係数
    }

    display() {
        if(this.playerImage) {
            image(this.playerImage, this.x, this.y, 120, 120);
        } else {
            fill(255);
            ellipse(this.x, this.y, this.radius * 2);
        }
        stroke(255, 0, 0);
        strokeWeight(4);
        line(this.x, this.y, this.x, this.y + this.velocity * 2.0);
        stroke(0);
        strokeWeight(1);
    }

    update() {
        this.velocity += this.gravity - this.velocity * this.viscosityCoefficient;  // 粘性抵抗を加味して計算
        // TODO: 上がる速度も落ちる速度も上限は同じ？
        this.velocity = constrain(this.velocity, -abs(this.maxVelocity), abs(this.maxVelocity));// FIXME: 落ちるスピードが早すぎて羽ばたきが追いつかなくなる
        // this.velocity += this.gravity;
        this.y += this.velocity;
        this.y = constrain(this.y, 0, height); // ゲーム画面の外に出ないようにする

        // 着地していたら速度を 0 にする
        if (this.y >= height) {
            this.velocity = 0;
        }
    }

    flap() {
        // TODO: 上がる速度も落ちる速度も上限は同じ？
        this.velocity = constrain(this.velocity + this.liftForce, -abs(this.maxVelocity), abs(this.maxVelocity));
        // this.velocity += this.liftForce;
    }
}

class Obstacle {
    constructor(scrollSpeed, obstaclesRadius, color) {
        this.type = "Obstacle";
        this.x = width; // 横方向のスポーン位置は右端固定
        this.y = random(height); // 高さだけランダムで
        this.radius = obstaclesRadius;
        this.scrollSpeed = scrollSpeed;
    }

    hit(collidedObject) {
        // FIXME: ゲームコントローラー側の都合でPlayerしか渡してないが、本来はここで衝突対象のオブジェクトを確認すべき？（Unityのタグのようなイメージ）
        const distance = dist(this.x, this.y, collidedObject.x, collidedObject.y);
        return distance < this.radius + collidedObject.radius;
    }

    display() {
        fill(0);
        ellipse(this.x, this.y, this.radius * 2);
    }

    update() {
        this.x -= this.scrollSpeed;// スクロールスピードに合わせて位置をずらす
    }

    offscreen() {
        return this.x < 0;
    }
}
