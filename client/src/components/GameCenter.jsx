import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../ThemeContext.jsx';
import { GamepadIcon, PlayIcon, PauseIcon, RotateCwIcon, SkullIcon, LightbulbIcon, GridIcon, KeyboardIcon, ActivityIcon } from './Icons.jsx';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

// ═══════════════════════════════════════════════════
// 贪吃蛇游戏
// ═══════════════════════════════════════════════════
function SnakeGame({ theme, tokens, onScoreUpdate }) {
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

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection({ x: 1, y: 0 });
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    onScoreUpdate?.(0);
  }, [generateFood, onScoreUpdate]);

  const togglePause = useCallback(() => {
    setGameOver(prev => {
      if (!prev) setIsPaused(p => !p);
      return prev;
    });
  }, []);

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
        if (currentDir.x !== -newDir.x || currentDir.y !== -newDir.y) {
          setDirection(newDir);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isPaused, resetGame, togglePause]);

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
    ctx.fillStyle = theme.bg.tertiary;
    ctx.fillRect(0, 0, size, size);

    // 绘制网格
    ctx.strokeStyle = theme.border.default;
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
    ctx.fillStyle = theme.status.error;
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
      ctx.fillStyle = isHead ? theme.accent.primary : `${theme.accent.primary}cc`;
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
  }, [snake, food, theme]);

  return (
    <GameContainer theme={theme} tokens={tokens}>
      {/* Score Board */}
      <GameScoreBoard theme={theme} tokens={tokens}>
        <ScoreItem theme={theme} tokens={tokens} label="得分" value={score} color={theme.accent.primary} />
        <ScoreDivider theme={theme} />
        <ScoreItem theme={theme} tokens={tokens} label="最高分" value={highScore} color={theme.status.success} />
        <ScoreDivider theme={theme} />
        <GameButton
          onClick={togglePause}
          disabled={gameOver}
          theme={theme}
          tokens={tokens}
          variant={isPaused ? 'success' : 'primary'}
          icon={isPaused ? PlayIcon : PauseIcon}
        >
          {isPaused ? '继续' : '暂停'}
        </GameButton>
      </GameScoreBoard>

      {/* Game Canvas */}
      <CanvasContainer theme={theme} tokens={tokens}>
        <canvas
          ref={canvasRef}
          style={{
            border: `2px solid ${theme.border.default}`,
            borderRadius: tokens.borderRadius.md,
            display: 'block',
          }}
        />

        {/* Game Over Overlay */}
        {gameOver && (
          <GameOverlay theme={theme} tokens={tokens}>
            <SkullIcon size={48} color={theme.status.error} />
            <OverlayTitle theme={theme} tokens={tokens}>游戏结束</OverlayTitle>
            <OverlaySubtitle theme={theme} tokens={tokens}>最终得分: {score}</OverlaySubtitle>
            <GameButton
              onClick={resetGame}
              theme={theme}
              tokens={tokens}
              variant="primary"
              icon={RotateCwIcon}
            >
              重新开始 (空格)
            </GameButton>
          </GameOverlay>
        )}

        {/* Pause Overlay */}
        {isPaused && !gameOver && (
          <GameOverlay theme={theme} tokens={tokens} style={{ background: `${theme.bg.overlay}99` }}>
            <PauseIcon size={48} color={theme.text.primary} />
            <OverlayTitle theme={theme} tokens={tokens} style={{ fontSize: tokens.typography.fontSize.lg }}>
              已暂停
            </OverlayTitle>
            <OverlaySubtitle theme={theme} tokens={tokens}>按空格继续</OverlaySubtitle>
          </GameOverlay>
        )}
      </CanvasContainer>

      {/* Controls */}
      <GameControls theme={theme} tokens={tokens}>
        <ControlItem icon={KeyboardIcon} theme={theme} tokens={tokens}>
          WASD / 方向键 移动
        </ControlItem>
        <ControlDivider theme={theme} />
        <ControlItem icon={PauseIcon} theme={theme} tokens={tokens}>
          空格 暂停
        </ControlItem>
      </GameControls>
    </GameContainer>
  );
}

// ═══════════════════════════════════════════════════
// 俄罗斯方块游戏
// ═══════════════════════════════════════════════════
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

function TetrisGame({ theme, tokens, onScoreUpdate }) {
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

  // 使用 ref 保持最新值，避免闭包中读到 stale state
  const boardRef = useRef(board);
  boardRef.current = board;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const levelRef = useRef(level);
  levelRef.current = level;
  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;

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
    const currentBoard = boardRef.current;
    for (let y = 0; y < newShape.length; y++) {
      for (let x = 0; x < newShape[y].length; x++) {
        if (newShape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          if (boardX < 0 || boardX >= TETRIS_COLS || boardY >= TETRIS_ROWS) {
            return false;
          }
          if (boardY >= 0 && currentBoard[boardY][boardX]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const lockPiece = (piece) => {
    const newBoard = boardRef.current.map(row => [...row]);
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
      const currentScore = scoreRef.current;
      const currentLevel = levelRef.current;
      const currentLines = linesRef.current;
      const currentHighScore = highScoreRef.current;
      const newScore = currentScore + lineScores[clearedLines] * currentLevel;
      setScore(newScore);
      setLines(currentLines + clearedLines);
      setLevel(Math.floor((currentLines + clearedLines) / 10) + 1);
      onScoreUpdate?.(newScore);
      if (newScore > currentHighScore) {
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
    ctx.fillStyle = theme.bg.tertiary;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = theme.border.default;
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
  }, [board, currentPiece, theme]);

  return (
    <GameContainer theme={theme} tokens={tokens}>
      {/* Score Board */}
      <GameScoreBoard theme={theme} tokens={tokens} style={{ flexWrap: 'wrap' }}>
        <ScoreItem theme={theme} tokens={tokens} label="得分" value={score} color={theme.accent.primary} />
        <ScoreDivider theme={theme} />
        <ScoreItem theme={theme} tokens={tokens} label="行数" value={lines} color={theme.status.success} />
        <ScoreDivider theme={theme} />
        <ScoreItem theme={theme} tokens={tokens} label="等级" value={level} color={theme.status.warning} />
        <ScoreDivider theme={theme} />
        <ScoreItem theme={theme} tokens={tokens} label="最高分" value={highScore} color="#a855f7" />
        <ScoreDivider theme={theme} />
        <GameButton
          onClick={togglePause}
          disabled={gameOver}
          theme={theme}
          tokens={tokens}
          variant={isPaused ? 'success' : 'primary'}
          icon={isPaused ? PlayIcon : PauseIcon}
        >
          {isPaused ? '继续' : '暂停'}
        </GameButton>
      </GameScoreBoard>

      {/* Game Canvas */}
      <CanvasContainer theme={theme} tokens={tokens}>
        <canvas
          ref={canvasRef}
          style={{
            border: `2px solid ${theme.border.default}`,
            borderRadius: tokens.borderRadius.md,
            display: 'block',
          }}
        />

        {/* Game Over Overlay */}
        {gameOver && (
          <GameOverlay theme={theme} tokens={tokens}>
            <SkullIcon size={48} color={theme.status.error} />
            <OverlayTitle theme={theme} tokens={tokens}>游戏结束</OverlayTitle>
            <OverlaySubtitle theme={theme} tokens={tokens}>
              最终得分: {score} | 消除行数: {lines}
            </OverlaySubtitle>
            <GameButton
              onClick={resetGame}
              theme={theme}
              tokens={tokens}
              variant="primary"
              icon={RotateCwIcon}
            >
              重新开始 (空格)
            </GameButton>
          </GameOverlay>
        )}

        {/* Pause Overlay */}
        {isPaused && !gameOver && (
          <GameOverlay theme={theme} tokens={tokens} style={{ background: `${theme.bg.overlay}99` }}>
            <PauseIcon size={48} color={theme.text.primary} />
            <OverlayTitle theme={theme} tokens={tokens} style={{ fontSize: tokens.typography.fontSize.lg }}>
              已暂停
            </OverlayTitle>
            <OverlaySubtitle theme={theme} tokens={tokens}>按空格继续</OverlaySubtitle>
          </GameOverlay>
        )}
      </CanvasContainer>

      {/* Controls */}
      <GameControls theme={theme} tokens={tokens}>
        <ControlItem icon={KeyboardIcon} theme={theme} tokens={tokens}>
          方向键 移动
        </ControlItem>
        <ControlDivider theme={theme} />
        <ControlItem icon={RotateCwIcon} theme={theme} tokens={tokens}>
          上/W 旋转
        </ControlItem>
        <ControlDivider theme={theme} />
        <ControlItem icon={PauseIcon} theme={theme} tokens={tokens}>
          下/S 加速
        </ControlItem>
        <ControlDivider theme={theme} />
        <ControlItem icon={PauseIcon} theme={theme} tokens={tokens}>
          空格 暂停
        </ControlItem>
      </GameControls>
    </GameContainer>
  );
}

// ═══════════════════════════════════════════════════
// UI 组件
// ═══════════════════════════════════════════════════

function GameContainer({ children, theme, tokens }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
    }}>
      {children}
    </div>
  );
}

function GameScoreBoard({ children, theme, tokens, style = {} }) {
  return (
    <div style={{
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      padding: '10px 16px',
      background: theme.glass.background,
      backdropFilter: theme.glass.blur,
      border: theme.glass.border,
      borderRadius: tokens.borderRadius.lg,
      boxShadow: theme.shadow.sm,
      ...style,
    }}>
      {children}
    </div>
  );
}

function ScoreItem({ theme, tokens, label, value, color }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 50 }}>
      <div style={{
        fontSize: tokens.typography.fontSize.xs,
        color: theme.text.secondary,
        marginBottom: 2,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: tokens.typography.fontSize.xl,
        fontWeight: 700,
        color: color,
        fontFamily: tokens.typography.fontFamily.mono,
      }}>
        {value}
      </div>
    </div>
  );
}

function ScoreDivider({ theme }) {
  return (
    <div style={{
      width: 1,
      height: 30,
      background: theme.border.default,
    }} />
  );
}

function GameButton({ children, onClick, disabled, theme, tokens, variant = 'primary', icon: Icon }) {
  const variantStyles = {
    primary: {
      background: theme.accent.primary,
      color: '#fff',
    },
    success: {
      background: theme.status.success,
      color: '#fff',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: tokens.borderRadius.md,
        border: 'none',
        ...variantStyles[variant],
        cursor: disabled ? 'default' : 'pointer',
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        transition: `all ${tokens.animation.duration.fast} ease`,
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function CanvasContainer({ children, theme, tokens }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
    </div>
  );
}

function GameOverlay({ children, theme, tokens, style = {} }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: theme.bg.overlay,
      backdropFilter: theme.glass.blur,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.borderRadius.md,
      gap: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

function OverlayTitle({ children, theme, tokens, style = {} }) {
  return (
    <div style={{
      fontSize: tokens?.typography?.fontSize?.xl || '20px',
      fontWeight: 700,
      color: theme.text.primary,
      ...style,
    }}>
      {children}
    </div>
  );
}

function OverlaySubtitle({ children, theme, tokens }) {
  return (
    <div style={{
      fontSize: tokens?.typography?.fontSize?.sm || '14px',
      color: theme.text.secondary,
    }}>
      {children}
    </div>
  );
}

function GameControls({ children, theme, tokens }) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      color: theme.text.secondary,
      fontSize: tokens.typography.fontSize.sm,
      flexWrap: 'wrap',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}

function ControlItem({ children, icon: Icon, theme, tokens }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <Icon size={14} />
      <span>{children}</span>
    </div>
  );
}

function ControlDivider({ theme }) {
  return (
    <span style={{ color: theme.border.default }}>•</span>
  );
}

// ═══════════════════════════════════════════════════
// 游戏中心主组件
// ═══════════════════════════════════════════════════
export default function GameCenter() {
  const { theme, tokens } = useTheme();
  const [activeGame, setActiveGame] = useState('snake');
  const [snakeScore, setSnakeScore] = useState(0);
  const [tetrisScore, setTetrisScore] = useState(0);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        background: theme.glass.background,
        backdropFilter: theme.glass.blur,
        border: theme.glass.border,
        borderRadius: tokens.borderRadius.xl,
        boxShadow: theme.shadow.md,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flex: 1,
        transition: `all ${tokens.animation.duration.normal} ease`,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: tokens.borderRadius.md,
              background: theme.gradient.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GamepadIcon size={22} color="#fff" />
            </div>
            <span style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: 700,
              color: theme.text.primary,
            }}>
              休闲游戏中心
            </span>
          </div>

          {/* Game Selector */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: theme.bg.tertiary,
            padding: 4,
            borderRadius: tokens.borderRadius.md,
          }}>
            {[
              { key: 'snake', label: '贪吃蛇', icon: ActivityIcon },
              { key: 'tetris', label: '俄罗斯方块', icon: GridIcon },
            ].map(game => {
              const Icon = game.icon;
              const isActive = activeGame === game.key;
              return (
                <button
                  key={game.key}
                  onClick={() => setActiveGame(game.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: tokens.borderRadius.base,
                    border: 'none',
                    background: isActive ? theme.accent.primary : 'transparent',
                    color: isActive ? '#fff' : theme.text.secondary,
                    cursor: 'pointer',
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: isActive ? 600 : 500,
                    transition: `all ${tokens.animation.duration.fast} ease`,
                  }}
                >
                  <Icon size={16} />
                  {game.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 20,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {activeGame === 'snake' ? (
            <SnakeGame theme={theme} tokens={tokens} onScoreUpdate={setSnakeScore} />
          ) : (
            <TetrisGame theme={theme} tokens={tokens} onScoreUpdate={setTetrisScore} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${theme.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: tokens.typography.fontSize.sm,
          color: theme.text.tertiary,
        }}>
          <LightbulbIcon size={16} />
          <span>提示：玩游戏时按 ` 键可快速切换到伪装模式</span>
        </div>
      </div>
    </div>
  );
}
