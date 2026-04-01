import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../ThemeContext.jsx';

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
        padding: '8px 16px', background: colors.cardBg,
        borderRadius: 8, border: `1px solid ${colors.border}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>得分</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{score}</div>
        </div>
        <div style={{ width: 1, height: 30, background: colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>最高分</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{highScore}</div>
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
              最终得分: {score}
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
        display: 'flex', gap: 8, alignItems: 'center',
        color: colors.textSecondary, fontSize: 12,
      }}>
        <span>⌨️ WASD / 方向键 移动</span>
        <span>•</span>
        <span>␣ 暂停</span>
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

// ==================== 游戏中心主组件 ====================
export default function GameCenter() {
  const { colors } = useTheme();
  const [activeGame, setActiveGame] = useState('snake'); // 'snake' | 'tetris'
  const [snakeScore, setSnakeScore] = useState(0);
  const [tetrisScore, setTetrisScore] = useState(0);

  return (
    <div style={{
      padding: 16, height: '100%', display: 'flex',
      flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        background: colors.cardBg, borderRadius: 14,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 2px 12px ${colors.shadow}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', flex: 1,
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>
              🎮 摸鱼游戏中心
            </span>
          </div>

          {/* Game Selector */}
          <div style={{
            display: 'flex', gap: 4,
            background: colors.inputBg, padding: 4, borderRadius: 8,
          }}>
            {[
              { key: 'snake', label: '贪吃蛇', icon: '🐍' },
              { key: 'tetris', label: '俄罗斯方块', icon: '🧱' },
            ].map(game => (
              <button
                key={game.key}
                onClick={() => setActiveGame(game.key)}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none',
                  background: activeGame === game.key ? colors.accent : 'transparent',
                  color: activeGame === game.key ? '#fff' : colors.textSecondary,
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {game.icon} {game.label}
              </button>
            ))}
          </div>
        </div>

        {/* Game Area */}
        <div style={{
          flex: 1, overflow: 'auto', padding: 20,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          {activeGame === 'snake' ? (
            <SnakeGame colors={colors} onScoreUpdate={setSnakeScore} />
          ) : (
            <TetrisGame colors={colors} onScoreUpdate={setTetrisScore} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${colors.border}`,
          fontSize: 12, color: colors.textMuted, textAlign: 'center',
        }}>
          💡 提示：玩游戏时按 ` 键可快速切换到伪装模式
        </div>
      </div>
    </div>
  );
}
