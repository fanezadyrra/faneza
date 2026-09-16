// =========================================================
// CUTE SNAKE GAME
// Konversi dari Python / Pygame ke JavaScript
// =========================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// =========================================================
// PENGATURAN
// =========================================================

const GRID = 20;

const WARNA_MAKANAN = [
    [255, 120, 140],
    [255, 215, 100],
    [180, 150, 230],
    [130, 190, 240],
    [120, 210, 150]
];

const WARNA_ULANG = [
    [
        [120, 210, 150],
        [90, 190, 130],
        [70, 165, 110]
    ],
    [
        [130, 190, 240],
        [100, 165, 220],
        [75, 140, 195]
    ],
    [
        [255, 190, 120],
        [245, 160, 90],
        [225, 135, 70]
    ],
    [
        [210, 160, 235],
        [185, 130, 215],
        [160, 105, 195]
    ],
    [
        [255, 150, 190],
        [240, 120, 165],
        [220, 90, 140]
    ]
];

let WIDTH = 1000;
let HEIGHT = 600;

let isMobile = false;

let screenMode = "menu";

let highScore = 0;

let snake = [];
let smoothSnake = [];

let direction = {
    x: GRID,
    y: 0
};

let foods = [];

let score = 0;
let colorIndex = 0;

let particles = [];

let gameOver = false;

let movementTimer = 0;
let lastTime = 0;

let lastWidth = 0;
let lastHeight = 0;


// =========================================================
// RESIZE CANVAS
// =========================================================

function resizeCanvas() {

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    isMobile = screenWidth < 600 || screenHeight > screenWidth;

    if (isMobile) {

        WIDTH = Math.max(400, screenWidth);
        HEIGHT = Math.max(600, screenHeight);

    } else {

        WIDTH = Math.max(800, screenWidth);
        HEIGHT = Math.max(500, screenHeight);
    }

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    lastWidth = WIDTH;
    lastHeight = HEIGHT;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


// =========================================================
// UTILITAS WARNA
// =========================================================

function rgb(color, alpha = 1) {

    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}


// =========================================================
// MEMBUAT MAKANAN
// =========================================================

function buatMakanan() {

    let x;
    let y;

    while (true) {

        x =
            Math.floor(
                Math.random() * Math.floor(WIDTH / GRID)
            ) * GRID;

        const areaHeight =
            Math.max(
                1,
                Math.floor((HEIGHT - 100) / GRID)
            );

        y =
            100 +
            Math.floor(
                Math.random() * areaHeight
            ) * GRID;

        const food = {
            x: x,
            y: y,
            colorIndex: Math.floor(
                Math.random() * WARNA_MAKANAN.length
            )
        };

        let kenaSnake = false;
        let kenaFood = false;

        for (const s of snake) {

            if (
                food.x < s.x + GRID &&
                food.x + GRID > s.x &&
                food.y < s.y + GRID &&
                food.y + GRID > s.y
            ) {
                kenaSnake = true;
                break;
            }
        }

        for (const f of foods) {

            if (
                food.x < f.x + GRID &&
                food.x + GRID > f.x &&
                food.y < f.y + GRID &&
                food.y + GRID > f.y
            ) {
                kenaFood = true;
                break;
            }
        }

        if (!kenaSnake && !kenaFood) {
            return food;
        }
    }
}


// =========================================================
// MEMBUAT 5 MAKANAN
// =========================================================

function semuaMakanan() {

    foods = [];

    for (let i = 0; i < 5; i++) {
        foods.push(buatMakanan());
    }
}


// =========================================================
// RESET GAME
// =========================================================

function resetGame() {

    const x =
        Math.floor(
            (WIDTH / 2) / GRID
        ) * GRID;

    const y =
        Math.floor(
            (HEIGHT / 2) / GRID
        ) * GRID;

    snake = [
        {
            x: x,
            y: y
        },
        {
            x: x - GRID,
            y: y
        },
        {
            x: x - GRID * 2,
            y: y
        }
    ];

    smoothSnake = snake.map(segment => ({
        x: segment.x,
        y: segment.y
    }));

    direction = {
        x: GRID,
        y: 0
    };

    score = 0;
    colorIndex = 0;

    movementTimer = 0;

    gameOver = false;

    particles = [];

    semuaMakanan();
}


// =========================================================
// EFEK MAKAN
// =========================================================

function efekMakan(x, y, color) {

    for (let i = 0; i < 14; i++) {

        particles.push({
            x: x,
            y: y,

            vx:
                Math.random() * 5 - 2.5,

            vy:
                Math.random() * 5 - 2.5,

            life: 25,

            color: color
        });
    }
}


// =========================================================
// UPDATE PARTIKEL
// =========================================================

function updateParticles() {

    for (let i = particles.length - 1; i >= 0; i--) {

        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.vy += 0.08;

        p.life -= 1;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}


// =========================================================
// GAMBAR PARTIKEL
// =========================================================

function drawParticles() {

    for (const p of particles) {

        const size =
            Math.max(
                2,
                Math.floor(p.life / 7)
            );

        ctx.beginPath();

        ctx.fillStyle = rgb(p.color);

        ctx.arc(
            p.x,
            p.y,
            size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// =========================================================
// BENTUK ROUNDED RECTANGLE
// =========================================================

function roundedRect(
    x,
    y,
    width,
    height,
    radius
) {

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        width,
        height,
        radius
    );
}


// =========================================================
// TEXT CENTER
// =========================================================

function textCenter(
    text,
    x,
    y,
    size,
    color,
    weight = "normal"
) {

    ctx.font =
        `${weight} ${size}px Arial`;

    ctx.fillStyle = color;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        x,
        y
    );
}


// =========================================================
// MENU UTAMA
// =========================================================

function drawMenu() {

    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    // Background
    ctx.fillStyle = "#fff1f7";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    // Lingkaran dekorasi kiri atas
    ctx.beginPath();

    ctx.fillStyle = "#ffc8dc";

    ctx.arc(
        20,
        35,
        75,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Lingkaran dekorasi kanan bawah
    ctx.beginPath();

    ctx.fillStyle = "#c8b4f0";

    ctx.arc(
        WIDTH - 10,
        HEIGHT - 35,
        85,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Lingkaran kecil kanan atas
    ctx.beginPath();

    ctx.fillStyle = "#aadeff";

    ctx.arc(
        WIDTH - 25,
        40,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Panel
    let panelX;
    let panelY;
    let panelWidth;
    let panelHeight;

    let positions;


    if (isMobile) {

        panelX = 35;
        panelY = 55;

        panelWidth = WIDTH - 70;
        panelHeight = HEIGHT - 110;

        positions = [
            130,
            185,
            225,
            280,
            330,
            400,
            475
        ];

    } else {

        panelWidth = 440;
        panelHeight = 490;

        panelX =
            WIDTH / 2 - 220;

        panelY =
            HEIGHT / 2 - 245;

        positions = [
            HEIGHT / 2 - 190,
            HEIGHT / 2 - 135,
            HEIGHT / 2 - 95,
            HEIGHT / 2 - 40,
            HEIGHT / 2 + 10,
            HEIGHT / 2 + 80,
            HEIGHT / 2 + 150
        ];
    }


    // Panel putih
    roundedRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        30
    );

    ctx.fillStyle = "#ffffff";

    ctx.fill();


    const cx = WIDTH / 2;


    // =====================================================
    // JUDUL
    // =====================================================

    textCenter(
        "SNAKE GAME",
        cx,
        positions[0],
        62,
        "#78d296",
        "bold"
    );


    // =====================================================
    // ULAR KECIL
    // =====================================================

    const snakeColors =
        WARNA_ULANG[0];

    for (
        let i = 0;
        i < snakeColors.length;
        i++
    ) {

        ctx.beginPath();

        ctx.fillStyle =
            rgb(snakeColors[i]);

        ctx.arc(
            cx - 40 + i * 20,
            positions[1],
            14,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    // Mata ular
    ctx.beginPath();

    ctx.fillStyle = "#ffffff";

    ctx.arc(
        cx - 36,
        positions[1] - 4,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.fillStyle = "#3c3741";

    ctx.arc(
        cx - 35,
        positions[1] - 4,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // =====================================================
    // WELCOME
    // =====================================================

    textCenter(
        "Welcome to Cute Snake!",
        cx,
        positions[2],
        24,
        "#968291"
    );


    // =====================================================
    // BEST SCORE
    // =====================================================

    const bestBox = {
        x: cx - 110,
        y: positions[3] - 25,
        width: 220,
        height: 50
    };

    roundedRect(
        bestBox.x,
        bestBox.y,
        bestBox.width,
        bestBox.height,
        15
    );

    ctx.fillStyle = "#ffebf3";

    ctx.fill();


    textCenter(
        `Best Score : ${highScore}`,
        cx,
        positions[3],
        24,
        "#3c3741"
    );


    // =====================================================
    // TOMBOL MULAI
    // =====================================================

    const startButton = {
        x: cx - 120,
        y: positions[4],
        width: 240,
        height: 55
    };

    roundedRect(
        startButton.x,
        startButton.y,
        startButton.width,
        startButton.height,
        15
    );

    ctx.fillStyle = "#78d296";

    ctx.fill();


    textCenter(
        "MULAI GAME",
        cx,
        startButton.y + 27,
        32,
        "#ffffff",
        "bold"
    );


    // =====================================================
    // TOMBOL KELUAR
    // =====================================================

    const exitButton = {
        x: cx - 120,
        y: positions[5],
        width: 240,
        height: 55
    };

    roundedRect(
        exitButton.x,
        exitButton.y,
        exitButton.width,
        exitButton.height,
        15
    );

    ctx.fillStyle = "#ff788c";

    ctx.fill();


    textCenter(
        "KELUAR",
        cx,
        exitButton.y + 27,
        32,
        "#ffffff",
        "bold"
    );


    // =====================================================
    // INFO
    // =====================================================

    textCenter(
        "WASD / Arrow Keys",
        cx,
        positions[6],
        24,
        "#968291"
    );

    textCenter(
        "Klik tombol untuk bermain",
        cx,
        positions[6] + 30,
        24,
        "#968291"
    );
}


// =========================================================
// UPDATE GAME
// =========================================================

function updateGame(dt) {

    if (gameOver) {
        updateParticles();
        return;
    }


    movementTimer += dt;


    // Kecepatan sama seperti Python
    const speed =
        Math.max(
            70,
            125 - score * 3
        );


    // =====================================================
    // GERAK ULAR
    // =====================================================

    if (movementTimer >= speed) {

        movementTimer = 0;


        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };


        snake.unshift(head);


        // =================================================
        // CEK MAKANAN
        // =================================================

        let eatenIndex = -1;

        for (
            let i = 0;
            i < foods.length;
            i++
        ) {

            const food = foods[i];

            if (
                head.x < food.x + GRID &&
                head.x + GRID > food.x &&
                head.y < food.y + GRID &&
                head.y + GRID > food.y
            ) {

                eatenIndex = i;
                break;
            }
        }


        // =================================================
        // MAKAN
        // =================================================

        if (eatenIndex !== -1) {

            const eatenFood =
                foods[eatenIndex];

            score += 1;


            colorIndex =
                (colorIndex + 1)
                % WARNA_ULANG.length;


            efekMakan(
                eatenFood.x + GRID / 2,
                eatenFood.y + GRID / 2,
                WARNA_MAKANAN[
                    eatenFood.colorIndex
                ]
            );


            foods.splice(
                eatenIndex,
                1
            );


            foods.push(
                buatMakanan()
            );


            if (score > highScore) {
                highScore = score;
            }

        } else {

            // Kalau tidak makan,
            // ekor dihapus
            snake.pop();
        }


        // =================================================
        // CEK DINDING
        // =================================================

        if (
            head.x < 0 ||
            head.x + GRID > WIDTH ||
            head.y < 100 ||
            head.y + GRID > HEIGHT
        ) {

            gameOver = true;
        }


        // =================================================
        // CEK TABRAKAN BADAN
        // =================================================

        for (
            let i = 1;
            i < snake.length;
            i++
        ) {

            const body = snake[i];

            if (
                head.x < body.x + GRID &&
                head.x + GRID > body.x &&
                head.y < body.y + GRID &&
                head.y + GRID > body.y
            ) {

                gameOver = true;
                break;
            }
        }
    }


    // =====================================================
    // SMOOTH MOVEMENT
    // =====================================================

    if (
        smoothSnake.length !==
        snake.length
    ) {

        smoothSnake =
            snake.map(segment => ({
                x: segment.x,
                y: segment.y
            }));
    }


    const faktorSmooth =
        Math.min(
            1,
            dt / 80
        );


    for (
        let i = 0;
        i < snake.length;
        i++
    ) {

        smoothSnake[i].x +=
            (
                snake[i].x -
                smoothSnake[i].x
            ) * faktorSmooth;


        smoothSnake[i].y +=
            (
                snake[i].y -
                smoothSnake[i].y
            ) * faktorSmooth;
    }


    updateParticles();
}


// =========================================================
// GAMBAR GAME
// =========================================================

function drawGame() {

    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    // =====================================================
    // BACKGROUND
    // =====================================================

    ctx.fillStyle = "#fff1f7";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    // =====================================================
    // HEADER
    // =====================================================

    ctx.fillStyle = "#ffdceb";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        85
    );


    // =====================================================
    // SCORE BOX
    // =====================================================

    const scoreBox = {
        x: 20,
        y: 18,
        width: 105,
        height: 50
    };

    roundedRect(
        scoreBox.x,
        scoreBox.y,
        scoreBox.width,
        scoreBox.height,
        15
    );

    ctx.fillStyle = "#ffffff";

    ctx.fill();


    textCenter(
        `Score: ${score}`,
        72,
        43,
        26,
        "#3c3741"
    );


    // =====================================================
    // LEVEL BOX
    // =====================================================

    const levelBox = {
        x: 145,
        y: 18,
        width: 110,
        height: 50
    };

    roundedRect(
        levelBox.x,
        levelBox.y,
        levelBox.width,
        levelBox.height,
        15
    );

    ctx.fillStyle = "#ffffff";

    ctx.fill();


    textCenter(
        `Level: ${Math.floor(score / 5) + 1}`,
        200,
        43,
        26,
        "#3c3741"
    );


    // =====================================================
    // BEST SCORE
    // =====================================================

    const bestBoxX =
        Math.max(
            270,
            WIDTH - 125
        );


    const bestCenter =
        WIDTH - 72;


    roundedRect(
        bestBoxX,
        18,
        105,
        50,
        15
    );

    ctx.fillStyle = "#ffffff";

    ctx.fill();


    textCenter(
        `Best: ${highScore}`,
        bestCenter,
        43,
        26,
        "#3c3741"
    );


    // =====================================================
    // AREA GAME
    // =====================================================

    ctx.fillStyle = "#ffebf3";

    ctx.fillRect(
        0,
        100,
        WIDTH,
        HEIGHT - 100
    );


    // =====================================================
    // GRID
    // =====================================================

    ctx.strokeStyle = "#fadce8";

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x < WIDTH;
        x += GRID
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            100
        );

        ctx.lineTo(
            x,
            HEIGHT
        );

        ctx.stroke();
    }


    for (
        let y = 100;
        y < HEIGHT;
        y += GRID
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            WIDTH,
            y
        );

        ctx.stroke();
    }


    // =====================================================
    // WARNA ULAR
    // =====================================================

    const snakeColors =
        WARNA_ULANG[colorIndex];


    // =====================================================
    // GAMBAR ULAR
    // =====================================================

    for (
        let i = 0;
        i < smoothSnake.length;
        i++
    ) {

        const part =
            smoothSnake[i];


        const x = Math.round(part.x);
        const y = Math.round(part.y);


        let color;


        if (i === 0) {

            color =
                snakeColors[0];

        } else if (i % 2 === 1) {

            color =
                snakeColors[1];

        } else {

            color =
                snakeColors[2];
        }


        roundedRect(
            x,
            y,
            GRID,
            GRID,
            7
        );

        ctx.fillStyle =
            rgb(color);

        ctx.fill();
    }


    // =====================================================
    // MATA ULAR
    // =====================================================

    if (smoothSnake.length > 0) {

        const head =
            smoothSnake[0];


        const hx =
            head.x;

        const hy =
            head.y;


        let eye1;
        let eye2;


        if (
            direction.x === GRID
        ) {

            eye1 = {
                x: hx + GRID - 6,
                y: hy + 5
            };

            eye2 = {
                x: hx + GRID - 6,
                y: hy + GRID - 5
            };

        } else if (
            direction.x === -GRID
        ) {

            eye1 = {
                x: hx + 6,
                y: hy + 5
            };

            eye2 = {
                x: hx + 6,
                y: hy + GRID - 5
            };

        } else if (
            direction.y === -GRID
        ) {

            eye1 = {
                x: hx + 5,
                y: hy + 6
            };

            eye2 = {
                x: hx + GRID - 5,
                y: hy + 6
            };

        } else {

            eye1 = {
                x: hx + 5,
                y: hy + GRID - 6
            };

            eye2 = {
                x: hx + GRID - 5,
                y: hy + GRID - 6
            };
        }


        for (
            const eye of [eye1, eye2]
        ) {

            ctx.beginPath();

            ctx.fillStyle = "#ffffff";

            ctx.arc(
                eye.x,
                eye.y,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.beginPath();

            ctx.fillStyle = "#3c3741";

            ctx.arc(
                eye.x,
                eye.y,
                2,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }


    // =====================================================
    // MAKANAN
    // =====================================================

    const waktu =
        performance.now();


    for (
        let i = 0;
        i < foods.length;
        i++
    ) {

        const food =
            foods[i];


        const pulse =
            Math.sin(
                waktu * 0.008 + i
            ) * 2;


        const radius =
            9 + pulse;


        const centerX =
            food.x + GRID / 2;

        const centerY =
            food.y + GRID / 2;


        // makanan
        ctx.beginPath();

        ctx.fillStyle =
            rgb(
                WARNA_MAKANAN[
                    food.colorIndex
                ]
            );

        ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // titik putih
        ctx.beginPath();

        ctx.fillStyle = "#ffffff";

        ctx.arc(
            centerX - 3,
            centerY - 3,
            2,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // titik hijau kecil
        ctx.beginPath();

        ctx.fillStyle = "#78d296";

        ctx.arc(
            centerX + 5,
            centerY - 7,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    // =====================================================
    // PARTIKEL
    // =====================================================

    drawParticles();


    // =====================================================
    // INFORMASI KONTROL
    // =====================================================

    textCenter(
        "WASD / Arrow Keys",
        WIDTH / 2,
        HEIGHT - 12,
        24,
        "#968291"
    );


    // =====================================================
    // GAME OVER
    // =====================================================

    if (gameOver) {

        drawGameOver();
    }
}


// =========================================================
// GAME OVER
// =========================================================

function drawGameOver() {

    // Overlay
    ctx.fillStyle =
        "rgba(255, 220, 235, 0.82)";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    const boxWidth =
        Math.min(
            500,
            WIDTH - 50
        );

    const boxHeight = 290;


    const boxX =
        WIDTH / 2 -
        boxWidth / 2;

    const boxY =
        HEIGHT / 2 -
        145;


    // Box putih
    roundedRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight,
        25
    );

    ctx.fillStyle = "#ffffff";

    ctx.fill();


    // Judul
    textCenter(
        "GAME OVER",
        WIDTH / 2,
        HEIGHT / 2 - 95,
        52,
        "#ff788c",
        "bold"
    );


    // Score
    textCenter(
        `Score: ${score}`,
        WIDTH / 2,
        HEIGHT / 2 - 45,
        42,
        "#3c3741"
    );


    // =====================================================
    // MAIN LAGI
    // =====================================================

    const mainButton = {
        x: WIDTH / 2 - 120,
        y: HEIGHT / 2,
        width: 240,
        height: 50
    };


    roundedRect(
        mainButton.x,
        mainButton.y,
        mainButton.width,
        mainButton.height,
        15
    );

    ctx.fillStyle = "#78d296";

    ctx.fill();


    textCenter(
        "MAIN LAGI",
        WIDTH / 2,
        mainButton.y + 25,
        26,
        "#ffffff",
        "bold"
    );


    // =====================================================
    // KELUAR
    // =====================================================

    const exitButton = {
        x: WIDTH / 2 - 120,
        y: HEIGHT / 2 + 65,
        width: 240,
        height: 50
    };


    roundedRect(
        exitButton.x,
        exitButton.y,
        exitButton.width,
        exitButton.height,
        15
    );

    ctx.fillStyle = "#ff788c";

    ctx.fill();


    textCenter(
        "KELUAR",
        WIDTH / 2,
        exitButton.y + 25,
        26,
        "#ffffff",
        "bold"
    );
}


// =========================================================
// KONTROL KEYBOARD
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();


        // Menu
        if (screenMode === "menu") {

            if (
                key === "enter"
            ) {

                screenMode = "game";

                resetGame();

                return;
            }


            if (
                key === "escape"
            ) {

                return;
            }
        }


        // Game
        if (
            screenMode === "game" &&
            !gameOver
        ) {

            if (
                (
                    key === "arrowup" ||
                    key === "w"
                ) &&
                direction.y !== GRID
            ) {

                direction.x = 0;
                direction.y = -GRID;
            }


            else if (
                (
                    key === "arrowdown" ||
                    key === "s"
                ) &&
                direction.y !== -GRID
            ) {

                direction.x = 0;
                direction.y = GRID;
            }


            else if (
                (
                    key === "arrowleft" ||
                    key === "a"
                ) &&
                direction.x !== GRID
            ) {

                direction.x = -GRID;
                direction.y = 0;
            }


            else if (
                (
                    key === "arrowright" ||
                    key === "d"
                ) &&
                direction.x !== -GRID
            ) {

                direction.x = GRID;
                direction.y = 0;
            }
        }


        // ESC keluar game ke menu
        if (
            screenMode === "game" &&
            key === "escape"
        ) {

            screenMode = "menu";
        }
    }
);


// =========================================================
// KLIK MOUSE / TOUCH
// =========================================================

canvas.addEventListener(
    "pointerdown",
    function (event) {

        const rect =
            canvas.getBoundingClientRect();


        const scaleX =
            WIDTH / rect.width;

        const scaleY =
            HEIGHT / rect.height;


        const x =
            (event.clientX - rect.left)
            * scaleX;

        const y =
            (event.clientY - rect.top)
            * scaleY;


        // =================================================
        // MENU
        // =================================================

        if (
            screenMode === "menu"
        ) {

            const cx =
                WIDTH / 2;


            let startY;
            let exitY;


            if (isMobile) {

                startY = 330;
                exitY = 400;

            } else {

                startY =
                    HEIGHT / 2 + 10;

                exitY =
                    HEIGHT / 2 + 80;
            }


            if (
                x >= cx - 120 &&
                x <= cx + 120 &&
                y >= startY &&
                y <= startY + 55
            ) {

                screenMode = "game";

                resetGame();

                return;
            }


            if (
                x >= cx - 120 &&
                x <= cx + 120 &&
                y >= exitY &&
                y <= exitY + 55
            ) {

                // Browser biasanya tidak mengizinkan
                // JavaScript menutup tab sendiri.
                // Jadi kembali ke halaman kosong.
                ctx.clearRect(
                    0,
                    0,
                    WIDTH,
                    HEIGHT
                );

                ctx.fillStyle = "#fff1f7";

                ctx.fillRect(
                    0,
                    0,
                    WIDTH,
                    HEIGHT
                );

                textCenter(
                    "TERIMA KASIH ♡",
                    WIDTH / 2,
                    HEIGHT / 2,
                    35,
                    "#ff788c",
                    "bold"
                );

                screenMode = "closed";

                return;
            }
        }


        // =================================================
        // GAME OVER
        // =================================================

        if (
            screenMode === "game" &&
            gameOver
        ) {

            const cx =
                WIDTH / 2;


            // Main Lagi
            if (
                x >= cx - 120 &&
                x <= cx + 120 &&
                y >= HEIGHT / 2 &&
                y <= HEIGHT / 2 + 50
            ) {

                resetGame();

                return;
            }


            // Keluar
            if (
                x >= cx - 120 &&
                x <= cx + 120 &&
                y >= HEIGHT / 2 + 65 &&
                y <= HEIGHT / 2 + 115
            ) {

                screenMode = "menu";

                return;
            }
        }
    }
);


// =========================================================
// KONTROL TOUCH / GESER
// =========================================================

let touchStartX = 0;
let touchStartY = 0;


canvas.addEventListener(
    "touchstart",
    function (event) {

        const touch =
            event.touches[0];

        touchStartX =
            touch.clientX;

        touchStartY =
            touch.clientY;
    },
    {
        passive: true
    }
);


canvas.addEventListener(
    "touchend",
    function (event) {

        if (
            screenMode !== "game" ||
            gameOver
        ) {
            return;
        }


        const touch =
            event.changedTouches[0];


        const dx =
            touch.clientX -
            touchStartX;

        const dy =
            touch.clientY -
            touchStartY;


        const minSwipe = 20;


        if (
            Math.abs(dx) <
            minSwipe &&
            Math.abs(dy) <
            minSwipe
        ) {
            return;
        }


        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {

            if (
                dx > 0 &&
                direction.x !== -GRID
            ) {

                direction.x = GRID;
                direction.y = 0;

            } else if (
                dx < 0 &&
                direction.x !== GRID
            ) {

                direction.x = -GRID;
                direction.y = 0;
            }

        } else {

            if (
                dy > 0 &&
                direction.y !== -GRID
            ) {

                direction.x = 0;
                direction.y = GRID;

            } else if (
                dy < 0 &&
                direction.y !== GRID
            ) {

                direction.x = 0;
                direction.y = -GRID;
            }
        }
    },
    {
        passive: true
    }
);


// =========================================================
// GAME LOOP
// =========================================================

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }


    const dt =
        Math.min(
            timestamp - lastTime,
            50
        );


    lastTime = timestamp;


    if (
        screenMode === "menu"
    ) {

        drawMenu();

    } else if (
        screenMode === "game"
    ) {

        updateGame(dt);

        drawGame();

    } else if (
        screenMode === "closed"
    ) {

        // Tidak melakukan apa-apa
    }


    requestAnimationFrame(
        gameLoop
    );
}


// =========================================================
// MULAI
// =========================================================

resetGame();

requestAnimationFrame(
    gameLoop
);