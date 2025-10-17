import { useEffect, useRef, useState } from 'react';
import { PIECE_NAMES, getLegalMoves } from './gameLogic';

const ChessBoard = ({ board, onMove, currentPlayer, disabled = false, gameStatus, winner, errorMessage, playerColor = 'red' }) => {
  const canvasRef = useRef(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [dimensions, setDimensions] = useState({ cellSize: 60, padding: 40 });
  
  // 响应式计算棋盘尺寸
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      let cellSize, padding;
      
      if (screenWidth < 480) {
        // 小屏手机：棋盘适配屏幕宽度，留出两侧留白
        const maxWidth = screenWidth - 20; // 左右各10px留白
        cellSize = Math.floor((maxWidth - 40) / 8); // 40是两侧padding
        padding = 20;
      } else if (screenWidth < 768) {
        // 中等手机/平板
        cellSize = 50;
        padding = 35;
      } else {
        // 桌面端
        cellSize = 60;
        padding = 40;
      }
      
      setDimensions({ cellSize, padding });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  const CELL_SIZE = dimensions.cellSize;
  const BOARD_PADDING = dimensions.padding;
  const PIECE_RADIUS = Math.floor(CELL_SIZE * 0.4);
  
  useEffect(() => {
    drawBoard();
  }, [board, selectedPiece, legalMoves, gameStatus, winner, errorMessage, playerColor]);
  
  // 绘制棋盘
  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = CELL_SIZE * 8 + BOARD_PADDING * 2;
    const height = CELL_SIZE * 9 + BOARD_PADDING * 2;
    
    // 根据玩家颜色决定是否翻转棋盘
    const shouldFlip = playerColor === 'black';
    
    // 清空画布
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制棋盘线
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    // 横线
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_PADDING, BOARD_PADDING + i * CELL_SIZE);
      ctx.lineTo(BOARD_PADDING + 8 * CELL_SIZE, BOARD_PADDING + i * CELL_SIZE);
      ctx.stroke();
    }
    
    // 竖线
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING);
      if (i === 0 || i === 8) {
        ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + 9 * CELL_SIZE);
      } else {
        ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + 4 * CELL_SIZE);
        ctx.moveTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + 5 * CELL_SIZE);
        ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + 9 * CELL_SIZE);
      }
      ctx.stroke();
    }
    
    // 绘制九宫格斜线
    // 上方九宫格
    ctx.beginPath();
    ctx.moveTo(BOARD_PADDING + 3 * CELL_SIZE, BOARD_PADDING);
    ctx.lineTo(BOARD_PADDING + 5 * CELL_SIZE, BOARD_PADDING + 2 * CELL_SIZE);
    ctx.moveTo(BOARD_PADDING + 5 * CELL_SIZE, BOARD_PADDING);
    ctx.lineTo(BOARD_PADDING + 3 * CELL_SIZE, BOARD_PADDING + 2 * CELL_SIZE);
    ctx.stroke();
    
    // 下方九宫格
    ctx.beginPath();
    ctx.moveTo(BOARD_PADDING + 3 * CELL_SIZE, BOARD_PADDING + 7 * CELL_SIZE);
    ctx.lineTo(BOARD_PADDING + 5 * CELL_SIZE, BOARD_PADDING + 9 * CELL_SIZE);
    ctx.moveTo(BOARD_PADDING + 5 * CELL_SIZE, BOARD_PADDING + 7 * CELL_SIZE);
    ctx.lineTo(BOARD_PADDING + 3 * CELL_SIZE, BOARD_PADDING + 9 * CELL_SIZE);
    ctx.stroke();
    
    // 绘制"楚河汉界"
    const riverFontSize = Math.floor(CELL_SIZE * 0.33);
    ctx.font = `bold ${riverFontSize}px Arial`;
    ctx.fillStyle = '#8B4513';
    ctx.textAlign = 'center';
    ctx.fillText('楚河', BOARD_PADDING + 2 * CELL_SIZE, BOARD_PADDING + 4.6 * CELL_SIZE);
    ctx.fillText('汉界', BOARD_PADDING + 6 * CELL_SIZE, BOARD_PADDING + 4.6 * CELL_SIZE);
        
    // 绘制将军提示
    if (gameStatus === 'check') {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)');
          
      ctx.fillStyle = gradient;
      const checkFontSize = Math.floor(CELL_SIZE * 0.6);
      ctx.font = `bold ${checkFontSize}px SimHei, "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillText('将军！', width / 2, BOARD_PADDING / 2);
          
      // 清除阴影效果
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
        
    // 绘制绝杀提示
    if (gameStatus === 'checkmate' && winner) {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.95)');
      gradient.addColorStop(0.5, 'rgba(255, 165, 0, 1)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0.95)');
          
      ctx.fillStyle = gradient;
      const winFontSize = Math.floor(CELL_SIZE * 0.8);
      ctx.font = `bold ${winFontSize}px SimHei, "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.fillText(`${winner === 'red' ? '红方' : '黑方'}获胜！`, width / 2, height / 2);
          
      // 清除阴影效果
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
        
    // 绘制错误提示（不能送将等）
    if (errorMessage) {
      // 绘制半透明背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, width, height);
          
      // 绘制错误消息
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(255, 50, 50, 0.95)');
      gradient.addColorStop(0.5, 'rgba(255, 0, 0, 1)');
      gradient.addColorStop(1, 'rgba(255, 50, 50, 0.95)');
          
      ctx.fillStyle = gradient;
      const errorFontSize = Math.floor(CELL_SIZE * 0.67);
      ctx.font = `bold ${errorFontSize}px SimHei, "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillText(errorMessage, width / 2, height / 2);
          
      // 清除阴影效果
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // 绘制合法移动提示
    legalMoves.forEach(([row, col]) => {
      const displayRow = shouldFlip ? (9 - row) : row;
      const x = BOARD_PADDING + col * CELL_SIZE;
      const y = BOARD_PADDING + displayRow * CELL_SIZE;
      
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // 绘制棋子
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        const piece = board[row][col];
        if (piece) {
          const displayRow = shouldFlip ? (9 - row) : row;
          const x = BOARD_PADDING + col * CELL_SIZE;
          const y = BOARD_PADDING + displayRow * CELL_SIZE;
          
          // 选中效果
          const isSelected = selectedPiece && selectedPiece.row === row && selectedPiece.col === col;
          
          // 绘制棋子圆形
          ctx.beginPath();
          ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = piece.color === 'red' ? '#FFF' : '#000';
          ctx.fill();
          ctx.strokeStyle = piece.color === 'red' ? '#8B0000' : '#000';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // 选中高亮
          if (isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.stroke();
          }
          
          // 绘制文字
          const pieceFontSize = Math.floor(CELL_SIZE * 0.4);
          ctx.font = `bold ${pieceFontSize}px SimHei, "Microsoft YaHei", sans-serif`;
          ctx.fillStyle = piece.color === 'red' ? '#8B0000' : '#FFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(PIECE_NAMES[piece.color][piece.type], x, y);
        }
      }
    }
  };
  
  // 处理点击/触摸事件
  const handleClick = (e) => {
    if (disabled) return; // 如果禁用则不响应点击
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // 支持触摸和鼠标事件
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // 考虑 canvas 的实际显示大小与内部大小的比例
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    // 根据玩家颜色决定是否翻转棋盘
    const shouldFlip = playerColor === 'black';
    
    // 转换为棋盘坐标
    const col = Math.round((x - BOARD_PADDING) / CELL_SIZE);
    const displayRow = Math.round((y - BOARD_PADDING) / CELL_SIZE);
    const row = shouldFlip ? (9 - displayRow) : displayRow;
    
    if (row < 0 || row >= 10 || col < 0 || col >= 9) return;
    
    // 如果已选中棋子，尝试移动
    if (selectedPiece) {
      const isLegalMove = legalMoves.some(([r, c]) => r === row && c === col);
      
      if (isLegalMove) {
        onMove(selectedPiece.row, selectedPiece.col, row, col);
        setSelectedPiece(null);
        setLegalMoves([]);
      } else {
        // 选择新棋子
        const piece = board[row][col];
        if (piece && piece.color === currentPlayer) {
          setSelectedPiece({ row, col });
          setLegalMoves(getLegalMoves(board, row, col));
        } else {
          setSelectedPiece(null);
          setLegalMoves([]);
        }
      }
    } else {
      // 选择棋子
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        setSelectedPiece({ row, col });
        setLegalMoves(getLegalMoves(board, row, col));
      }
    }
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={CELL_SIZE * 8 + BOARD_PADDING * 2}
      height={CELL_SIZE * 9 + BOARD_PADDING * 2}
      onClick={handleClick}
      onTouchStart={(e) => {
        // 只在单指触摸时触发点击，双指用于缩放
        if (e.touches.length === 1) {
          e.preventDefault();
          handleClick(e);
        }
      }}
      style={{ 
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '2px solid #8B4513',
        borderRadius: '4px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        opacity: disabled ? 0.7 : 1,
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: '0 auto'
      }}
    />
  );
};

export default ChessBoard;
