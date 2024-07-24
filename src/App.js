import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GRAVITY = 0.5;
const JUMP_STRENGTH = 10;
const MOVE_SPEED = 5;

const EMOJIS = {
  player: '🐢',
  platform: '🟩',
  coin: '💰',
  enemy: '👾',
  heart: '❤️',
  powerUp: '⭐',
};

const Button = ({ children, ...props }) => (
  <button 
    style={{
      padding: '10px 20px',
      fontSize: '16px',
      backgroundColor: props.disabled ? '#ccc' : '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: props.disabled ? 'not-allowed' : 'pointer'
    }}
    {...props}
  >
    {children}
  </button>
);

const Alert = ({ children, type = 'error' }) => (
  <div style={{
    padding: '20px',
    backgroundColor: type === 'error' ? '#f44336' : '#4CAF50',
    color: 'white',
    marginBottom: '15px'
  }}>
    {children}
  </div>
);

const EmojiPlatformer = () => {
  const [player, setPlayer] = useState({ x: 50, y: 200, vy: 0 });
  const [platforms, setPlatforms] = useState([]);
  const [coins, setCoins] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [movingLeft, setMovingLeft] = useState(false);
  const [movingRight, setMovingRight] = useState(false);
  const [isPoweredUp, setIsPoweredUp] = useState(false);
  const [message, setMessage] = useState(null);
  const [highScores, setHighScores] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover'
  const [difficulty, setDifficulty] = useState('normal'); // 'easy', 'normal', 'hard'
  const [performanceData, setPerformanceData] = useState([]);

  const gameLoopRef = useRef(null);
  const lastUpdateTimeRef = useRef(Date.now());

  const difficultySettings = {
    easy: { enemySpeed: 1, coinValue: 15, powerUpDuration: 7000 },
    normal: { enemySpeed: 2, coinValue: 10, powerUpDuration: 5000 },
    hard: { enemySpeed: 3, coinValue: 5, powerUpDuration: 3000 },
  };

  const initGame = useCallback(() => {
    const settings = difficultySettings[difficulty];
    setPlatforms([
      { x: 0, y: 350, width: 200 },
      { x: 250, y: 300, width: 200 },
      { x: 500, y: 250, width: 200 },
      { x: 750, y: 350, width: 200 },
    ]);
    setCoins([
      { x: 100, y: 300 },
      { x: 300, y: 250 },
      { x: 550, y: 200 },
    ]);
    setEnemies([
      { x: 400, y: 325, direction: settings.enemySpeed },
      { x: 700, y: 325, direction: -settings.enemySpeed },
    ]);
    setPowerUps([{ x: 400, y: 200 }]);
    setPlayer({ x: 50, y: 200, vy: 0 });
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setIsPoweredUp(false);
    setMessage(null);
    setGameState('playing');
    setPerformanceData([]);
  }, [difficulty]);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;
      updateGameState(deltaTime);
      lastUpdateTimeRef.current = now;

      setPerformanceData(prevData => {
        const newData = [...prevData, { time: now, fps: 1000 / deltaTime }];
        if (newData.length > 100) newData.shift(); // Keep only last 100 data points
        return newData;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const updateGameState = useCallback((deltaTime) => {
    const settings = difficultySettings[difficulty];
    
    setPlayer(prev => {
      let newX = prev.x;
      if (movingLeft) newX -= MOVE_SPEED * (deltaTime / 16);
      if (movingRight) newX += MOVE_SPEED * (deltaTime / 16);
      newX = Math.max(0, Math.min(newX, GAME_WIDTH - 20));

      let newY = prev.y + prev.vy * (deltaTime / 16);
      let newVy = prev.vy + GRAVITY * (deltaTime / 16);

      const onPlatform = platforms.some(plat => 
        newX < plat.x + plat.width &&
        newX + 20 > plat.x &&
        newY + 20 >= plat.y &&
        newY + 20 <= plat.y + 10
      );

      if (onPlatform) {
        newY = platforms.find(plat => 
          newX < plat.x + plat.width &&
          newX + 20 > plat.x &&
          newY + 20 >= plat.y &&
          newY + 20 <= plat.y + 10
        ).y - 20;
        newVy = 0;
        if (jumping) {
          newVy = -JUMP_STRENGTH;
        }
      }

      if (newY > GAME_HEIGHT - 20) {
        newY = GAME_HEIGHT - 20;
        newVy = 0;
      }

      return { x: newX, y: newY, vy: newVy };
    });

    setEnemies(prev => prev.map(enemy => {
      let newX = enemy.x + enemy.direction * (deltaTime / 16);
      if (newX <= 0 || newX >= GAME_WIDTH - 20) {
        return { ...enemy, x: newX, direction: -enemy.direction };
      }
      return { ...enemy, x: newX };
    }));

    setCoins(prev => prev.filter(coin => {
      if (Math.abs(coin.x - player.x) < 20 && Math.abs(coin.y - player.y) < 20) {
        setScore(s => s + settings.coinValue);
        return false;
      }
      return true;
    }));

    setPowerUps(prev => prev.filter(powerUp => {
      if (Math.abs(powerUp.x - player.x) < 20 && Math.abs(powerUp.y - player.y) < 20) {
        setIsPoweredUp(true);
        setTimeout(() => setIsPoweredUp(false), settings.powerUpDuration);
        setMessage({ text: `Power Up! Invincible for ${settings.powerUpDuration / 1000} seconds!`, type: 'success' });
        setTimeout(() => setMessage(null), 2000);
        return false;
      }
      return true;
    }));

    enemies.forEach(enemy => {
      if (Math.abs(enemy.x - player.x) < 20 && Math.abs(enemy.y - player.y) < 20) {
        if (!isPoweredUp) {
          setLives(l => {
            if (l > 1) return l - 1;
            setGameState('gameover');
            return 0;
          });
        }
      }
    });

    if (coins.length === 0) {
      setLevel(l => l + 1);
      initGame();
      setMessage({ text: `Level ${level + 1}!`, type: 'success' });
      setTimeout(() => setMessage(null), 2000);
    }
  }, [player, platforms, coins, enemies, powerUps, isPoweredUp, jumping, movingLeft, movingRight, level, initGame, difficulty]);

  const handleKeyDown = useCallback((e) => {
    if (gameState !== 'playing') return;
    if (e.key === 'ArrowLeft') setMovingLeft(true);
    if (e.key === 'ArrowRight') setMovingRight(true);
    if (e.key === 'ArrowUp') setJumping(true);
  }, [gameState]);

  const handleKeyUp = useCallback((e) => {
    if (e.key === 'ArrowLeft') setMovingLeft(false);
    if (e.key === 'ArrowRight') setMovingRight(false);
    if (e.key === 'ArrowUp') setJumping(false);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleGameOver = useCallback(() => {
    setHighScores(prev => {
      const newScores = [...prev, { name: playerName || 'Anonymous', score }].sort((a, b) => b.score - a.score).slice(0, 5);
      localStorage.setItem('highScores', JSON.stringify(newScores));
      return newScores;
    });
    setGameState('gameover');
  }, [playerName, score]);

  useEffect(() => {
    const savedScores = JSON.parse(localStorage.getItem('highScores') || '[]');
    setHighScores(savedScores);
  }, []);

  const renderMenu = () => (
    <div style={{ textAlign: 'center' }}>
      <h2>Welcome to Emoji Platformer!</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        style={{ margin: '10px', padding: '5px' }}
      />
      <div>
        <Button onClick={() => setDifficulty('easy')}>Easy</Button>
        <Button onClick={() => setDifficulty('normal')}>Normal</Button>
        <Button onClick={() => setDifficulty('hard')}>Hard</Button>
      </div>
      <Button onClick={initGame}>Start Game</Button>
    </div>
  );

  const renderGame = () => (
    <>
      <div style={{ marginBottom: '1rem' }}>
        Score: {score} | Lives: {lives.toString().padStart(3, EMOJIS.heart)} | Level: {level}
      </div>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <div style={{
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        border: '2px solid black',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {platforms.map((plat, index) => (
          <div key={index} style={{
            position: 'absolute',
            left: `${plat.x}px`,
            top: `${plat.y}px`,
            width: `${plat.width}px`,
            height: '20px',
            display: 'flex',
            alignItems: 'center',
          }}>
            {Array(Math.ceil(plat.width / 20)).fill(EMOJIS.platform)}
          </div>
        ))}
        {coins.map((coin, index) => (
          <div key={index} style={{
            position: 'absolute',
            left: `${coin.x}px`,
            top: `${coin.y}px`,
            fontSize: '20px',
          }}>
            {EMOJIS.coin}
          </div>
        ))}
        {enemies.map((enemy, index) => (
          <div key={index} style={{
            position: 'absolute',
            left: `${enemy.x}px`,
            top: `${enemy.y}px`,
            fontSize: '20px',
          }}>
            {EMOJIS.enemy}
          </div>
        ))}
        {powerUps.map((powerUp, index) => (
          <div key={index} style={{
            position: 'absolute',
            left: `${powerUp.x}px`,
            top: `${powerUp.y}px`,
            fontSize: '20px',
          }}>
            {EMOJIS.powerUp}
          </div>
        ))}
        <div style={{
          position: 'absolute',
          left: `${player.x}px`,
          top: `${player.y}px`,
          fontSize: '20px',
          filter: isPoweredUp ? 'drop-shadow(0 0 5px gold)' : 'none',
        }}>
          {EMOJIS.player}
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Button onMouseDown={() => setMovingLeft(true)} onMouseUp={() => setMovingLeft(false)} onMouseLeave={() => setMovingLeft(false)}>⬅️</Button>
        <Button onMouseDown={() => setJumping(true)} onMouseUp={() => setJumping(false)} onMouseLeave={() => setJumping(false)}>⬆️</Button>
        <Button onMouseDown={() => setMovingRight(true)} onMouseUp={() => setMovingRight(false)} onMouseLeave={() => setMovingRight(false)}>➡️</Button>
      </div>
    </>
  );

  const renderGameOver = () => (
    <div style={{ textAlign: 'center' }}>
      <h2>Game Over!</h2>
      <p>Your score: {score}</p>
      <h3>High Scores</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {highScores.map((entry, index) => (
          <li key={index}>{entry.name}: {entry.score}</li>
        ))}
      </ul>
      <Button onClick={() => setGameState('menu')}>Back to Menu</Button>
    </div>
  );

  const renderPerformanceChart = () => (
    <div style={{ marginTop: '20px' }}>
      <h3>Performance</h3>
      <LineChart width={600} height={300} data={performanceData}>
        <XAxis dataKey="time" />
        <YAxis />
        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="fps" stroke="#8884d8" />
        <Tooltip />
        <Legend />
      </LineChart>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to right, #e6f3ff, #e6fff2)',
      padding: '1rem'
    }}>
      <h1 style={{
        fontSize: '2.25rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        color: '#2196f3'
      }}>Emoji Platformer</h1>
      
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
      
      {gameState !== 'menu' && renderPerformanceChart()}
    </div>
  );
};

export default EmojiPlatformer;