// 搜索引擎 - 参考 XQlightweight 实现

import {
  Position,
  MATE_VALUE,
  WIN_VALUE,
  BAN_VALUE,
  SRC,
  DST,
  HOME_HALF
} from './position.js';

// Shell 排序步长
const SHELL_STEP = [0, 1, 4, 13, 40, 121, 364, 1093];

// Shell 排序
function shellSort(mvs, vls) {
  let stepLevel = 1;
  while (SHELL_STEP[stepLevel] < mvs.length) {
    stepLevel++;
  }
  stepLevel--;
  while (stepLevel > 0) {
    const step = SHELL_STEP[stepLevel];
    for (let i = step; i < mvs.length; i++) {
      const mvBest = mvs[i];
      const vlBest = vls[i];
      let j = i - step;
      while (j >= 0 && vlBest > vls[j]) {
        mvs[j + step] = mvs[j];
        vls[j + step] = vls[j];
        j -= step;
      }
      mvs[j + step] = mvBest;
      vls[j + step] = vlBest;
    }
    stepLevel--;
  }
}

// 走法排序阶段
const PHASE_HASH = 0;
const PHASE_KILLER_1 = 1;
const PHASE_KILLER_2 = 2;
const PHASE_GEN_MOVES = 3;
const PHASE_REST = 4;

// 走法排序类
class MoveSort {
  constructor(mvHash, pos, killerTable, historyTable) {
    this.mvs = [];
    this.vls = [];
    this.mvHash = this.mvKiller1 = this.mvKiller2 = 0;
    this.pos = pos;
    this.historyTable = historyTable;
    this.phase = PHASE_HASH;
    this.index = 0;
    this.singleReply = false;

    if (pos.inCheck()) {
      this.phase = PHASE_REST;
      const mvsAll = pos.generateMoves(null);
      for (const mv of mvsAll) {
        if (!pos.makeMove(mv)) continue;
        pos.undoMakeMove();
        this.mvs.push(mv);
        this.vls.push(mv === mvHash ? 0x7fffffff : historyTable[pos.historyIndex(mv)]);
      }
      shellSort(this.mvs, this.vls);
      this.singleReply = this.mvs.length === 1;
    } else {
      this.mvHash = mvHash;
      this.mvKiller1 = killerTable[pos.distance][0];
      this.mvKiller2 = killerTable[pos.distance][1];
    }
  }

  next() {
    switch (this.phase) {
      case PHASE_HASH:
        this.phase = PHASE_KILLER_1;
        if (this.mvHash > 0) {
          return this.mvHash;
        }
      // No break
      // eslint-disable-next-line no-fallthrough
      case PHASE_KILLER_1:
        this.phase = PHASE_KILLER_2;
        if (this.mvKiller1 !== this.mvHash && this.mvKiller1 > 0 && this.pos.legalMove(this.mvKiller1)) {
          return this.mvKiller1;
        }
      // No break
      // eslint-disable-next-line no-fallthrough
      case PHASE_KILLER_2:
        this.phase = PHASE_GEN_MOVES;
        if (this.mvKiller2 !== this.mvHash && this.mvKiller2 > 0 && this.pos.legalMove(this.mvKiller2)) {
          return this.mvKiller2;
        }
      // No break
      // eslint-disable-next-line no-fallthrough
      case PHASE_GEN_MOVES:
        this.phase = PHASE_REST;
        this.mvs = this.pos.generateMoves(null);
        this.vls = [];
        for (const mv of this.mvs) {
          this.vls.push(this.historyTable[this.pos.historyIndex(mv)]);
        }
        shellSort(this.mvs, this.vls);
        this.index = 0;
      // No break
      // eslint-disable-next-line no-fallthrough
      default:
        while (this.index < this.mvs.length) {
          const mv = this.mvs[this.index];
          this.index++;
          if (mv !== this.mvHash && mv !== this.mvKiller1 && mv !== this.mvKiller2) {
            return mv;
          }
        }
    }
    return 0;
  }
}

export const LIMIT_DEPTH = 64;
const NULL_DEPTH = 2;
const RANDOMNESS = 8;

const HASH_ALPHA = 1;
const HASH_BETA = 2;
const HASH_PV = 3;

// 搜索类
export class Search {
  constructor(pos, hashLevel) {
    this.hashMask = (1 << hashLevel) - 1;
    this.pos = pos;
    this.mvResult = 0;
    this.allMillis = 0;
    this.hashTable = [];
    this.historyTable = [];
    this.allNodes = 0;
    this.killerTable = [];
  }

  getHashItem() {
    return this.hashTable[this.pos.zobristKey & this.hashMask];
  }

  probeHash(vlAlpha, vlBeta, depth, mv) {
    const hash = this.getHashItem();
    if (hash.zobristLock !== this.pos.zobristLock) {
      mv[0] = 0;
      return -MATE_VALUE;
    }
    mv[0] = hash.mv;
    let mate = false;
    let vl = hash.vl;
    if (vl > WIN_VALUE) {
      if (vl <= BAN_VALUE) {
        return -MATE_VALUE;
      }
      vl -= this.pos.distance;
      mate = true;
    } else if (vl < -WIN_VALUE) {
      if (vl >= -BAN_VALUE) {
        return -MATE_VALUE;
      }
      vl += this.pos.distance;
      mate = true;
    } else if (vl === this.pos.drawValue()) {
      return -MATE_VALUE;
    }
    if (hash.depth < depth && !mate) {
      return -MATE_VALUE;
    }
    if (hash.flag === HASH_BETA) {
      return (vl >= vlBeta ? vl : -MATE_VALUE);
    }
    if (hash.flag === HASH_ALPHA) {
      return (vl <= vlAlpha ? vl : -MATE_VALUE);
    }
    return vl;
  }

  recordHash(flag, vl, depth, mv) {
    const hash = this.getHashItem();
    if (hash.depth > depth) {
      return;
    }
    hash.flag = flag;
    hash.depth = depth;
    if (vl > WIN_VALUE) {
      if (mv === 0 && vl <= BAN_VALUE) {
        return;
      }
      hash.vl = vl + this.pos.distance;
    } else if (vl < -WIN_VALUE) {
      if (mv === 0 && vl >= -BAN_VALUE) {
        return;
      }
      hash.vl = vl - this.pos.distance;
    } else if (vl === this.pos.drawValue() && mv === 0) {
      return;
    } else {
      hash.vl = vl;
    }
    hash.mv = mv;
    hash.zobristLock = this.pos.zobristLock;
  }

  setBestMove(mv, depth) {
    this.historyTable[this.pos.historyIndex(mv)] += depth * depth;
    const mvsKiller = this.killerTable[this.pos.distance];
    if (mvsKiller[0] !== mv) {
      mvsKiller[1] = mvsKiller[0];
      mvsKiller[0] = mv;
    }
  }

  searchQuiesc(vlAlpha_, vlBeta) {
    let vlAlpha = vlAlpha_;
    this.allNodes++;
    let vl = this.pos.mateValue();
    if (vl >= vlBeta) {
      return vl;
    }
    const vlRep = this.pos.repStatus(1);
    if (vlRep > 0) {
      return this.pos.repValue(vlRep);
    }
    if (this.pos.distance === LIMIT_DEPTH) {
      return this.pos.evaluate();
    }
    let vlBest = -MATE_VALUE;
    let mvs = [];
    const vls = [];
    if (this.pos.inCheck()) {
      mvs = this.pos.generateMoves(null);
      for (const mv of mvs) {
        vls.push(this.historyTable[this.pos.historyIndex(mv)]);
      }
      shellSort(mvs, vls);
    } else {
      vl = this.pos.evaluate();
      if (vl > vlBest) {
        if (vl >= vlBeta) {
          return vl;
        }
        vlBest = vl;
        vlAlpha = Math.max(vl, vlAlpha);
      }
      mvs = this.pos.generateMoves(vls);
      shellSort(mvs, vls);
      for (let i = 0; i < mvs.length; i++) {
        if (vls[i] < 10 || (vls[i] < 20 && HOME_HALF(DST(mvs[i]), this.pos.sdPlayer))) {
          mvs.length = i;
          break;
        }
      }
    }
    for (const mv of mvs) {
      if (!this.pos.makeMove(mv)) {
        continue;
      }
      vl = -this.searchQuiesc(-vlBeta, -vlAlpha);
      this.pos.undoMakeMove();
      if (vl > vlBest) {
        if (vl >= vlBeta) {
          return vl;
        }
        vlBest = vl;
        vlAlpha = Math.max(vl, vlAlpha);
      }
    }
    return vlBest === -MATE_VALUE ? this.pos.mateValue() : vlBest;
  }

  searchFull(vlAlpha_, vlBeta, depth, noNull) {
    let vlAlpha = vlAlpha_;
    if (depth <= 0) {
      return this.searchQuiesc(vlAlpha, vlBeta);
    }
    this.allNodes++;
    let vl = this.pos.mateValue();
    if (vl >= vlBeta) {
      return vl;
    }
    const vlRep = this.pos.repStatus(1);
    if (vlRep > 0) {
      return this.pos.repValue(vlRep);
    }
    const mvHash = [0];
    vl = this.probeHash(vlAlpha, vlBeta, depth, mvHash);
    if (vl > -MATE_VALUE) {
      return vl;
    }
    if (this.pos.distance === LIMIT_DEPTH) {
      return this.pos.evaluate();
    }
    if (!noNull && !this.pos.inCheck() && this.pos.nullOkay()) {
      this.pos.nullMove();
      vl = -this.searchFull(-vlBeta, 1 - vlBeta, depth - NULL_DEPTH - 1, true);
      this.pos.undoNullMove();
      if (vl >= vlBeta && (this.pos.nullSafe() ||
          this.searchFull(vlAlpha, vlBeta, depth - NULL_DEPTH, true) >= vlBeta)) {
        return vl;
      }
    }
    let hashFlag = HASH_ALPHA;
    let vlBest = -MATE_VALUE;
    let mvBest = 0;
    const sort = new MoveSort(mvHash[0], this.pos, this.killerTable, this.historyTable);
    while (true) {
      const mv = sort.next();
      if (mv <= 0) {
        break;
      }
      if (!this.pos.makeMove(mv)) {
        continue;
      }
      const newDepth = this.pos.inCheck() || sort.singleReply ? depth : depth - 1;
      if (vlBest === -MATE_VALUE) {
        vl = -this.searchFull(-vlBeta, -vlAlpha, newDepth, false);
      } else {
        vl = -this.searchFull(-vlAlpha - 1, -vlAlpha, newDepth, false);
        if (vl > vlAlpha && vl < vlBeta) {
          vl = -this.searchFull(-vlBeta, -vlAlpha, newDepth, false);
        }
      }
      this.pos.undoMakeMove();
      if (vl > vlBest) {
        vlBest = vl;
        if (vl >= vlBeta) {
          hashFlag = HASH_BETA;
          mvBest = mv;
          break;
        }
        if (vl > vlAlpha) {
          vlAlpha = vl;
          hashFlag = HASH_PV;
          mvBest = mv;
        }
      }
    }
    if (vlBest === -MATE_VALUE) {
      return this.pos.mateValue();
    }
    this.recordHash(hashFlag, vlBest, depth, mvBest);
    if (mvBest > 0) {
      this.setBestMove(mvBest, depth);
    }
    return vlBest;
  }

  searchRoot(depth) {
    let vlBest = -MATE_VALUE;
    const sort = new MoveSort(this.mvResult, this.pos, this.killerTable, this.historyTable);
    
    while (true) {
      const mv = sort.next();
      if (mv <= 0) {
        break;
      }
      if (!this.pos.makeMove(mv)) {
        continue;
      }
      const newDepth = this.pos.inCheck() ? depth : depth - 1;
      let vl;
      if (vlBest === -MATE_VALUE) {
        vl = -this.searchFull(-MATE_VALUE, MATE_VALUE, newDepth, true);
      } else {
        vl = -this.searchFull(-vlBest - 1, -vlBest, newDepth, false);
        if (vl > vlBest) {
          vl = -this.searchFull(-MATE_VALUE, -vlBest, newDepth, true);
        }
      }
      this.pos.undoMakeMove();
      if (vl > vlBest) {
        vlBest = vl;
        this.mvResult = mv;
        if (vlBest > -WIN_VALUE && vlBest < WIN_VALUE) {
          vlBest += Math.floor(Math.random() * RANDOMNESS) - Math.floor(Math.random() * RANDOMNESS);
          vlBest = (vlBest === this.pos.drawValue() ? vlBest - 1 : vlBest);
        }
      }
    }
    this.setBestMove(this.mvResult, depth);
    return vlBest;
  }

  searchUnique(vlBeta, depth) {
    const sort = new MoveSort(this.mvResult, this.pos, this.killerTable, this.historyTable);
    sort.next();
    while (true) {
      const mv = sort.next();
      if (mv <= 0) {
        break;
      }
      if (!this.pos.makeMove(mv)) {
        continue;
      }
      const vl = -this.searchFull(-vlBeta, 1 - vlBeta,
          this.pos.inCheck() ? depth : depth - 1, false);
      this.pos.undoMakeMove();
      if (vl >= vlBeta) {
        return false;
      }
    }
    return true;
  }

  searchMain(depth, millis) {
    // 初始化置换表
    this.hashTable = [];
    for (let i = 0; i <= this.hashMask; i++) {
      this.hashTable.push({ depth: 0, flag: 0, vl: 0, mv: 0, zobristLock: 0 });
    }
    // 初始化杀手表
    this.killerTable = [];
    for (let i = 0; i < LIMIT_DEPTH; i++) {
      this.killerTable.push([0, 0]);
    }
    // 初始化历史表
    this.historyTable = [];
    for (let i = 0; i < 4096; i++) {
      this.historyTable.push(0);
    }
    this.mvResult = 0;
    this.allNodes = 0;
    this.pos.distance = 0;
    
    const t = Date.now();
    for (let i = 1; i <= depth; i++) {
      const vl = this.searchRoot(i);
      this.allMillis = Date.now() - t;
      if (this.allMillis > millis) {
        break;
      }
      if (vl > WIN_VALUE || vl < -WIN_VALUE) {
        break;
      }
      if (this.searchUnique(1 - WIN_VALUE, i)) {
        break;
      }
    }
    return this.mvResult;
  }

  getKNPS() {
    return this.allMillis > 0 ? this.allNodes / this.allMillis : 0;
  }
}
