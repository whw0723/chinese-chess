import { PIECE_TYPES, getLegalMoves, movePiece, isInCheck, isCheckmate } from './gameLogic';

// 棋子价值表
const PIECE_VALUES = {
  [PIECE_TYPES.ROOK]: 600,
  [PIECE_TYPES.KNIGHT]: 400,
  [PIECE_TYPES.CANNON]: 450,
  [PIECE_TYPES.BISHOP]: 200,
  [PIECE_TYPES.ADVISOR]: 200,
  [PIECE_TYPES.KING]: 10000,
  [PIECE_TYPES.PAWN]: 100
};

// 位置奖励表 - 车
const ROOK_POSITION_BONUS = [
  [206, 208, 207, 213, 214, 213, 207, 208, 206],
  [206, 212, 209, 216, 233, 216, 209, 212, 206],
  [206, 208, 207, 214, 216, 214, 207, 208, 206],
  [206, 213, 213, 216, 216, 216, 213, 213, 206],
  [208, 211, 211, 214, 215, 214, 211, 211, 208],
  [208, 212, 212, 214, 215, 214, 212, 212, 208],
  [204, 209, 204, 212, 214, 212, 204, 209, 204],
  [198, 208, 204, 212, 212, 212, 204, 208, 198],
  [200, 208, 206, 212, 200, 212, 206, 208, 200],
  [194, 206, 204, 212, 200, 212, 204, 206, 194]
];

// 位置奖励表 - 马
const KNIGHT_POSITION_BONUS = [
  [90, 90, 90, 96, 90, 96, 90, 90, 90],
  [90, 96, 103, 97, 94, 97, 103, 96, 90],
  [92, 98, 99, 103, 99, 103, 99, 98, 92],
  [93, 108, 100, 107, 100, 107, 100, 108, 93],
  [90, 100, 99, 103, 104, 103, 99, 100, 90],
  [90, 98, 101, 102, 103, 102, 101, 98, 90],
  [92, 94, 98, 95, 98, 95, 98, 94, 92],
  [93, 92, 94, 95, 92, 95, 94, 92, 93],
  [85, 90, 92, 93, 78, 93, 92, 90, 85],
  [88, 85, 90, 88, 90, 88, 90, 85, 88]
];

// 位置奖励表 - 炮
const CANNON_POSITION_BONUS = [
  [100, 100, 96, 91, 90, 91, 96, 100, 100],
  [98, 98, 96, 92, 89, 92, 96, 98, 98],
  [97, 97, 96, 91, 92, 91, 96, 97, 97],
  [96, 99, 99, 98, 100, 98, 99, 99, 96],
  [96, 96, 96, 96, 100, 96, 96, 96, 96],
  [95, 96, 99, 96, 100, 96, 99, 96, 95],
  [96, 96, 96, 96, 96, 96, 96, 96, 96],
  [97, 96, 100, 99, 101, 99, 100, 96, 97],
  [96, 97, 98, 98, 98, 98, 98, 97, 96],
  [96, 96, 97, 99, 99, 99, 97, 96, 96]
];

// 位置奖励表 - 兵/卒
const PAWN_POSITION_BONUS = [
  [9, 9, 9, 11, 13, 11, 9, 9, 9],
  [19, 24, 34, 42, 44, 42, 34, 24, 19],
  [19, 24, 32, 37, 37, 37, 32, 24, 19],
  [19, 23, 27, 29, 30, 29, 27, 23, 19],
  [14, 18, 20, 27, 29, 27, 20, 18, 14],
  [7, 0, 13, 0, 16, 0, 13, 0, 7],
  [7, 0, 7, 0, 15, 0, 7, 0, 7],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// 位置奖励表 - 士
const ADVISOR_POSITION_BONUS = [
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
  [0, 0, 0, 0, 23, 0, 0, 0, 0],
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
  [0, 0, 0, 0, 23, 0, 0, 0, 0],
  [0, 0, 0, 20, 0, 20, 0, 0, 0]
];

// 位置奖励表 - 象/相
const BISHOP_POSITION_BONUS = [
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [18, 0, 0, 0, 23, 0, 0, 0, 18],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [18, 0, 0, 0, 23, 0, 0, 0, 18],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 20, 0, 0, 0, 20, 0, 0]
];

// 位置奖励表 - 将/帅
const KING_POSITION_BONUS = [
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0]
];

// 获取棋子在特定位置的奖励分数
function getPositionBonus(piece, row, col) {
  if (!piece) return 0;
  
  // 黑方需要翻转行坐标
  const r = piece.color === 'black' ? row : (9 - row);
  
  let bonus = 0;
  switch (piece.type) {
    case PIECE_TYPES.ROOK:
      bonus = ROOK_POSITION_BONUS[r][col];
      break;
    case PIECE_TYPES.KNIGHT:
      bonus = KNIGHT_POSITION_BONUS[r][col];
      break;
    case PIECE_TYPES.CANNON:
      bonus = CANNON_POSITION_BONUS[r][col];
      break;
    case PIECE_TYPES.PAWN:
      bonus = PAWN_POSITION_BONUS[r][col];
      break;
    case PIECE_TYPES.ADVISOR:
      bonus = ADVISOR_POSITION_BONUS[r][col];
      break;
    case PIECE_TYPES.BISHOP:
      bonus = BISHOP_POSITION_BONUS[r][col];
      break;
    case PIECE_TYPES.KING:
      bonus = KING_POSITION_BONUS[r][col];
      break;
  }
  
  return bonus;
}

// 评估局面分数
export function evaluateBoard(board, aiColor) {
  let score = 0;
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type];
        const positionBonus = getPositionBonus(piece, row, col);
        const totalValue = pieceValue + positionBonus;
        
        if (piece.color === aiColor) {
          score += totalValue;
        } else {
          score -= totalValue;
        }
      }
    }
  }
  
  // 被将军扣分
  if (isInCheck(board, aiColor)) {
    score -= 50;
  }
  
  const opponentColor = aiColor === 'red' ? 'black' : 'red';
  if (isInCheck(board, opponentColor)) {
    score += 50;
  }
  
  return score;
}

// 获取所有可能的移动
function getAllPossibleMoves(board, color) {
  const moves = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const legalMoves = getLegalMoves(board, row, col);
        legalMoves.forEach(([toRow, toCol]) => {
          // 检查移动后是否会导致自己被将军
          const newBoard = movePiece(board, row, col, toRow, toCol);
          if (!isInCheck(newBoard, color)) {
            moves.push({
              from: [row, col],
              to: [toRow, toCol],
              piece: piece
            });
          }
        });
      }
    }
  }
  
  return moves;
}

// 移动排序优化 - 优先考虑吃子和威胁移动
function sortMoves(board, moves) {
  return moves.sort((a, b) => {
    const [aToRow, aToCol] = a.to;
    const [bToRow, bToCol] = b.to;
    
    // 优先考虑吃子
    const aCapture = board[aToRow][aToCol] ? PIECE_VALUES[board[aToRow][aToCol].type] : 0;
    const bCapture = board[bToRow][bToCol] ? PIECE_VALUES[board[bToRow][bToCol].type] : 0;
    
    if (aCapture !== bCapture) {
      return bCapture - aCapture;
    }
    
    // 其次考虑位置奖励
    const aBonus = getPositionBonus(a.piece, aToRow, aToCol);
    const bBonus = getPositionBonus(b.piece, bToRow, bToCol);
    
    return bBonus - aBonus;
  });
}

// Alpha-Beta剪枝的极大极小算法
function minimax(board, depth, alpha, beta, isMaximizing, aiColor) {
  const opponentColor = aiColor === 'red' ? 'black' : 'red';
  
  // 检查游戏结束
  if (isCheckmate(board, aiColor)) {
    return -100000;
  }
  if (isCheckmate(board, opponentColor)) {
    return 100000;
  }
  
  // 达到搜索深度
  if (depth === 0) {
    return evaluateBoard(board, aiColor);
  }
  
  const currentColor = isMaximizing ? aiColor : opponentColor;
  let moves = getAllPossibleMoves(board, currentColor);
  
  // 如果没有合法移动，返回评估值
  if (moves.length === 0) {
    return evaluateBoard(board, aiColor);
  }
  
  // 移动排序优化
  moves = sortMoves(board, moves);
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    
    for (const move of moves) {
      const [fromRow, fromCol] = move.from;
      const [toRow, toCol] = move.to;
      const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
      
      const evaluation = minimax(newBoard, depth - 1, alpha, beta, false, aiColor);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      
      if (beta <= alpha) {
        break; // Beta剪枝
      }
    }
    
    return maxEval;
  } else {
    let minEval = Infinity;
    
    for (const move of moves) {
      const [fromRow, fromCol] = move.from;
      const [toRow, toCol] = move.to;
      const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
      
      const evaluation = minimax(newBoard, depth - 1, alpha, beta, true, aiColor);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      
      if (beta <= alpha) {
        break; // Alpha剪枝
      }
    }
    
    return minEval;
  }
}

// AI计算最佳移动
export function calculateBestMove(board, aiColor, difficulty = 'medium') {
  // 根据难度设置搜索深度
  const depthMap = {
    easy: 1,
    medium: 2,
    hard: 3
  };
  
  const searchDepth = depthMap[difficulty] || 2;
  
  let moves = getAllPossibleMoves(board, aiColor);
  
  if (moves.length === 0) {
    return null;
  }
  
  // 移动排序
  moves = sortMoves(board, moves);
  
  let bestMove = null;
  let bestValue = -Infinity;
  
  for (const move of moves) {
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;
    const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
    
    const moveValue = minimax(newBoard, searchDepth - 1, -Infinity, Infinity, false, aiColor);
    
    if (moveValue > bestValue) {
      bestValue = moveValue;
      bestMove = move;
    }
  }
  
  return bestMove;
}
