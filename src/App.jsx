import { useState, useEffect } from 'react';
import ChessBoard from './ChessBoard';
import { createInitialBoard, movePiece, isInCheck, isCheckmate, isStalemate, isInsufficientMaterial, getBoardHash } from './gameLogic';
import { calculateBestMove, shouldAiAcceptDraw } from './aiEngineAdapter';
import './App.css';

function App() {
  const [gameMode, setGameMode] = useState(null); // null: 选择模式, 'pvp': 双人对战, 'pve': 人机对战
  const [difficulty, setDifficulty] = useState('easy'); // easy, medium, hard - 默认简单
  const [aiColor, setAiColor] = useState('black'); // AI执棋颜色
  const [board, setBoard] = useState(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState('red'); // 红方先手
  const [history, setHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, check, checkmate, stalemate, draw
  const [winner, setWinner] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null); // 错误提示消息
  const [lastMove, setLastMove] = useState(null); // 最近一手棋
  const [movesSinceCapture, setMovesSinceCapture] = useState(0); // 自上次吃子以来的回合数
  const [positionHistory, setPositionHistory] = useState([]); // 局面历史（用于检测重复）
  const [drawOffer, setDrawOffer] = useState(null); // 求和提议: { from: 'red' | 'black' }
  
  // AI自动走棋
  useEffect(() => {
    // 检查条件：人机对战 && 轮到AI && 游戏未结束 && AI未思考中
    if (gameMode === 'pve' && 
        currentPlayer === aiColor && 
        gameStatus !== 'checkmate' && 
        gameStatus !== 'stalemate' && 
        gameStatus !== 'draw' && 
        !isAiThinking) {
      setIsAiThinking(true);
      
      // 延迟一下让AI看起来在思考
      setTimeout(() => {
        const bestMove = calculateBestMove(board, aiColor, difficulty);
        
        if (bestMove) {
          const [fromRow, fromCol] = bestMove.from;
          const [toRow, toCol] = bestMove.to;
          handleMove(fromRow, fromCol, toRow, toCol);
        }
        
        setIsAiThinking(false);
      }, 500);
    }
  }, [currentPlayer, gameMode, aiColor, gameStatus, board, difficulty, isAiThinking]);
  
  const handleMove = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
    
    // 检查移动后是否让自己被将军（非法移动）
    if (isInCheck(newBoard, currentPlayer)) {
      setErrorMessage('不能送将！');
      // 1.5秒后清除错误提示
      setTimeout(() => setErrorMessage(null), 1500);
      return;
    }
    
    // 检查是否有吃子
    const isCapture = board[toRow][toCol] !== null;
    const newMovesSinceCapture = isCapture ? 0 : movesSinceCapture + 1;
    
    // 保存历史
    setHistory([...history, board]);
    setBoard(newBoard);
    
    // 保存最近一手棋
    setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol] });
    
    // 清除求和提议（棋局继续后求和失效）
    setDrawOffer(null);
    
    // 更新自上次吃子的回合数
    setMovesSinceCapture(newMovesSinceCapture);
    
    // 保存局面到历史
    const boardHash = getBoardHash(newBoard);
    const newPositionHistory = [...positionHistory, boardHash];
    setPositionHistory(newPositionHistory);
    
    // 检查是否三次重复局面
    const hashCount = newPositionHistory.filter(h => h === boardHash).length;
    if (hashCount >= 3) {
      setGameStatus('draw');
      setWinner('draw');
      return;
    }
    
    // 检查自然限着规则（120回合即240步无吃子）
    if (newMovesSinceCapture >= 120) {
      setGameStatus('draw');
      setWinner('draw');
      return;
    }
    
    // 检查子力不足
    if (isInsufficientMaterial(newBoard)) {
      setGameStatus('draw');
      setWinner('draw');
      return;
    }
    
    // 切换玩家
    const nextPlayer = currentPlayer === 'red' ? 'black' : 'red';
    
    // 检查对手是否被将军或将死
    if (isCheckmate(newBoard, nextPlayer)) {
      setGameStatus('checkmate');
      setWinner(currentPlayer);
    } else if (isStalemate(newBoard, nextPlayer)) {
      // 困毙判和
      setGameStatus('stalemate');
      setWinner('draw');
    } else if (isInCheck(newBoard, nextPlayer)) {
      setGameStatus('check');
    } else {
      setGameStatus('playing');
    }
    
    setCurrentPlayer(nextPlayer);
  };
  
  const handleUndo = () => {
    if (gameMode === 'pve') {
      // 人机对战：撤销两步（AI的一步 + 玩家的一步），回到玩家走棋前
      if (history.length >= 2) {
        const previousBoard = history[history.length - 2];
        setBoard(previousBoard);
        setHistory(history.slice(0, -2));
        // 玩家重新走棋，所以切换到玩家的颜色
        const playerColor = aiColor === 'red' ? 'black' : 'red';
        setCurrentPlayer(playerColor);
        setGameStatus('playing');
        setWinner(null);
        setLastMove(null); // 清除最近一手棋
      }
    } else {
      // 双人对战：撤销一步
      if (history.length > 0) {
        const previousBoard = history[history.length - 1];
        setBoard(previousBoard);
        setHistory(history.slice(0, -1));
        setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
        setGameStatus('playing');
        setWinner(null);
        setLastMove(null); // 清除最近一手棋
      }
    }
  };
  
  const handleReset = () => {
    setBoard(createInitialBoard());
    setCurrentPlayer('red');
    setHistory([]);
    setGameStatus('playing');
    setWinner(null);
    setIsAiThinking(false);
    setLastMove(null); // 清除最近一手棋
    setMovesSinceCapture(0);
    setPositionHistory([]);
    setDrawOffer(null);
  };
  
  // 反转棋盘：交换玩家和AI的执棋颜色
  const handleFlip = () => {
    if (gameMode !== 'pve') return; // 只在人机对战模式下有效
    
    // 交换AI颜色
    const newAiColor = aiColor === 'red' ? 'black' : 'red';
    setAiColor(newAiColor);
    
    // 注意：棋局不变，只是反转视角
    // 如果反转后轮到AI走棋，需要重置 isAiThinking 以触发 useEffect
    if (currentPlayer === newAiColor && !isAiThinking) {
      // 触发AI走棋：通过短暂设置 isAiThinking 为 false 来重新触发 useEffect
      setIsAiThinking(false);
    }
  };
  
  const handleBackToMenu = () => {
    handleReset();
    setGameMode(null);
  };
  
  // 提议求和
  const handleOfferDraw = () => {
    if (gameStatus !== 'playing' && gameStatus !== 'check') return;
    if (isAiThinking) return;
    
    setDrawOffer({ from: currentPlayer });
    
    // 如果是人机对战且玩家提议AI求和
    if (gameMode === 'pve' && currentPlayer !== aiColor) {
      setIsAiThinking(true);
      setTimeout(() => {
        // AI根据局势评估决定是否接受
        const aiAccepts = shouldAiAcceptDraw(board, aiColor, difficulty);
        if (aiAccepts) {
          handleAcceptDraw();
        } else {
          handleDeclineDraw();
        }
        setIsAiThinking(false);
      }, 1500); // 1.5秒延迟模拟AI思考
    }
  };
  
  // 接受求和
  const handleAcceptDraw = () => {
    setGameStatus('draw');
    setWinner('draw');
    setDrawOffer(null);
  };
  
  // 拒绝求和
  const handleDeclineDraw = () => {
    setDrawOffer(null);
    setErrorMessage('对方拒绝了求和');
    setTimeout(() => setErrorMessage(null), 1500);
  };
  
  const startGame = (mode, selectedAiColor = 'black', selectedDifficulty = 'medium') => {
    setGameMode(mode);
    setAiColor(selectedAiColor);
    setDifficulty(selectedDifficulty);
    handleReset();
  };
  
  // 游戏模式选择界面
  if (gameMode === null) {
    return (
      <div className="app">
        <h1>中国象棋</h1>
        <div className="mode-selection">
          <h2>选择游戏模式</h2>
          <div className="mode-buttons">
            <button className="mode-btn" onClick={() => startGame('pvp')}>
              <span className="mode-icon">👥</span>
              <span className="mode-title">双人对战</span>
              <span className="mode-desc">与好友面对面对弈</span>
            </button>
            <button className="mode-btn" onClick={() => startGame('pve', aiColor, difficulty)}>
              <span className="mode-icon">🤖</span>
              <span className="mode-title">人机对战</span>
              <span className="mode-desc">挑战AI对手</span>
            </button>
          </div>
          
          <div className="ai-settings">
            <h3>AI设置</h3>
            <div className="setting-group">
              <label>AI难度：</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            <div className="setting-group">
              <label>玩家先后：</label>
              <select value={aiColor} onChange={(e) => setAiColor(e.target.value)}>
                <option value="black">玩家先手（红方）</option>
                <option value="red">AI先手（AI执红）</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="app">
      <div className="game-info">
        <div className="status">
          {gameStatus === 'checkmate' ? (
            <span className="winner">🏆 {winner === 'red' ? '红方' : '黑方'}获胜！</span>
          ) : gameStatus === 'draw' || gameStatus === 'stalemate' ? (
            <span className="draw">🤝 和棋！</span>
          ) : (
            <>
              <span>当前回合：</span>
              <span className={`player ${currentPlayer}`}>
                {currentPlayer === 'red' ? '红方' : '黑方'}
                {gameMode === 'pve' && currentPlayer === aiColor && ' (AI)'}
              </span>
              {gameStatus === 'check' && <span className="check">（将军！）</span>}
              {isAiThinking && <span className="thinking"> 思考中...</span>}
            </>
          )}
        </div>
        
        {/* 求和提议显示 */}
        {drawOffer && drawOffer.from !== currentPlayer && gameMode === 'pvp' && (
          <div className="draw-offer">
            <span>🤝 {drawOffer.from === 'red' ? '红方' : '黑方'}提议求和</span>
            <button onClick={handleAcceptDraw} className="accept-btn">同意</button>
            <button onClick={handleDeclineDraw} className="decline-btn">拒绝</button>
          </div>
        )}
        
        <div className="controls">
          <button 
            onClick={handleUndo} 
            disabled={
              isAiThinking || 
              (gameMode === 'pve' ? history.length < 2 : history.length === 0)
            }
          >
            ⏮️ 悔棋
          </button>
          <button 
            onClick={handleOfferDraw}
            disabled={
              isAiThinking || 
              (gameStatus !== 'playing' && gameStatus !== 'check') ||
              (drawOffer && drawOffer.from === currentPlayer)
            }
          >
            🤝 求和
          </button>
          <button onClick={handleReset} disabled={isAiThinking}>
            🔄 重新开始
          </button>
          {gameMode === 'pve' && (
            <button onClick={handleFlip} disabled={isAiThinking}>
              🔁 反转
            </button>
          )}
          <button onClick={handleBackToMenu} disabled={isAiThinking}>
            🏠 返回菜单
          </button>
        </div>
      </div>
      <ChessBoard 
        board={board} 
        onMove={handleMove}
        currentPlayer={currentPlayer}
        gameStatus={gameStatus}
        winner={winner}
        errorMessage={errorMessage}
        playerColor={gameMode === 'pve' ? (aiColor === 'red' ? 'black' : 'red') : 'red'}
        disabled={isAiThinking || (gameMode === 'pve' && currentPlayer === aiColor)}
        lastMove={lastMove}
      />
    </div>
  );
}

export default App;
