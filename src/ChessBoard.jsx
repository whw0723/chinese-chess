import { useEffect, useRef, useState } from 'react';
import { PIECE_NAMES, getLegalMoves } from './gameLogic';

const ChessBoard = ({ board, onMove, currentPlayer, disabled = false }) => {
  const canvasRef = useRef(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  
  const CELL_SIZE = 60;
  const BOARD_PADDING = 40;
  const PIECE_RADIUS = 24;
  
  useEffect(() => {
    drawBoard();
  }, [board, selectedPiece, legalMoves]);
  
  // 绘制棋盘
  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = CELL_SIZE * 8 + BOARD_PADDING * 2;
    const height = CELL_SIZE * 9 + BOARD_PADDING * 2;
    
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
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#8B4513';
    ctx.textAlign = 'center';
    ctx.fillText('楚河', BOARD_PADDING + 2 * CELL_SIZE, BOARD_PADDING + 4.6 * CELL_SIZE);
    ctx.fillText('汉界', BOARD_PADDING + 6 * CELL_SIZE, BOARD_PADDING + 4.6 * CELL_SIZE);
    
    // 绘制合法移动提示
    legalMoves.forEach(([row, col]) => {
      const x = BOARD_PADDING + col * CELL_SIZE;
      const y = BOARD_PADDING + row * CELL_SIZE;
      
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
          const x = BOARD_PADDING + col * CELL_SIZE;
          const y = BOARD_PADDING + row * CELL_SIZE;
          
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
          ctx.font = 'bold 24px SimHei, "Microsoft YaHei", sans-serif';
          ctx.fillStyle = piece.color === 'red' ? '#8B0000' : '#FFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(PIECE_NAMES[piece.color][piece.type], x, y);
        }
      }
    }
  };
  
  // 处理点击事件
  const handleClick = (e) => {
    if (disabled) return; // 如果禁用则不响应点击
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 转换为棋盘坐标
    const col = Math.round((x - BOARD_PADDING) / CELL_SIZE);
    const row = Math.round((y - BOARD_PADDING) / CELL_SIZE);
    
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
      style={{ 
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '2px solid #8B4513',
        borderRadius: '4px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        opacity: disabled ? 0.7 : 1
      }}
    />
  );
};

export default ChessBoard;
