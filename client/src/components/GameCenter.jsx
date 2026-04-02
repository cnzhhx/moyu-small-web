import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../ThemeContext.jsx';

// ═══════════════════════════════════════════════════
// CRT Scanline Effect Component (Retro-Futurism)
// ═══════════════════════════════════════════════════
const CRTOverlay = ({ intensity = 0.3 }) => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    background: `repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.1) 0px,
      rgba(0, 0, 0, 0.1) 1px,
      transparent 1px,
      transparent 2px
    )`,
    opacity: intensity,
    zIndex: 10,
  }} />
);

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

// ==================== 贪吃蛇游戏 ====================
function SnakeGame({ colors, onScoreUpdate }) {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('moyu-snake-highscore') || '0');
  });
  const directionRef = useRef(direction);
  const gameLoopRef = useRef(null);

  directionRef.current = direction;

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection({ x: 1, y: 0 });
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    onScoreUpdate?.(0);
  };

  const togglePause = () => {
    if (!gameOver) {
      setIsPaused(!isPaused);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          resetGame();
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (isPaused) return;

      const keyMap = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const newDir = keyMap[e.key];
      if (newDir) {
        e.preventDefault();
        const currentDir = directionRef.current;
        // 防止反向移动
        if (currentDir.x !== -newDir.x || currentDir.y !== -newDir.y) {
          setDirection(newDir);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isPaused]);

  useEffect(() => {
    if (gameOver || isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setSnake(currentSnake => {
        const newSnake = [...currentSnake];
        const head = { ...newSnake[0] };
        head.x += directionRef.current.x;
        head.y += directionRef.current.y;

        // 碰撞检测
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return currentSnake;
        }

        // 自身碰撞
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          return currentSnake;
        }

        newSnake.unshift(head);

        // 吃食物
        setFood(currentFood => {
          if (head.x === currentFood.x && head.y === currentFood.y) {
            setScore(s => {
              const newScore = s + 10;
              onScoreUpdate?.(newScore);
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('moyu-snake-highscore', newScore.toString());
              }
              return newScore;
            });
            return generateFood(newSnake);
          }
          newSnake.pop();
          return currentFood;
        });

        return newSnake;
      });
    }, Math.max(50, INITIAL_SPEED - score * 2));

    return () => clearInterval(gameLoopRef.current);
  }, [gameOver, isPaused, score, highScore, generateFood, onScoreUpdate]);

  // 绘制游戏
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = GRID_SIZE * CELL_SIZE;
    canvas.width = size;
    canvas.height = size;

    // 清空画布
    ctx.fillStyle = colors.inputBg;
    ctx.fillRect(0, 0, size, size);

    // 绘制网格
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(size, i * CELL_SIZE);
      ctx.stroke();
    }

    // 绘制食物
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 绘制蛇
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? colors.accent : `${colors.accent}cc`;
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );

      // 蛇头眼睛
      if (isHead) {
        ctx.fillStyle = '#fff';
        const eyeSize = 3;
        const offset = 5;
        ctx.fillRect(
          segment.x * CELL_SIZE + offset,
          segment.y * CELL_SIZE + offset,
          eyeSize, eyeSize
        );
        ctx.fillRect(
          segment.x * CELL_SIZE + CELL_SIZE - offset - eyeSize,
          segment.y * CELL_SIZE + offset,
          eyeSize, eyeSize
        );
      }
    });
  }, [snake, food, colors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Score Board */}
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        padding: '10px 18px', background: colors.cardBg,
        borderRadius: 10, border: `1px solid ${colors.border}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>得分</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#22C55E' }}>{score}</div>
        </div>
        <div style={{ width: 1, height: 32, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>最高分</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#3B82F6' }}>{highScore}</div>
        </div>
        <div style={{ width: 1, height: 32, background: colors.border }} />
        <button
          onClick={togglePause}
          disabled={gameOver}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: isPaused ? '#22C55E' : '#3B82F6',
            color: '#fff', cursor: gameOver ? 'default' : 'pointer',
            fontSize: 13, opacity: gameOver ? 0.5 : 1,
            fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s ease',
            boxShadow: isPaused
              ? '0 2px 8px rgba(34, 197, 94, 0.4)'
              : '0 2px 8px rgba(59, 130, 246, 0.4)',
          }}
        >
          {isPaused ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              继续
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
              暂停
            </>
          )}
        </button>
      </div>

      {/* Game Canvas */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            border: `2px solid ${colors.border}`,
            borderRadius: 10,
            display: 'block',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          }}
        />

        {/* Game Over Overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: 10,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-9c-.83 0-1.5-.67-1.5-1.5S8.17 8 9 8s1.5.67 1.5 1.5S9.83 11 9 11zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 8 15 8s1.5.67 1.5 1.5S15.83 11 15 11z"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              游戏结束
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
              最终得分: <span style={{ color: '#22C55E', fontWeight: 600 }}>{score}</span>
            </div>
            <button
              onClick={resetGame}
              style={{
                padding: '12px 28px', borderRadius: 8, border: 'none',
                background: '#22C55E', color: '#fff',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                transition: 'transform 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              重新开始
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && !gameOver && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: 10,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#22C55E">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>已暂停</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>按空格继续</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        color: colors.textSecondary, fontSize: 12,
        padding: '8px 16px',
        background: colors.inputBg,
        borderRadius: 8,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
          </svg>
          WASD / 方向键 移动
        </span>
        <span style={{ color: colors.border }}>|</span>
        <span>空格 暂停</span>
      </div>
    </div>
  );
}

// ==================== 俄罗斯方块游戏 ====================
const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
const TETRIS_CELL_SIZE = 24;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: '#06b6d4' },
  O: { shape: [[1, 1], [1, 1]], color: '#eab308' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#22c55e' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ef4444' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' },
};

function TetrisGame({ colors, onScoreUpdate }) {
  const canvasRef = useRef(null);
  const [board, setBoard] = useState(Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(0)));
  const [currentPiece, setCurrentPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('moyu-tetris-highscore') || '0');
  });
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);

  const createPiece = useCallback(() => {
    const types = Object.keys(TETROMINOES);
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      type,
      shape: TETROMINOES[type].shape,
      color: TETROMINOES[type].color,
      x: Math.floor(TETRIS_COLS / 2) - Math.floor(TETROMINOES[type].shape[0].length / 2),
      y: 0,
    };
  }, []);

  const resetGame = () => {
    setBoard(Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(0)));
    setCurrentPiece(createPiece());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    onScoreUpdate?.(0);
  };

  const togglePause = () => {
    if (!gameOver) {
      setIsPaused(!isPaused);
    }
  };

  const rotatePiece = (piece) => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: rotated };
  };

  const isValidMove = (piece, newX, newY, newShape = piece.shape) => {
    for (let y = 0; y < newShape.length; y++) {
      for (let x = 0; x < newShape[y].length; x++) {
        if (newShape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          if (boardX < 0 || boardX >= TETRIS_COLS || boardY >= TETRIS_ROWS) {
            return false;
          }
          if (boardY >= 0 && board[boardY][boardX]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const lockPiece = (piece) => {
    const newBoard = board.map(row => [...row]);
    piece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = piece.color;
        }
      });
    });

    // 清除完整行
    let clearedLines = 0;
    for (let y = TETRIS_ROWS - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(TETRIS_COLS).fill(0));
        clearedLines++;
        y++;
      }
    }

    if (clearedLines > 0) {
      const lineScores = [0, 100, 300, 500, 800];
      const newScore = score + lineScores[clearedLines] * level;
      setScore(newScore);
      setLines(l => l + clearedLines);
      setLevel(Math.floor((lines + clearedLines) / 10) + 1);
      onScoreUpdate?.(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('moyu-tetris-highscore', newScore.toString());
      }
    }

    setBoard(newBoard);

    // 生成新方块
    const newPiece = createPiece();
    if (!isValidMove(newPiece, newPiece.x, newPiece.y)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
    }
  };

  // 游戏循环
  useEffect(() => {
    if (!currentPiece) {
      setCurrentPiece(createPiece());
      return;
    }

    if (gameOver || isPaused) return;

    const speed = Math.max(100, 800 - (level - 1) * 80);
    const interval = setInterval(() => {
      setCurrentPiece(piece => {
        if (!piece) return piece;
        if (isValidMove(piece, piece.x, piece.y + 1)) {
          return { ...piece, y: piece.y + 1 };
        } else {
          lockPiece(piece);
          return piece;
        }
      });
    }, speed);

    return () => clearInterval(interval);
  }, [board, gameOver, isPaused, level, currentPiece, createPiece]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          resetGame();
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (isPaused || !currentPiece) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          if (isValidMove(currentPiece, currentPiece.x - 1, currentPiece.y)) {
            setCurrentPiece({ ...currentPiece, x: currentPiece.x - 1 });
          }
          break;
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          if (isValidMove(currentPiece, currentPiece.x + 1, currentPiece.y)) {
            setCurrentPiece({ ...currentPiece, x: currentPiece.x + 1 });
          }
          break;
        case 'ArrowDown':
        case 's':
          e.preventDefault();
          if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
            setCurrentPiece({ ...currentPiece, y: currentPiece.y + 1 });
            setScore(s => s + 1);
          }
          break;
        case 'ArrowUp':
        case 'w':
          e.preventDefault();
          const rotated = rotatePiece(currentPiece);
          if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotated.shape)) {
            setCurrentPiece(rotated);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPiece, gameOver, isPaused, board]);

  // 绘制游戏
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = TETRIS_COLS * TETRIS_CELL_SIZE;
    canvas.height = TETRIS_ROWS * TETRIS_CELL_SIZE;

    // 清空画布
    ctx.fillStyle = colors.inputBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= TETRIS_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TETRIS_CELL_SIZE, 0);
      ctx.lineTo(x * TETRIS_CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= TETRIS_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TETRIS_CELL_SIZE);
      ctx.lineTo(canvas.width, y * TETRIS_CELL_SIZE);
      ctx.stroke();
    }

    // 绘制已固定的方块
    board.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(
            x * TETRIS_CELL_SIZE + 1,
            y * TETRIS_CELL_SIZE + 1,
            TETRIS_CELL_SIZE - 2,
            TETRIS_CELL_SIZE - 2
          );
        }
      });
    });

    // 绘制当前方块
    if (currentPiece) {
      ctx.fillStyle = currentPiece.color;
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            ctx.fillRect(
              (currentPiece.x + x) * TETRIS_CELL_SIZE + 1,
              (currentPiece.y + y) * TETRIS_CELL_SIZE + 1,
              TETRIS_CELL_SIZE - 2,
              TETRIS_CELL_SIZE - 2
            );
          }
        });
      });
    }
  }, [board, currentPiece, colors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Score Board */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center',
        padding: '8px 16px', background: colors.cardBg,
        borderRadius: 8, border: `1px solid ${colors.border}`,
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>得分</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent }}>{score}</div>
        </div>
        <div style={{ width: 1, height: 30, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>行数</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{lines}</div>
        </div>
        <div style={{ width: 1, height: 30, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>等级</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{level}</div>
        </div>
        <div style={{ width: 1, height: 30, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>最高分</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#a855f7' }}>{highScore}</div>
        </div>
        <div style={{ width: 1, height: 30, background: colors.border }} />
        <button
          onClick={togglePause}
          disabled={gameOver}
          style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: isPaused ? '#22c55e' : colors.accent,
            color: '#fff', cursor: gameOver ? 'default' : 'pointer',
            fontSize: 13, opacity: gameOver ? 0.5 : 1,
          }}
        >
          {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
        </button>
      </div>

      {/* Game Canvas */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            border: `2px solid ${colors.border}`,
            borderRadius: 8,
            display: 'block',
          }}
        />

        {/* Game Over Overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💀</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              游戏结束
            </div>
            <div style={{ fontSize: 14, color: '#aaa', marginBottom: 16 }}>
              最终得分: {score} | 消除行数: {lines}
            </div>
            <button
              onClick={resetGame}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: colors.accent, color: '#fff',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              🔄 重新开始 (空格)
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && !gameOver && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⏸️</div>
            <div style={{ fontSize: 16, color: '#fff' }}>已暂停</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>按空格继续</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        color: colors.textSecondary, fontSize: 12,
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <span>⌨️ ←↓→ 移动</span>
        <span>•</span>
        <span>↑ / W 旋转</span>
        <span>•</span>
        <span>↓ / S 加速</span>
        <span>•</span>
        <span>␣ 暂停</span>
      </div>
    </div>
  );
}

// ==================== 2048 游戏 ====================
const GRID_2048_SIZE = 4;
const CELL_2048_SIZE = 80;

function Game2048({ colors, onScoreUpdate }) {
  const [board, setBoard] = useState(() => createBoard2048());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('moyu-2048-best') || '0');
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  function createBoard2048() {
    const board = Array(GRID_2048_SIZE).fill(null).map(() => Array(GRID_2048_SIZE).fill(0));
    addRandomTile(board);
    addRandomTile(board);
    return board;
  }

  function addRandomTile(board) {
    const empty = [];
    for (let r = 0; r < GRID_2048_SIZE; r++) {
      for (let c = 0; c < GRID_2048_SIZE; c++) {
        if (board[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length > 0) {
      const { r, c } = empty[Math.floor(Math.random() * empty.length)];
      board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  function slideRow(row) {
    const filtered = row.filter(val => val !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        filtered[i + 1] = 0;
        setScore(s => {
          const newScore = s + filtered[i];
          onScoreUpdate?.(newScore);
          return newScore;
        });
      }
    }
    const result = filtered.filter(val => val !== 0);
    while (result.length < GRID_2048_SIZE) result.push(0);
    return result;
  }

  function moveLeft(currentBoard) {
    const newBoard = currentBoard.map(row => slideRow(row));
    return { board: newBoard, changed: JSON.stringify(newBoard) !== JSON.stringify(currentBoard) };
  }

  function rotateRight(matrix) {
    const N = matrix.length;
    return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
  }

  function move(currentBoard, direction) {
    let board = currentBoard.map(row => [...row]);
    let rotations = { left: 0, up: 3, right: 2, down: 1 }[direction];

    for (let i = 0; i < rotations; i++) board = rotateRight(board);
    const { board: newBoard, changed } = moveLeft(board);
    board = newBoard;
    for (let i = 0; i < (4 - rotations) % 4; i++) board = rotateRight(board);

    if (changed) {
      addRandomTile(board);
    }

    return { board, changed };
  }

  function canMove(board) {
    for (let r = 0; r < GRID_2048_SIZE; r++) {
      for (let c = 0; c < GRID_2048_SIZE; c++) {
        if (board[r][c] === 0) return true;
        if (c < GRID_2048_SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
        if (r < GRID_2048_SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
      }
    }
    return false;
  }

  function hasWon(board) {
    return board.some(row => row.some(cell => cell === 2048));
  }

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('moyu-2048-best', score.toString());
    }
  }, [score, bestScore]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        resetGame();
        return;
      }
      if (gameOver) return;

      const keyMap = {
        ArrowLeft: 'left', ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down',
        a: 'left', w: 'up', d: 'right', s: 'down',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        const { board: newBoard, changed } = move(board, keyMap[e.key]);
        if (changed) {
          setBoard(newBoard);
          if (!canMove(newBoard)) setGameOver(true);
          if (hasWon(newBoard) && !won) setWon(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gameOver, won]);

  const resetGame = () => {
    setBoard(createBoard2048());
    setScore(0);
    setGameOver(false);
    setWon(false);
    onScoreUpdate?.(0);
  };

  const getCellColor = (value) => {
    const colors = {
      0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179',
      16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72',
      256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
    };
    return colors[value] || '#3c3a32';
  };

  const getTextColor = (value) => value <= 4 ? '#776e65' : '#f9f6f2';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        padding: '10px 20px', background: colors.cardBg,
        borderRadius: 8, border: `1px solid ${colors.border}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>得分</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.accent }}>{score}</div>
        </div>
        <div style={{ width: 1, height: 35, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>最高分</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{bestScore}</div>
        </div>
        <button onClick={resetGame} style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: colors.accent, color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>
          新游戏
        </button>
      </div>

      <div style={{
        position: 'relative',
        padding: 10, background: '#bbada0', borderRadius: 8,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${GRID_2048_SIZE}, ${CELL_2048_SIZE}px)`,
          gap: 10,
        }}>
          {board.map((row, r) => row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                width: CELL_2048_SIZE, height: CELL_2048_SIZE,
                borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: getCellColor(cell),
                color: getTextColor(cell),
                fontSize: cell > 100 ? 24 : 32, fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
            >
              {cell !== 0 && cell}
            </div>
          )))}
        </div>

        {(gameOver || won) && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{won ? '🎉' : '💀'}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#776e65', marginBottom: 8 }}>
              {won ? '你赢了!' : '游戏结束'}
            </div>
            <div style={{ fontSize: 14, color: '#776e65', marginBottom: 16 }}>
              最终得分: {score}
            </div>
            <button onClick={resetGame} style={{
              padding: '10px 24px', borderRadius: 6, border: 'none',
              background: '#8f7a66', color: '#f9f6f2', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
              再玩一次
            </button>
          </div>
        )}
      </div>

      <div style={{ color: colors.textSecondary, fontSize: 12 }}>
        ⌨️ 方向键或 WASD 移动 • 合并数字到 2048
      </div>
    </div>
  );
}

// ==================== 扫雷游戏 ====================
const MINESWEEPER_ROWS = 9;
const MINESWEEPER_COLS = 9;
const MINESWEEPER_MINES = 10;
const CELL_MINE_SIZE = 28;

function MinesweeperGame({ colors }) {
  const [board, setBoard] = useState(() => createBoardMines());
  const [revealed, setRevealed] = useState(() => Array(MINESWEEPER_ROWS).fill(null).map(() => Array(MINESWEEPER_COLS).fill(false)));
  const [flagged, setFlagged] = useState(() => Array(MINESWEEPER_ROWS).fill(null).map(() => Array(MINESWEEPER_COLS).fill(false)));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(MINESWEEPER_MINES);
  const [bestTime, setBestTime] = useState(() => parseInt(localStorage.getItem('moyu-minesweeper-best') || '0'));
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (startTime && !gameOver && !won) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, gameOver, won]);

  function createBoardMines() {
    const board = Array(MINESWEEPER_ROWS).fill(null).map(() => Array(MINESWEEPER_COLS).fill(0));

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINESWEEPER_MINES) {
      const r = Math.floor(Math.random() * MINESWEEPER_ROWS);
      const c = Math.floor(Math.random() * MINESWEEPER_COLS);
      if (board[r][c] !== -1) {
        board[r][c] = -1;
        minesPlaced++;

        // Update neighbors
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < MINESWEEPER_ROWS && nc >= 0 && nc < MINESWEEPER_COLS && board[nr][nc] !== -1) {
              board[nr][nc]++;
            }
          }
        }
      }
    }
    return board;
  }

  function revealCell(r, c) {
    if (gameOver || won || revealed[r][c] || flagged[r][c]) return;

    if (!startTime) setStartTime(Date.now());

    const newRevealed = revealed.map(row => [...row]);
    const queue = [[r, c]];

    while (queue.length > 0) {
      const [cr, cc] = queue.shift();
      if (cr < 0 || cr >= MINESWEEPER_ROWS || cc < 0 || cc >= MINESWEEPER_COLS) continue;
      if (newRevealed[cr][cc]) continue;

      newRevealed[cr][cc] = true;

      if (board[cr][cc] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            queue.push([cr + dr, cc + dc]);
          }
        }
      }
    }

    setRevealed(newRevealed);

    if (board[r][c] === -1) {
      setGameOver(true);
    } else {
      const revealedCount = newRevealed.flat().filter(Boolean).length;
      if (revealedCount === MINESWEEPER_ROWS * MINESWEEPER_COLS - MINESWEEPER_MINES) {
        setWon(true);
        if (!bestTime || elapsedTime < bestTime) {
          setBestTime(elapsedTime);
          localStorage.setItem('moyu-minesweeper-best', elapsedTime.toString());
        }
      }
    }
  }

  function toggleFlag(r, c) {
    if (gameOver || won || revealed[r][c]) return;

    const newFlagged = flagged.map(row => [...row]);
    if (newFlagged[r][c]) {
      newFlagged[r][c] = false;
      setFlagsLeft(f => f + 1);
    } else if (flagsLeft > 0) {
      newFlagged[r][c] = true;
      setFlagsLeft(f => f - 1);
    }
    setFlagged(newFlagged);
  }

  const resetGame = () => {
    setBoard(createBoardMines());
    setRevealed(Array(MINESWEEPER_ROWS).fill(null).map(() => Array(MINESWEEPER_COLS).fill(false)));
    setFlagged(Array(MINESWEEPER_ROWS).fill(null).map(() => Array(MINESWEEPER_COLS).fill(false)));
    setGameOver(false);
    setWon(false);
    setFlagsLeft(MINESWEEPER_MINES);
    setStartTime(null);
    setElapsedTime(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center',
        padding: '10px 20px', background: colors.cardBg,
        borderRadius: 8, border: `1px solid ${colors.border}`,
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>💣 剩余</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.accent }}>{flagsLeft}</div>
        </div>
        <div style={{ width: 1, height: 35, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>⏱️ 时间</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{elapsedTime}</div>
        </div>
        <div style={{ width: 1, height: 35, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>最佳</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{bestTime || '-'}</div>
        </div>
        <button onClick={resetGame} style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: colors.accent, color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>
          🔄 新游戏
        </button>
      </div>

      <div style={{
        padding: 8, background: colors.inputBg, borderRadius: 8,
        border: `2px solid ${gameOver ? '#ef4444' : won ? '#22c55e' : colors.border}`,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${MINESWEEPER_COLS}, ${CELL_MINE_SIZE}px)`,
          gap: 2,
        }}>
          {board.map((row, r) => row.map((cell, c) => {
            const isRevealed = revealed[r][c];
            const isFlagged = flagged[r][c];
            const isMine = cell === -1;

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => { e.preventDefault(); toggleFlag(r, c); }}
                style={{
                  width: CELL_MINE_SIZE, height: CELL_MINE_SIZE,
                  borderRadius: 2, border: 'none',
                  background: isRevealed
                    ? (isMine ? '#ef4444' : colors.cardBg)
                    : (isFlagged ? '#f59e0b' : colors.hover),
                  color: isRevealed && !isMine ? getNumberColor(cell) : colors.text,
                  fontSize: 14, fontWeight: 700,
                  cursor: isRevealed ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isRevealed ? (isMine ? '💣' : (cell || '')) : (isFlagged ? '🚩' : '')}
              </button>
            );
          }))}
        </div>
      </div>

      {(gameOver || won) && (
        <div style={{
          padding: '12px 24px', borderRadius: 8,
          background: won ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${won ? '#22c55e' : '#ef4444'}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>{won ? '🎉' : '💥'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: won ? '#22c55e' : '#ef4444' }}>
            {won ? `恭喜! 用时 ${elapsedTime} 秒` : '游戏结束'}
          </div>
        </div>
      )}

      <div style={{ color: colors.textSecondary, fontSize: 12 }}>
        🖱️ 左键揭开 • 右键标记 • 找出所有 💣
      </div>
    </div>
  );
}

function getNumberColor(n) {
  const colors = {
    1: '#3b82f6', 2: '#22c55e', 3: '#ef4444', 4: '#a855f7',
    5: '#f97316', 6: '#06b6d4', 7: '#000', 8: '#71717a',
  };
  return colors[n] || colors.text;
}

// ==================== 数独游戏 ====================
const SUDOKU_SIZE = 9;
const SUDOKU_CELL_SIZE = 40;

function SudokuGame({ colors }) {
  const [board, setBoard] = useState(() => generateSudoku());
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');

  useEffect(() => {
    newGame();
  }, [difficulty]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  function generateSudoku() {
    // 简化的数独生成
    const base = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ];

    // 随机打乱
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(Math.random() * 9);
      const b = Math.floor(Math.random() * 9);
      for (let r = 0; r < 9; r++) {
        [base[r][a], base[r][b]] = [base[r][b], base[r][a]];
      }
    }

    setSolution(base.map(row => [...row]));

    // 根据难度移除数字
    const cellsToRemove = { easy: 35, medium: 45, hard: 55 }[difficulty] || 45;
    const puzzle = base.map(row => [...row]);
    let removed = 0;
    while (removed < cellsToRemove) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== 0) {
        puzzle[r][c] = 0;
        removed++;
      }
    }

    return puzzle.map(row => row.map(val => val === 0 ? null : { value: val, fixed: true }));
  }

  function newGame() {
    setBoard(generateSudoku());
    setSelectedCell(null);
    setGameOver(false);
    setMistakes(0);
    setTime(0);
    setIsRunning(true);
  }

  function handleCellClick(r, c) {
    if (board[r][c]?.fixed || gameOver) return;
    setSelectedCell([r, c]);
  }

  function handleNumberInput(num) {
    if (!selectedCell || gameOver) return;
    const [r, c] = selectedCell;
    if (board[r][c]?.fixed) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = { value: num, fixed: false };
    setBoard(newBoard);

    // 检查是否正确
    if (solution[r][c] !== num) {
      setMistakes(m => {
        const newMistakes = m + 1;
        if (newMistakes >= 3) setGameOver(true);
        return newMistakes;
      });
    }

    // 检查是否完成
    const isComplete = newBoard.every((row, ri) =>
      row.every((cell, ci) => cell?.value === solution[ri][ci])
    );
    if (isComplete) {
      setGameOver(true);
      setIsRunning(false);
    }
  }

  function handleKeyDown(e) {
    if (gameOver) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        newGame();
      }
      return;
    }

    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      e.preventDefault();
      handleNumberInput(num);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (selectedCell) {
        const [r, c] = selectedCell;
        if (!board[r][c]?.fixed) {
          const newBoard = board.map(row => [...row]);
          newBoard[r][c] = null;
          setBoard(newBoard);
        }
      }
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, board, gameOver]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Stats */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center',
        padding: '10px 20px', background: colors.cardBg,
        borderRadius: 8, border: `1px solid ${colors.border}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>时间</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{formatTime(time)}</div>
        </div>
        <div style={{ width: 1, height: 35, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>错误</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: mistakes >= 2 ? '#ef4444' : colors.accent }}>
            {mistakes}/3
          </div>
        </div>
        <div style={{ width: 1, height: 35, background: colors.border }} />
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 6,
            border: `1px solid ${colors.border}`, background: colors.inputBg,
            color: colors.text, cursor: 'pointer', fontSize: 13,
          }}
        >
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>
        <button onClick={newGame} style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: colors.accent, color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>
          新游戏
        </button>
      </div>

      {/* Board */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(9, ${SUDOKU_CELL_SIZE}px)`,
        gap: 0, border: `3px solid ${colors.text}`, borderRadius: 4,
      }}>
        {board.map((row, r) => row.map((cell, c) => {
          const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
          const isSameRow = selectedCell?.[0] === r;
          const isSameCol = selectedCell?.[1] === c;
          const isHighlighted = isSameRow || isSameCol;
          const boxRow = Math.floor(r / 3);
          const boxCol = Math.floor(c / 3);
          const isDarkBox = (boxRow + boxCol) % 2 === 1;

          return (
            <div
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              style={{
                width: SUDOKU_CELL_SIZE, height: SUDOKU_CELL_SIZE,
                borderRight: (c + 1) % 3 === 0 && c !== 8 ? `2px solid ${colors.text}` : `1px solid ${colors.border}`,
                borderBottom: (r + 1) % 3 === 0 && r !== 8 ? `2px solid ${colors.text}` : `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: cell?.fixed ? 700 : 400,
                color: isSelected ? '#fff' : (cell?.fixed ? colors.text : (cell?.value && solution[r][c] !== cell.value ? '#ef4444' : colors.accent)),
                background: isSelected ? colors.accent : (isHighlighted ? `${colors.accent}22` : (isDarkBox ? colors.inputBg : colors.cardBg)),
                cursor: cell?.fixed ? 'default' : 'pointer',
                transition: 'all 0.1s',
              }}
            >
              {cell?.value || ''}
            </div>
          );
        }))}
      </div>

      {/* Number Pad */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            disabled={gameOver}
            style={{
              width: 40, height: 40, borderRadius: 6,
              border: `1px solid ${colors.border}`, background: colors.inputBg,
              color: colors.text, fontSize: 18, cursor: gameOver ? 'default' : 'pointer',
              opacity: gameOver ? 0.5 : 1,
            }}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => {
            if (selectedCell) {
              const [r, c] = selectedCell;
              if (!board[r][c]?.fixed) {
                const newBoard = board.map(row => [...row]);
                newBoard[r][c] = null;
                setBoard(newBoard);
              }
            }
          }}
          disabled={gameOver}
          style={{
            width: 40, height: 40, borderRadius: 6,
            border: `1px solid ${colors.border}`, background: colors.inputBg,
            color: colors.textSecondary, fontSize: 14, cursor: gameOver ? 'default' : 'pointer',
            opacity: gameOver ? 0.5 : 1,
          }}
        >
          ⌫
        </button>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div style={{
          padding: 16, borderRadius: 8, textAlign: 'center',
          background: mistakes >= 3 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${mistakes >= 3 ? '#ef4444' : '#22c55e'}`,
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>
            {mistakes >= 3 ? '💀' : '🎉'}
          </div>
          <div style={{ fontWeight: 600, color: mistakes >= 3 ? '#ef4444' : '#22c55e' }}>
            {mistakes >= 3 ? '游戏结束' : '恭喜完成!'}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
            用时: {formatTime(time)}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 打字练习游戏 ====================
const TYPING_SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Practice makes perfect, and perfection takes time.',
  'Coding is both an art and a science.',
  'Every expert was once a beginner.',
  'Stay hungry, stay foolish.',
  'The only way to do great work is to love what you do.',
  'Innovation distinguishes between a leader and a follower.',
  'Life is what happens when you are busy making other plans.',
  'Success is not final, failure is not fatal.',
  'It always seems impossible until it is done.',
  'Believe you can and you are halfway there.',
  'The future belongs to those who believe in the beauty of their dreams.',
  'Do not watch the clock; do what it does. Keep going.',
  'Keep your face always toward the sunshine and shadows will fall behind you.',
  'The best way to predict the future is to create it.',
];

function TypingGame({ colors }) {
  const [sentence, setSentence] = useState('');
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [highWpm, setHighWpm] = useState(() => parseInt(localStorage.getItem('moyu-typing-high') || '0'));

  useEffect(() => {
    newGame();
  }, []);

  function newGame() {
    const random = TYPING_SENTENCES[Math.floor(Math.random() * TYPING_SENTENCES.length)];
    setSentence(random);
    setInput('');
    setStarted(false);
    setFinished(false);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
  }

  function handleInput(e) {
    const value = e.target.value;
    if (!started) {
      setStarted(true);
      setStartTime(Date.now());
    }

    setInput(value);

    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === sentence[i]) correct++;
    }
    const acc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
    setAccuracy(acc);

    // Check if finished
    if (value === sentence) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const words = sentence.split(' ').length;
      const calculatedWpm = Math.round(words / timeElapsed);
      setWpm(calculatedWpm);
      setFinished(true);
      if (calculatedWpm > highWpm) {
        setHighWpm(calculatedWpm);
        localStorage.setItem('moyu-typing-high', calculatedWpm.toString());
      }
    }
  }

  const renderSentence = () => {
    return sentence.split('').map((char, i) => {
      let color = colors.textSecondary;
      let bg = 'transparent';

      if (i < input.length) {
        if (input[i] === char) {
          color = '#22c55e';
          bg = 'rgba(34,197,94,0.1)';
        } else {
          color = '#ef4444';
          bg = 'rgba(239,68,68,0.1)';
        }
      } else if (i === input.length) {
        bg = `${colors.accent}44`;
      }

      return (
        <span
          key={i}
          style={{
            color, background: bg, padding: '0 1px', borderRadius: 2,
            textDecoration: input[i] && input[i] !== char ? 'underline' : 'none',
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 600 }}>
      {/* Stats */}
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        padding: '12px 24px', background: colors.cardBg,
        borderRadius: 8, border: `1px solid ${colors.border}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>WPM</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{started ? wpm || '-' : '-'}</div>
        </div>
        <div style={{ width: 1, height: 40, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>准确率</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: accuracy >= 90 ? '#22c55e' : '#f59e0b' }}>
            {accuracy}%
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>最佳</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#a855f7' }}>{highWpm || '-'}</div>
        </div>
        <button onClick={newGame} style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: colors.accent, color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>
          新游戏
        </button>
      </div>

      {/* Sentence Display */}
      <div style={{
        padding: 24, background: colors.inputBg, borderRadius: 12,
        border: `1px solid ${colors.border}`, fontSize: 20,
        fontFamily: 'monospace', lineHeight: 1.8, letterSpacing: 1,
        minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', gap: '0 4px',
      }}>
        {renderSentence()}
      </div>

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={handleInput}
        disabled={finished}
        placeholder={started ? '' : '在此处输入...'}
        style={{
          width: '100%', padding: 16, fontSize: 18,
          border: `2px solid ${finished ? '#22c55e' : colors.border}`,
          borderRadius: 8, background: colors.inputBg, color: colors.text,
          fontFamily: 'monospace', textAlign: 'center',
          outline: 'none',
        }}
        autoFocus
      />

      {/* Progress */}
      <div style={{
        width: '100%', height: 6, background: colors.inputBg,
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${(input.length / sentence.length) * 100}%`,
          height: '100%', background: colors.accent,
          transition: 'width 0.1s',
        }} />
      </div>

      {/* Finished */}
      {finished && (
        <div style={{
          padding: 20, borderRadius: 12, textAlign: 'center',
          background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e',
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#22c55e' }}>
            太棒了! WPM: {wpm}
          </div>
          <button onClick={newGame} style={{
            marginTop: 12, padding: '10px 24px', borderRadius: 6,
            border: 'none', background: '#22c55e', color: '#fff',
            cursor: 'pointer', fontSize: 14,
          }}>
            再玩一次
          </button>
        </div>
      )}

      <div style={{ color: colors.textSecondary, fontSize: 12 }}>
        ⌨️ 尽可能快速准确地输入上面的文字
      </div>
    </div>
  );
}

// ==================== Flappy Bird 游戏 ====================
const FB_WIDTH = 320;
const FB_HEIGHT = 480;
const GRAVITY = 0.25;
const JUMP = -4.5;
const PIPE_SPEED = 2;
const PIPE_GAP = 110;
const PIPE_SPAWN = 120;

function FlappyBirdGame({ colors }) {
  const canvasRef = useRef(null);
  const [bird, setBird] = useState({ y: FB_HEIGHT / 2, velocity: 0 });
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('moyu-flappy-high') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const frameRef = useRef();

  const resetGame = () => {
    setBird({ y: FB_HEIGHT / 2, velocity: 0 });
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setStarted(false);
  };

  const jump = () => {
    if (gameOver) {
      resetGame();
      return;
    }
    if (!started) setStarted(true);
    setBird(b => ({ ...b, velocity: JUMP }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, started]);

  useEffect(() => {
    if (!started || gameOver) return;

    const gameLoop = () => {
      setBird(b => {
        const newY = b.y + b.velocity;
        const newVelocity = b.velocity + GRAVITY;

        if (newY < 0 || newY > FB_HEIGHT - 30) {
          setGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('moyu-flappy-high', score.toString());
          }
          return b;
        }

        return { y: newY, velocity: newVelocity };
      });

      setPipes(p => {
        let newPipes = p.map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED })).filter(pipe => pipe.x > -50);

        // Spawn new pipe
        if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < FB_WIDTH - PIPE_SPAWN) {
          const topHeight = Math.random() * (FB_HEIGHT - PIPE_GAP - 100) + 50;
          newPipes.push({ x: FB_WIDTH, topHeight, passed: false });
        }

        // Check collision and score
        newPipes.forEach(pipe => {
          if (!pipe.passed && pipe.x < 50) {
            pipe.passed = true;
            setScore(s => s + 1);
          }

          // Collision detection
          if (50 < pipe.x + 40 && 50 + 30 > pipe.x) {
            if (bird.y < pipe.topHeight || bird.y + 30 > pipe.topHeight + PIPE_GAP) {
              setGameOver(true);
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('moyu-flappy-high', score.toString());
              }
            }
          }
        });

        return newPipes;
      });

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [started, gameOver, bird.y, score, highScore]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear
    ctx.fillStyle = colors.inputBg;
    ctx.fillRect(0, 0, FB_WIDTH, FB_HEIGHT);

    // Draw pipes
    ctx.fillStyle = '#22c55e';
    pipes.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, 40, pipe.topHeight);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, 44, 20);
      ctx.fillStyle = '#22c55e';
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, 40, FB_HEIGHT - pipe.topHeight - PIPE_GAP);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(pipe.x - 2, pipe.topHeight + PIPE_GAP, 44, 20);
      ctx.fillStyle = '#22c55e';
    });

    // Draw bird
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(65, bird.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(70, bird.y + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(72, bird.y + 10, 2, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(75, bird.y + 15);
    ctx.lineTo(85, bird.y + 12);
    ctx.lineTo(85, bird.y + 18);
    ctx.fill();

    // Draw score
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), FB_WIDTH / 2, 50);
  }, [bird, pipes, score, colors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Stats */}
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        padding: '10px 20px', background: colors.cardBg,
        borderRadius: 8, border: `1px solid ${colors.border}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>得分</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{score}</div>
        </div>
        <div style={{ width: 1, height: 35, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>最高分</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{highScore}</div>
        </div>
        <button onClick={resetGame} style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: colors.accent, color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>
          新游戏
        </button>
      </div>

      {/* Game Canvas */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `2px solid ${colors.border}` }}>
        <canvas
          ref={canvasRef}
          width={FB_WIDTH}
          height={FB_HEIGHT}
          style={{ display: 'block' }}
          onClick={jump}
        />

        {!started && !gameOver && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🐦</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>点击或按空格开始</div>
          </div>
        )}

        {gameOver && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💀</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>游戏结束</div>
            <div style={{ color: '#aaa', fontSize: 14, marginTop: 8 }}>得分: {score}</div>
            <button onClick={resetGame} style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 6,
              border: 'none', background: '#22c55e', color: '#fff',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
              再玩一次
            </button>
          </div>
        )}
      </div>

      <div style={{ color: colors.textSecondary, fontSize: 12 }}>
        🖱️ 点击或按空格键飞行
      </div>
    </div>
  );
}

// ==================== 打砖块游戏 ====================
const BB_WIDTH = 400;
const BB_HEIGHT = 500;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 42;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;

function BreakoutGame({ colors }) {
  const canvasRef = useRef(null);
  const [paddle, setPaddle] = useState({ x: BB_WIDTH / 2 - PADDLE_WIDTH / 2 });
  const [ball, setBall] = useState({ x: BB_WIDTH / 2, y: BB_HEIGHT - 50, dx: 3, dy: -3 });
  const [bricks, setBricks] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('moyu-breakout-high') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const frameRef = useRef();

  const brickColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  const initBricks = () => {
    const newBricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        newBricks.push({
          x: 20 + c * (BRICK_WIDTH + BRICK_GAP),
          y: 60 + r * (BRICK_HEIGHT + BRICK_GAP),
          row: r,
          visible: true,
        });
      }
    }
    return newBricks;
  };

  const resetGame = () => {
    setPaddle({ x: BB_WIDTH / 2 - PADDLE_WIDTH / 2 });
    setBall({ x: BB_WIDTH / 2, y: BB_HEIGHT - 50, dx: 3, dy: -3 });
    setBricks(initBricks());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setStarted(false);
  };

  useEffect(() => {
    setBricks(initBricks());
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setPaddle({ x: Math.max(0, Math.min(BB_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2)) });
    };

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameOver || won) {
          resetGame();
        } else if (!started) {
          setStarted(true);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, won, started]);

  useEffect(() => {
    if (!started || gameOver || won) return;

    const gameLoop = () => {
      setBall(b => {
        let newX = b.x + b.dx;
        let newY = b.y + b.dy;
        let newDx = b.dx;
        let newDy = b.dy;

        // Wall collision
        if (newX <= BALL_RADIUS || newX >= BB_WIDTH - BALL_RADIUS) newDx = -newDx;
        if (newY <= BALL_RADIUS) newDy = -newDy;

        // Paddle collision
        if (
          newY + BALL_RADIUS >= BB_HEIGHT - PADDLE_HEIGHT - 10 &&
          newY - BALL_RADIUS <= BB_HEIGHT - 10 &&
          newX >= paddle.x &&
          newX <= paddle.x + PADDLE_WIDTH
        ) {
          newDy = -Math.abs(newDy);
          // Add some angle based on where it hit the paddle
          const hitPos = (newX - paddle.x) / PADDLE_WIDTH;
          newDx = (hitPos - 0.5) * 6;
        }

        // Game over
        if (newY > BB_HEIGHT) {
          setGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('moyu-breakout-high', score.toString());
          }
          return b;
        }

        return { x: newX, y: newY, dx: newDx, dy: newDy };
      });

      // Brick collision
      setBricks(bs => {
        const newBricks = [...bs];
        let hit = false;

        newBricks.forEach(brick => {
          if (!brick.visible) return;
          if (
            ball.x + BALL_RADIUS >= brick.x &&
            ball.x - BALL_RADIUS <= brick.x + BRICK_WIDTH &&
            ball.y + BALL_RADIUS >= brick.y &&
            ball.y - BALL_RADIUS <= brick.y + BRICK_HEIGHT
          ) {
            if (!hit) {
              setBall(b => ({ ...b, dy: -b.dy }));
              hit = true;
            }
            brick.visible = false;
            setScore(s => s + (BRICK_ROWS - brick.row) * 10);
          }
        });

        if (newBricks.every(b => !b.visible)) {
          setWon(true);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('moyu-breakout-high', score.toString());
          }
        }

        return newBricks;
      });

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [started, gameOver, won, paddle.x, ball, score, highScore]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear
    ctx.fillStyle = colors.inputBg;
    ctx.fillRect(0, 0, BB_WIDTH, BB_HEIGHT);

    // Draw bricks
    bricks.forEach(brick => {
      if (!brick.visible) return;
      ctx.fillStyle = brickColors[brick.row];
      ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, 4);
    });

    // Draw paddle
    ctx.fillStyle = colors.accent;
    ctx.fillRect(paddle.x, BB_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(paddle.x, BB_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, 4);

    // Draw ball
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }, [ball, paddle, bricks, colors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Stats */}
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        padding: '10px 20px', background: colors.cardBg,
        borderRadius: 8, border: `1px solid ${colors.border}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>得分</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{score}</div>
        </div>
        <div style={{ width: 1, height: 35, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>最高分</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{highScore}</div>
        </div>
        <button onClick={resetGame} style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: colors.accent, color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>
          新游戏
        </button>
      </div>

      {/* Game Canvas */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `2px solid ${colors.border}` }}>
        <canvas
          ref={canvasRef}
          width={BB_WIDTH}
          height={BB_HEIGHT}
          style={{ display: 'block' }}
        />

        {!started && !gameOver && !won && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🧱</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>移动鼠标控制挡板</div>
            <div style={{ color: '#aaa', fontSize: 14, marginTop: 8 }}>按空格开始</div>
          </div>
        )}

        {gameOver && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💀</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>游戏结束</div>
            <div style={{ color: '#aaa', fontSize: 14, marginTop: 8 }}>得分: {score}</div>
            <button onClick={resetGame} style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 6,
              border: 'none', background: '#ef4444', color: '#fff',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
              再玩一次
            </button>
          </div>
        )}

        {won && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>恭喜通关!</div>
            <div style={{ color: '#aaa', fontSize: 14, marginTop: 8 }}>最终得分: {score}</div>
            <button onClick={resetGame} style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 6,
              border: 'none', background: '#22c55e', color: '#fff',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
              再玩一次
            </button>
          </div>
        )}
      </div>

      <div style={{ color: colors.textSecondary, fontSize: 12 }}>
        🖱️ 移动鼠标控制挡板 • 空格键开始/重开
      </div>
    </div>
  );
}

// SVG Icons for games
const GameIcons = {
  snake: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 2.5-1 2.5-2.5 0-.5-.2-1-.4-1.4-.3-.4-.4-.8-.4-1.2 0-1.1.9-2 2-2h2.3c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8z"/>
    </svg>
  ),
  tetris: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="6" height="6" rx="1"/>
      <rect x="9" y="3" width="6" height="6" rx="1"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
      <rect x="15" y="9" width="6" height="6" rx="1"/>
    </svg>
  ),
  '2048': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M8 12h8M12 8v8"/>
    </svg>
  ),
  minesweeper: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  sudoku: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
    </svg>
  ),
  typing: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <line x1="6" y1="8" x2="6" y2="8"/>
      <line x1="10" y1="8" x2="10" y2="8"/>
      <line x1="14" y1="8" x2="14" y2="8"/>
      <line x1="18" y1="8" x2="18" y2="8"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  flappy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7h.01M3.4 18H12a8 8 0 008-8V7a4 4 0 00-7.28-2.3L2 20"/>
    </svg>
  ),
  breakout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="4" rx="1"/>
      <rect x="2" y="10" width="5" height="3" rx="0.5"/>
      <rect x="9.5" y="10" width="5" height="3" rx="0.5"/>
      <rect x="17" y="10" width="5" height="3" rx="0.5"/>
      <line x1="12" y1="14" x2="12" y2="18"/>
      <rect x="8" y="19" width="8" height="2" rx="1"/>
    </svg>
  ),
  gamepad: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12"/>
      <line x1="8" y1="10" x2="8" y2="14"/>
      <line x1="15" y1="13" x2="15.01" y2="13"/>
      <line x1="18" y1="11" x2="18.01" y2="11"/>
      <rect x="2" y="6" width="20" height="12" rx="2"/>
    </svg>
  ),
};

// ==================== 游戏中心主组件 ====================
export default function GameCenter() {
  const { colors } = useTheme();
  const [activeGame, setActiveGame] = useState('snake');
  const [snakeScore, setSnakeScore] = useState(0);
  const [tetrisScore, setTetrisScore] = useState(0);
  const [game2048Score, setGame2048Score] = useState(0);
  const [hoveredGame, setHoveredGame] = useState(null);

  const games = [
    { key: 'snake', label: '贪吃蛇', icon: GameIcons.snake },
    { key: 'tetris', label: '俄罗斯方块', icon: GameIcons.tetris },
    { key: '2048', label: '2048', icon: GameIcons['2048'] },
    { key: 'minesweeper', label: '扫雷', icon: GameIcons.minesweeper },
    { key: 'sudoku', label: '数独', icon: GameIcons.sudoku },
    { key: 'typing', label: '打字练习', icon: GameIcons.typing },
    { key: 'flappy', label: 'Flappy Bird', icon: GameIcons.flappy },
    { key: 'breakout', label: '打砖块', icon: GameIcons.breakout },
  ];

  return (
    <div style={{
      padding: 16, height: '100%', display: 'flex',
      flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        background: colors.cardBg, borderRadius: 16,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(34, 197, 94, 0.1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', flex: 1,
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
          background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.05) 0%, transparent 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              color: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.15)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </span>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '0.5px',
            }}>
              摸鱼游戏中心
            </span>
          </div>

          {/* Game Selector */}
          <div style={{
            display: 'flex', gap: 4,
            background: colors.inputBg, padding: 4, borderRadius: 10,
            flexWrap: 'wrap',
            border: `1px solid ${colors.border}`,
          }}>
            {games.map(game => (
              <button
                key={game.key}
                onClick={() => setActiveGame(game.key)}
                onMouseEnter={() => setHoveredGame(game.key)}
                onMouseLeave={() => setHoveredGame(null)}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: activeGame === game.key
                    ? '#22C55E'
                    : hoveredGame === game.key
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'transparent',
                  color: activeGame === game.key ? '#fff' : colors.textSecondary,
                  cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: activeGame === game.key
                    ? '0 2px 8px rgba(34, 197, 94, 0.4)'
                    : 'none',
                  transform: hoveredGame === game.key && activeGame !== game.key
                    ? 'translateY(-1px)'
                    : 'none',
                }}
              >
                <span style={{
                  display: 'flex',
                  color: activeGame === game.key ? '#fff' : colors.textSecondary,
                  transition: 'color 0.2s',
                }}>
                  {game.icon}
                </span>
                {game.label}
              </button>
            ))}
          </div>
        </div>

        {/* Game Area */}
        <div style={{
          flex: 1, overflow: 'auto', padding: 24,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          position: 'relative',
        }}>
          {activeGame === 'snake' ? (
            <SnakeGame colors={colors} onScoreUpdate={setSnakeScore} />
          ) : activeGame === 'tetris' ? (
            <TetrisGame colors={colors} onScoreUpdate={setTetrisScore} />
          ) : activeGame === '2048' ? (
            <Game2048 colors={colors} onScoreUpdate={setGame2048Score} />
          ) : activeGame === 'minesweeper' ? (
            <MinesweeperGame colors={colors} />
          ) : activeGame === 'sudoku' ? (
            <SudokuGame colors={colors} />
          ) : activeGame === 'typing' ? (
            <TypingGame colors={colors} />
          ) : activeGame === 'flappy' ? (
            <FlappyBirdGame colors={colors} />
          ) : (
            <BreakoutGame colors={colors} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px', borderTop: `1px solid ${colors.border}`,
          fontSize: 12, color: colors.textMuted, textAlign: 'center',
          background: 'rgba(34, 197, 94, 0.03)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            提示：玩游戏时按 ` 键可快速切换到伪装模式
          </span>
        </div>
      </div>
    </div>
  );
}
