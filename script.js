const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const game = document.getElementById("game");
const gameOver = document.getElementById("gameOver");

const startBtn = document.getElementById("startBtn");
const exitBtn = document.getElementById("exitBtn");
const restartBtn = document.getElementById("restartBtn");
const gameExitBtn = document.getElementById("gameExitBtn");

const upBtn = document.getElementById("upBtn");
const leftBtn = document.getElementById("leftBtn");
const downBtn = document.getElementById("downBtn");
const rightBtn = document.getElementById("rightBtn");

const scoreText = document.getElementById("score");
const levelText = document.getElementById("level");
const bestScoreText = document.getElementById("bestScore");
const menuBestText = document.getElementById("menuBest");
const finalScoreText = document.getElementById("finalScore");

const GRID = 20;

const foodColors = [
    "#ff647d",
    "#ffcd3c",
    "#a57de1",
    "#5aa5eb",
    "#50c378"
];

const snakeColors = [
    ["#78d296", "#5abe82", "#46a56e"],
    ["#82bef0", "#64a5dc", "#4b8cc3"],
    ["#ffbe78", "#f5a05a", "#e18746"],
    ["#d2a0eb", "#b982d7", "#a069bd"],
    ["#ff96be", "#f279a2", "#dc5b87"]
];

let snake = [];
let foods = [];
let particles = [];

let direction = {
    x: 1,
    y: 0
};

let nextDirection = {
    x: 1,
    y: 0
};

let score = 0;

let bestScore = Number(
    localStorage.getItem("snakeBest") || 0
);

let colorIndex = 0;
let gameRunning = false;
let gameEnded = false;

let lastMove = 0;

let smoothSnake = [];


/* Ukuran canvas */
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);

    if (gameRunning && snake.length > 0) {
        for (let i = 0; i < snake.length; i++) {
            if (!smoothSnake[i]) {
                smoothSnake[i] = {
                    x: snake[i].x,
                    y: snake[i].y
                };
            }
        }
    }
}


/* Membuat makanan */
function randomFood() {
    const maxX = Math.floor(canvas.width / GRID);
    const maxY = Math.floor(canvas.height / GRID);

    let food;

    do {
        food = {
            x: Math.floor(Math.random() * maxX) * GRID,
            y: Math.floor(Math.random() * maxY) * GRID,
            color: foodColors[
                Math.floor(
                    Math.random() * foodColors.length
                )
            ],
            pulse: Math.random() * Math.PI * 2
        };
    } while (
        snake.some(
            part =>
                part.x === food.x &&
                part.y === food.y
        ) ||
        foods.some(
            item =>
                item.x === food.x &&
                item.y === food.y
        )
    );

    return food;
}


/* Membuat 5 makanan */
function createFoods() {
    foods = [];

    for (let i = 0; i < 5; i++) {
        foods.push(randomFood());
    }
}


/* Reset game */
function resetGame() {
    resizeCanvas();

    const startX =
        Math.floor(canvas.width / GRID / 2) * GRID;

    const startY =
        Math.max(
            GRID * 6,
            Math.floor(canvas.height / GRID / 2) * GRID
        );

    snake = [
        {
            x: startX,
            y: startY
        },
        {
            x: startX - GRID,
            y: startY
        },
        {
            x: startX - GRID * 2,
            y: startY
        }
    ];

    smoothSnake = snake.map(part => ({
        x: part.x,
        y: part.y
    }));

    direction = {
        x: 1,
        y: 0
    };

    nextDirection = {
        x: 1,
        y: 0
    };

    score = 0;
    colorIndex = 0;

    particles = [];

    createFoods();

    gameRunning = true;
    gameEnded = false;

    lastMove = performance.now();

    updateScore();
}


/* Arah ular */
function setDirection(x, y) {
    if (!gameRunning) return;

    if (
        x === -direction.x &&
        y === -direction.y
    ) {
        return;
    }

    nextDirection = {
        x: x,
        y: y
    };
}


/* Tombol arah */
function controlButton(button, x, y) {

    button.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();
            event.stopPropagation();

            setDirection(x, y);
        }
    );
}

controlButton(upBtn, 0, -1);
controlButton(leftBtn, -1, 0);
controlButton(downBtn, 0, 1);
controlButton(rightBtn, 1, 0);


/* Keyboard */
document.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key.toLowerCase();

        if (
            key === "arrowup" ||
            key === "w"
        ) {
            event.preventDefault();
            setDirection(0, -1);
        }

        if (
            key === "arrowdown" ||
            key === "s"
        ) {
            event.preventDefault();
            setDirection(0, 1);
        }

        if (
            key === "arrowleft" ||
            key === "a"
        ) {
            event.preventDefault();
            setDirection(-1, 0);
        }

        if (
            key === "arrowright" ||
            key === "d"
        ) {
            event.preventDefault();
            setDirection(1, 0);
        }
    }
);


/* Partikel saat makan */
function createParticles(
    x,
    y,
    color
) {

    for (let i = 0; i < 12; i++) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            Math.random() * 2 + 1;

        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}


/* Update partikel */
function updateParticles() {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.life -= 0.035;

        p.vx *= 0.97;
        p.vy *= 0.97;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}


/* Update game */
function update() {

    if (!gameRunning) return;

    const now = performance.now();

    /* Kecepatan ular */
    const speed = Math.max(
        100,
        160 - score * 2
    );

    if (
        now - lastMove < speed
    ) {
        return;
    }

    lastMove = now;

    direction = {
        x: nextDirection.x,
        y: nextDirection.y
    };

    const head = {
        x: snake[0].x +
            direction.x * GRID,

        y: snake[0].y +
            direction.y * GRID
    };


    /* Tabrakan dinding */
    if (
        head.x < 0 ||
        head.x >= canvas.width ||
        head.y < 0 ||
        head.y >= canvas.height
    ) {
        endGame();
        return;
    }


    /* Tabrakan badan */
    for (
        let i = 0;
        i < snake.length;
        i++
    ) {

        if (
            head.x === snake[i].x &&
            head.y === snake[i].y
        ) {
            endGame();
            return;
        }
    }


    snake.unshift(head);

    let eaten = false;


    /* Cek makanan */
    for (
        let i = foods.length - 1;
        i >= 0;
        i--
    ) {

        const food = foods[i];

        if (
            head.x === food.x &&
            head.y === food.y
        ) {

            createParticles(
                food.x + GRID / 2,
                food.y + GRID / 2,
                food.color
            );

            foods.splice(i, 1);

            score++;

            colorIndex =
                (colorIndex + 1) %
                snakeColors.length;

            eaten = true;

            break;
        }
    }


    /* Jika tidak makan */
    if (!eaten) {
        snake.pop();
    }


    /* Tambah makanan */
    while (foods.length < 5) {
        foods.push(randomFood());
    }

    updateScore();
}


/* Background */
function drawBackground() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#fffafd";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /* Grid */
    ctx.strokeStyle =
        "rgba(180, 150, 190, 0.08)";

    ctx.lineWidth = 1;

    for (
        let x = 0;
        x < canvas.width;
        x += GRID
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();
    }

    for (
        let y = 0;
        y < canvas.height;
        y += GRID
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();
    }
}


/* Makanan */
function drawFoods(time) {

    foods.forEach(food => {

        const pulse =
            Math.sin(
                time * 0.005 +
                food.pulse
            ) * 2;

        const size =
            GRID - 5 + pulse;

        const x =
            food.x + GRID / 2;

        const y =
            food.y + GRID / 2;


        /* Bayangan */
        ctx.beginPath();

        ctx.arc(
            x,
            y + 2,
            size / 2,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.08)";

        ctx.fill();


        /* Makanan */
        ctx.beginPath();

        ctx.arc(
            x,
            y,
            size / 2,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            food.color;

        ctx.fill();


        /* Kilau */
        ctx.beginPath();

        ctx.arc(
            x - 3,
            y - 3,
            2,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(255,255,255,0.8)";

        ctx.fill();
    });
}


/* Ular */
function drawSnake() {

    const colors =
        snakeColors[colorIndex];

    snake.forEach(
        (part, index) => {

            if (!smoothSnake[index]) {
                smoothSnake[index] = {
                    x: part.x,
                    y: part.y
                };
            }


            /* Smooth movement */
            smoothSnake[index].x +=
                (
                    part.x -
                    smoothSnake[index].x
                ) * 0.28;

            smoothSnake[index].y +=
                (
                    part.y -
                    smoothSnake[index].y
                ) * 0.28;


            const x =
                smoothSnake[index].x;

            const y =
                smoothSnake[index].y;

            const padding = 2;

            const size =
                GRID - padding * 2;


            /* Bayangan */
            ctx.fillStyle =
                "rgba(0,0,0,0.10)";

            ctx.beginPath();

            ctx.roundRect(
                x + padding,
                y + padding + 2,
                size,
                size,
                6
            );

            ctx.fill();


            /* Warna badan */
            let bodyColor;

            if (index === 0) {
                bodyColor = colors[0];
            }
            else if (index % 2 === 0) {
                bodyColor = colors[1];
            }
            else {
                bodyColor = colors[2];
            }

            ctx.fillStyle =
                bodyColor;

            ctx.beginPath();

            ctx.roundRect(
                x + padding,
                y + padding,
                size,
                size,
                6
            );

            ctx.fill();


            /* Mata */
            if (index === 0) {
                drawEyes(x, y);
            }
        }
    );
}


/* Mata ular */
function drawEyes(x, y) {

    let eye1X;
    let eye1Y;
    let eye2X;
    let eye2Y;


    if (direction.x === 1) {

        eye1X = x + 14;
        eye1Y = y + 6;

        eye2X = x + 14;
        eye2Y = y + 14;
    }

    else if (direction.x === -1) {

        eye1X = x + 6;
        eye1Y = y + 6;

        eye2X = x + 6;
        eye2Y = y + 14;
    }

    else if (direction.y === -1) {

        eye1X = x + 6;
        eye1Y = y + 6;

        eye2X = x + 14;
        eye2Y = y + 6;
    }

    else {

        eye1X = x + 6;
        eye1Y = y + 14;

        eye2X = x + 14;
        eye2Y = y + 14;
    }


    /* Mata putih */
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
        eye1X,
        eye1Y,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        eye2X,
        eye2Y,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Pupil */
    ctx.fillStyle = "#463c46";

    ctx.beginPath();

    ctx.arc(
        eye1X,
        eye1Y,
        1.5,
        0,
        Math.PI * 2
    );

    ctx.arc(
        eye2X,
        eye2Y,
        1.5,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* Partikel */
function drawParticles() {

    particles.forEach(p => {

        ctx.globalAlpha =
            p.life;

        ctx.fillStyle =
            p.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    ctx.globalAlpha = 1;
}


/* Score */
function updateScore() {

    scoreText.textContent =
        score;

    const level =
        Math.floor(score / 5) + 1;

    levelText.textContent =
        level;


    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            "snakeBest",
            bestScore
        );
    }

    bestScoreText.textContent =
        bestScore;

    menuBestText.textContent =
        bestScore;
}


/* Game Over */
function endGame() {

    gameRunning = false;
    gameEnded = true;

    finalScoreText.textContent =
        score;

    gameOver.classList.add("show");
}


/* Menu */
function showMenu() {

    gameRunning = false;

    game.classList.remove("active");
    menu.classList.add("active");

    gameOver.classList.remove("show");

    menuBestText.textContent =
        bestScore;
}


/* Mulai game */
function showGame() {

    menu.classList.remove("active");
    game.classList.add("active");

    gameOver.classList.remove("show");

    resetGame();
}


/* Tombol mulai */
startBtn.addEventListener(
    "click",
    function() {
        showGame();
    }
);


/* Tombol keluar */
exitBtn.addEventListener(
    "click",
    function() {
        gameRunning = false;

        alert("Game ditutup.");
    }
);


/* Main lagi */
restartBtn.addEventListener(
    "click",
    function() {

        gameOver.classList.remove(
            "show"
        );

        resetGame();
    }
);


/* Keluar dari Game Over */
gameExitBtn.addEventListener(
    "click",
    function() {
        showMenu();
    }
);


/* Resize */
window.addEventListener(
    "resize",
    function() {
        resizeCanvas();
    }
);


/* Awal */
resizeCanvas();

menuBestText.textContent =
    bestScore;

bestScoreText.textContent =
    bestScore;


/* Game loop */
function gameLoop(time) {

    update();

    updateParticles();

    drawBackground();

    drawFoods(time);

    drawSnake();

    drawParticles();

    requestAnimationFrame(
        gameLoop
    );
}

requestAnimationFrame(
    gameLoop
);