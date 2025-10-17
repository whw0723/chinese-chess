import { PIECE_TYPES, getLegalMoves, movePiece, isInCheck, isCheckmate } from './gameLogic';

// 常量定义
const MATE_VALUE = 10000;  // 将死分值
const WIN_VALUE = MATE_VALUE - 200;  // 胜利分值
const LIMIT_DEPTH = 12;  // 最大搜索深度
const NULL_DEPTH = 2;  // 空步裁剪深度
const RANDOMNESS = 8;  // 随机性

// Hash表标志
const HASH_ALPHA = 1;
const HASH_BETA = 2;
const HASH_PV = 3;

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

// 静态搜索 - 只搜索吃子和将军的局面
function searchQuiescence(board, alpha, beta, aiColor, depth, maxDepth) {
  // 防止静态搜索过深
  if (depth >= maxDepth + 6) {
    return evaluateBoard(board, aiColor);
  }
  
  const opponentColor = aiColor === 'red' ? 'black' : 'red';
  
  // 检查游戏结束
  if (isCheckmate(board, aiColor)) {
    return -MATE_VALUE + depth;
  }
  if (isCheckmate(board, opponentColor)) {
    return MATE_VALUE - depth;
  }
  
  let standPat = evaluateBoard(board, aiColor);
  
  // 被将军时必须搜索所有走法
  if (!isInCheck(board, aiColor)) {
    if (standPat >= beta) {
      return beta;
    }
    if (alpha < standPat) {
      alpha = standPat;
    }
  }
  
  // 生成所有吃子走法和将军走法
  const moves = isInCheck(board, aiColor) ? 
    getAllPossibleMoves(board, aiColor) :
    getCaptureMoves(board, aiColor);
    
  if (moves.length === 0) {
    return standPat;
  }
  
  // 移动排序
  const sortedMoves = sortMoves(board, moves);
  
  for (const move of sortedMoves) {
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;
    const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
    
    // 如果这步棋导致自己被将军，跳过
    if (isInCheck(newBoard, aiColor)) {
      continue;
    }
    
    const score = -searchQuiescence(newBoard, -beta, -alpha, opponentColor, depth + 1, maxDepth);
    
    if (score >= beta) {
      return beta;
    }
    if (score > alpha) {
      alpha = score;
    }
  }
  
  return alpha;
}

// 获取所有吃子走法
function getCaptureMoves(board, color) {
  const moves = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const legalMoves = getLegalMoves(board, row, col);
        legalMoves.forEach(([toRow, toCol]) => {
          // 只考虑吃子走法
          if (board[toRow][toCol]) {
            const newBoard = movePiece(board, row, col, toRow, toCol);
            if (!isInCheck(newBoard, color)) {
              moves.push({
                from: [row, col],
                to: [toRow, toCol],
                piece: piece,
                captureValue: PIECE_VALUES[board[toRow][toCol].type]
              });
            }
          }
        });
      }
    }
  }
  
  return moves;
}

// Alpha-Beta剪枝的极大极小算法（增强版）
function minimax(board, depth, alpha, beta, aiColor, searchState, maxDepth) {
  const opponentColor = aiColor === 'red' ? 'black' : 'red';
  
  // 检查游戏结束
  if (isCheckmate(board, aiColor)) {
    return -MATE_VALUE + (maxDepth - depth);
  }
  if (isCheckmate(board, opponentColor)) {
    return MATE_VALUE - (maxDepth - depth);
  }
  
  // 达到搜索深度，进入静态搜索
  if (depth === 0) {
    return searchQuiescence(board, alpha, beta, aiColor, 0, maxDepth);
  }
  
  // 检查置换表
  const hashKey = getBoardHash(board);
  const hashEntry = searchState.hashTable.get(hashKey);
  if (hashEntry && hashEntry.depth >= depth) {
    if (hashEntry.flag === HASH_PV) {
      return hashEntry.value;
    }
    if (hashEntry.flag === HASH_ALPHA && hashEntry.value <= alpha) {
      return alpha;
    }
    if (hashEntry.flag === HASH_BETA && hashEntry.value >= beta) {
      return beta;
    }
  }
  
  let moves = getAllPossibleMoves(board, aiColor);
  
  // 如果没有合法移动
  if (moves.length === 0) {
    return evaluateBoard(board, aiColor);
  }
  
  // 移动排序优化（使用历史表和杀手走法）
  moves = sortMovesAdvanced(board, moves, searchState, depth, hashEntry);
  
  let bestValue = -MATE_VALUE;
  let bestMove = null;
  let hashFlag = HASH_ALPHA;
  
  for (const move of moves) {
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;
    const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
    
    let value;
    
    // PVS (Principal Variation Search)
    if (bestValue === -MATE_VALUE) {
      // 第一个走法，完全窗口搜索
      value = -minimax(newBoard, depth - 1, -beta, -alpha, opponentColor, searchState, maxDepth);
    } else {
      // 后续走法，先用窄窗口搜索
      value = -minimax(newBoard, depth - 1, -alpha - 1, -alpha, opponentColor, searchState, maxDepth);
      // 如果证明这步可能更好，重新用完全窗口搜索
      if (value > alpha && value < beta) {
        value = -minimax(newBoard, depth - 1, -beta, -alpha, opponentColor, searchState, maxDepth);
      }
    }
    
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
      
      if (value > alpha) {
        alpha = value;
        hashFlag = HASH_PV;
        
        // 更新历史表
        const historyKey = getMoveKey(move);
        searchState.historyTable.set(historyKey, 
          (searchState.historyTable.get(historyKey) || 0) + depth * depth);
      }
      
      if (alpha >= beta) {
        hashFlag = HASH_BETA;
        // 更新杀手走法
        if (!searchState.killerMoves[depth]) {
          searchState.killerMoves[depth] = [];
        }
        if (searchState.killerMoves[depth].length < 2) {
          searchState.killerMoves[depth].unshift(move);
        } else if (!movesEqual(searchState.killerMoves[depth][0], move)) {
          searchState.killerMoves[depth][1] = searchState.killerMoves[depth][0];
          searchState.killerMoves[depth][0] = move;
        }
        break; // Beta剪枝
      }
    }
  }
  
  // 保存到置换表
  searchState.hashTable.set(hashKey, {
    depth: depth,
    value: bestValue,
    flag: hashFlag,
    bestMove: bestMove
  });
  
  return bestValue;
}

// 获取棋盘哈希键
function getBoardHash(board) {
  let hash = '';
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece) {
        hash += `${row}${col}${piece.type}${piece.color}`;
      }
    }
  }
  return hash;
}

// 获取走法键
function getMoveKey(move) {
  return `${move.from[0]},${move.from[1]}-${move.to[0]},${move.to[1]}`;
}

// 比较两个走法是否相等
function movesEqual(move1, move2) {
  if (!move1 || !move2) return false;
  return move1.from[0] === move2.from[0] && 
         move1.from[1] === move2.from[1] &&
         move1.to[0] === move2.to[0] && 
         move1.to[1] === move2.to[1];
}

// 高级移动排序（使用历史表和杀手走法）
function sortMovesAdvanced(board, moves, searchState, depth, hashEntry) {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    // Hash表中的最佳走法优先级最高
    if (hashEntry && hashEntry.bestMove) {
      if (movesEqual(a, hashEntry.bestMove)) scoreA += 100000;
      if (movesEqual(b, hashEntry.bestMove)) scoreB += 100000;
    }
    
    // 杀手走法次优先
    if (searchState.killerMoves[depth]) {
      if (movesEqual(a, searchState.killerMoves[depth][0])) scoreA += 90000;
      if (movesEqual(b, searchState.killerMoves[depth][0])) scoreB += 90000;
      if (searchState.killerMoves[depth][1]) {
        if (movesEqual(a, searchState.killerMoves[depth][1])) scoreA += 89000;
        if (movesEqual(b, searchState.killerMoves[depth][1])) scoreB += 89000;
      }
    }
    
    // 吃子走法
    const [aToRow, aToCol] = a.to;
    const [bToRow, bToCol] = b.to;
    const aCapture = board[aToRow][aToCol] ? PIECE_VALUES[board[aToRow][aToCol].type] : 0;
    const bCapture = board[bToRow][bToCol] ? PIECE_VALUES[board[bToRow][bToCol].type] : 0;
    scoreA += aCapture;
    scoreB += bCapture;
    
    // 历史表分数
    const historyKeyA = getMoveKey(a);
    const historyKeyB = getMoveKey(b);
    scoreA += searchState.historyTable.get(historyKeyA) || 0;
    scoreB += searchState.historyTable.get(historyKeyB) || 0;
    
    // 位置奖励
    scoreA += getPositionBonus(a.piece, aToRow, aToCol);
    scoreB += getPositionBonus(b.piece, bToRow, bToCol);
    
    return scoreB - scoreA;
  });
}

// AI计算最佳移动（增强版 - 使用迭代加深）
export function calculateBestMove(board, aiColor, difficulty = 'medium') {
  // 根据难度设置搜索深度和时间限制
  const settingsMap = {
    easy: { maxDepth: 2, timeLimit: 500 },
    medium: { maxDepth: 4, timeLimit: 2000 },
    hard: { maxDepth: 6, timeLimit: 5000 }
  };
  
  const settings = settingsMap[difficulty] || settingsMap.medium;
  const startTime = Date.now();
  
  let moves = getAllPossibleMoves(board, aiColor);
  
  if (moves.length === 0) {
    return null;
  }
  
  // 初始化搜索状态
  const searchState = {
    hashTable: new Map(),
    historyTable: new Map(),
    killerMoves: {},
    nodesSearched: 0
  };
  
  let bestMove = null;
  let bestValue = -MATE_VALUE;
  
  // 迭代加深搜索
  for (let depth = 1; depth <= settings.maxDepth; depth++) {
    const opponentColor = aiColor === 'red' ? 'black' : 'red';
    
    // 移动排序（每次迭代都会利用之前的信息）
    moves = sortMovesAdvanced(board, moves, searchState, depth, null);
    
    let currentBest = null;
    let currentValue = -MATE_VALUE;
    let alpha = -MATE_VALUE;
    const beta = MATE_VALUE;
    
    for (const move of moves) {
      const [fromRow, fromCol] = move.from;
      const [toRow, toCol] = move.to;
      const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
      
      searchState.nodesSearched++;
      
      let value;
      if (currentBest === null) {
        // 第一个走法
        value = -minimax(newBoard, depth - 1, -beta, -alpha, opponentColor, searchState, depth);
      } else {
        // PVS优化
        value = -minimax(newBoard, depth - 1, -alpha - 1, -alpha, opponentColor, searchState, depth);
        if (value > alpha && value < beta) {
          value = -minimax(newBoard, depth - 1, -beta, -alpha, opponentColor, searchState, depth);
        }
      }
      
      if (value > currentValue) {
        currentValue = value;
        currentBest = move;
        
        if (value > alpha) {
          alpha = value;
        }
      }
      
      // 检查时间限制
      if (Date.now() - startTime > settings.timeLimit) {
        break;
      }
    }
    
    // 更新最佳走法
    if (currentBest) {
      bestMove = currentBest;
      bestValue = currentValue;
      
      // 添加一些随机性（避免每次走法完全相同）
      if (bestValue > -WIN_VALUE && bestValue < WIN_VALUE) {
        bestValue += Math.floor(Math.random() * RANDOMNESS) - Math.floor(Math.random() * RANDOMNESS);
      }
    }
    
    // 如果找到必胜或必败的走法，提前结束
    if (Math.abs(bestValue) > WIN_VALUE) {
      break;
    }
    
    // 检查时间限制
    if (Date.now() - startTime > settings.timeLimit) {
      break;
    }
  }
  
  console.log(`AI搜索完成: 深度=${settings.maxDepth}, 节点数=${searchState.nodesSearched}, 用时=${Date.now() - startTime}ms, 评估值=${bestValue}`);
  
  return bestMove;
}
