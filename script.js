// HW10 Othello (Pure JS)
// - Player: Black (1), Computer: White (-1)
// - Difficulty: basic (greedy + corner), advanced (minimax + alpha-beta)
// - UI: 3D discs, flip animation, sequential flips

(() => {
  "use strict";

  const SIZE = 8;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = -1;

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const scoreBlackEl = document.getElementById("scoreBlack");
  const scoreWhiteEl = document.getElementById("scoreWhite");
  const thinkingEl = document.getElementById("thinking");
  const difficultyEl = document.getElementById("difficulty");
  const showHintsEl = document.getElementById("showHints");
  const btnNew = document.getElementById("btnNew");
  const btnNew2 = document.getElementById("btnNew2");
  const btnUndo = document.getElementById("btnUndo");
  const dlgOver = document.getElementById("dlgOver");
  const dlgMsg = document.getElementById("dlgMsg");
  const btnCloseDlg = document.getElementById("btnCloseDlg");

  // 位置權重（常見 Othello heuristic）
  const W = [
    [120, -20,  20,   5,   5,  20, -20, 120],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [120, -20,  20,   5,   5,  20, -20, 120],
  ];

  const DIRS = [
    [-1,-1], [-1,0], [-1,1],
    [ 0,-1],         [ 0,1],
    [ 1,-1], [ 1,0], [ 1,1],
  ];

  /** UI cells cache */
  const cells = [];
  /** game state */
  let board = makeEmptyBoard();
  let turn = BLACK; // player always BLACK
  let locked = false;
  let lastSnapshot = null; // for simple undo (one step)

  function makeEmptyBoard(){
    return Array.from({length: SIZE}, () => Array(SIZE).fill(EMPTY));
  }

  function cloneBoard(b){
    return b.map(row => row.slice());
  }

  function inBounds(r,c){ return r>=0 && r<SIZE && c>=0 && c<SIZE; }

  function initBoard(){
    board = makeEmptyBoard();
    // initial 4
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
    turn = BLACK;
    lastSnapshot = null;
  }

  function countPieces(b){
    let black = 0, white = 0;
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        if(b[r][c] === BLACK) black++;
        else if(b[r][c] === WHITE) white++;
      }
    }
    return {black, white};
  }

  function scanFlips(b, player, r, c){
    if(b[r][c] !== EMPTY) return [];
    const opp = -player;
    const flips = [];
    for(const [dr,dc] of DIRS){
      let rr = r + dr, cc = c + dc;
      const line = [];
      while(inBounds(rr,cc) && b[rr][cc] === opp){
        line.push([rr,cc]);
        rr += dr; cc += dc;
      }
      if(line.length > 0 && inBounds(rr,cc) && b[rr][cc] === player){
        flips.push(...line);
      }
    }
    return flips;
  }

  function legalMoves(b, player){
    const moves = [];
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        if(b[r][c] !== EMPTY) continue;
        const flips = scanFlips(b, player, r, c);
        if(flips.length){
          moves.push({r,c,flips});
        }
      }
    }
    return moves;
  }

  function applyMove(b, player, move){
    const nb = cloneBoard(b);
    nb[move.r][move.c] = player;
    for(const [rr,cc] of move.flips){
      nb[rr][cc] = player;
    }
    return nb;
  }

  function isCorner(r,c){
    return (r===0 && c===0) || (r===0 && c===SIZE-1) || (r===SIZE-1 && c===0) || (r===SIZE-1 && c===SIZE-1);
  }

  function cornerCount(b, player){
    let s = 0;
    const corners = [[0,0],[0,SIZE-1],[SIZE-1,0],[SIZE-1,SIZE-1]];
    for(const [r,c] of corners){
      if(b[r][c] === player) s++;
    }
    return s;
  }

  function mobility(b, player){
    return legalMoves(b, player).length;
  }

  function evalBoard(b, player){
    // player perspective: higher is better for 'player'
    const opp = -player;

    // 1) positional weights
    let pos = 0;
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        pos += W[r][c] * b[r][c]; // BLACK contributes +, WHITE contributes -
      }
    }
    // convert to current player perspective:
    pos *= player; // if player is WHITE (-1), invert

    // 2) corners
    const cornerScore = (cornerCount(b, player) - cornerCount(b, opp)) * 60;

    // 3) mobility (moves available)
    const mobScore = (mobility(b, player) - mobility(b, opp)) * 8;

    // 4) piece diff (late game matters more)
    const {black, white} = countPieces(b);
    const total = black + white;
    const diff = (player === BLACK) ? (black - white) : (white - black);
    const pieceScore = diff * (total > 54 ? 6 : 1);

    // 5) "X-square" penalty (danger next to corners if corner empty)
    const xSquares = [[1,1],[1,6],[6,1],[6,6]];
    const cornerEmpty = (b[0][0]===EMPTY) + (b[0][7]===EMPTY) + (b[7][0]===EMPTY) + (b[7][7]===EMPTY);
    let xPenalty = 0;
    if(cornerEmpty){
      for(const [r,c] of xSquares){
        if(b[r][c] === player) xPenalty -= 25;
        else if(b[r][c] === opp) xPenalty += 10;
      }
    }

    return pos + cornerScore + mobScore + pieceScore + xPenalty;
  }

  function gameOver(b){
    return legalMoves(b, BLACK).length === 0 && legalMoves(b, WHITE).length === 0;
  }

  function setLocked(v){
    locked = v;
    boardEl.classList.toggle("locked", v);
    for(const cell of cells){
      cell.el.classList.toggle("disabled", v);
    }
  }

  function setStatus(msg){
    statusEl.textContent = msg;
  }

  function showThinking(v){
    thinkingEl.hidden = !v;
  }

  function getCell(r,c){
    return cells[r*SIZE + c];
  }

  function setDisc(r,c, value, {animatePlace=false} = {}){
    const {disc} = getCell(r,c);
    disc.classList.remove("black","white","placing");
    if(value === BLACK){
      disc.classList.add("black");
      if(animatePlace) disc.classList.add("placing");
    } else if(value === WHITE){
      disc.classList.add("white");
      if(animatePlace) disc.classList.add("placing");
    } else {
      // empty
    }
  }

  function clearHints(){
    for(const cell of cells){
      cell.el.classList.remove("hintOn");
      cell.flipNum.textContent = "";
      cell.el.dataset.hint = "";
    }
  }

  function renderHints(moves){
    clearHints();
    if(showHintsEl.value !== "on") return;
    for(const m of moves){
      const cell = getCell(m.r, m.c);
      cell.el.classList.add("hintOn");
      cell.flipNum.textContent = String(m.flips.length);
      cell.el.dataset.hint = "1";
    }
  }

  function renderBoard(){
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        setDisc(r,c, board[r][c], {animatePlace:false});
      }
    }
    const {black, white} = countPieces(board);
    scoreBlackEl.textContent = String(black);
    scoreWhiteEl.textContent = String(white);
  }

  function announceGameOver(){
    const {black, white} = countPieces(board);
    let result = "";
    if(black > white) result = "✅ 玩家（黑）獲勝！";
    else if(white > black) result = "❌ 電腦（白）獲勝！";
    else result = "🤝 平手！";
    dlgMsg.innerHTML = `
      <div>黑：<b>${black}</b>　白：<b>${white}</b></div>
      <div style="margin-top:8px">${result}</div>
    `;
    dlgOver.showModal();
  }

  async function animateFlipsSequential(move, player){
    // place disc
    setDisc(move.r, move.c, player, {animatePlace:true});

    // flip each disc sequentially
    const flips = move.flips.slice();
    for(let i=0;i<flips.length;i++){
      const [r,c] = flips[i];
      const {disc} = getCell(r,c);

      await wait(55); // controls "逐顆翻"
      await animateFlipDisc(disc, player);
      board[r][c] = player; // keep state in sync
    }

    // finally set move position in state (already set visually)
    board[move.r][move.c] = player;
  }

  function wait(ms){
    return new Promise(res => setTimeout(res, ms));
  }

  async function animateFlipDisc(discEl, toPlayer){
    discEl.classList.add("flipping");
    // switch color at mid-flip
    await wait(160);
    discEl.classList.remove("black","white");
    discEl.classList.add(toPlayer === BLACK ? "black" : "white");
    await wait(180);
    discEl.classList.remove("flipping");
  }

  function takeSnapshot(){
    lastSnapshot = { board: cloneBoard(board), turn };
  }

  function undoOne(){
    if(!lastSnapshot || locked) return;
    board = cloneBoard(lastSnapshot.board);
    turn = lastSnapshot.turn;
    lastSnapshot = null;
    renderBoard();
    step(); // re-render hints / status
  }

  // ====== AI ======

  function pickMoveBasic(b, player){
    const moves = legalMoves(b, player);
    if(!moves.length) return null;

    // 1) immediate corner
    const corners = moves.filter(m => isCorner(m.r, m.c));
    if(corners.length) return corners[Math.floor(Math.random()*corners.length)];

    // 2) greedy flips
    let best = [];
    let bestScore = -Infinity;
    for(const m of moves){
      // flips count + positional weight
      const score = m.flips.length * 10 + W[m.r][m.c];
      if(score > bestScore){
        bestScore = score;
        best = [m];
      } else if(score === bestScore){
        best.push(m);
      }
    }
    return best[Math.floor(Math.random()*best.length)];
  }

  function pickMoveAdvanced(b, player){
    const moves = legalMoves(b, player);
    if(!moves.length) return null;

    // quick corner
    const corners = moves.filter(m => isCorner(m.r, m.c));
    if(corners.length) return corners[Math.floor(Math.random()*corners.length)];

    // dynamic depth: deeper late game
    const {black, white} = countPieces(b);
    const total = black + white;
    const depth = total >= 52 ? 6 : (total >= 42 ? 5 : 4);

    let bestMove = null;
    let bestVal = -Infinity;

    // move ordering: prefer corners then higher eval
    const ordered = moves.slice().sort((a,bm) => {
      const ea = (a.flips.length*4 + W[a.r][a.c]);
      const eb = (bm.flips.length*4 + W[bm.r][bm.c]);
      return eb - ea;
    });

    let alpha = -Infinity, beta = Infinity;
    for(const m of ordered){
      const nb = applyMove(b, player, m);
      const val = -negamax(nb, -player, depth-1, -beta, -alpha, player);
      if(val > bestVal){
        bestVal = val;
        bestMove = m;
      }
      alpha = Math.max(alpha, val);
      // alpha-beta cut at root isn't critical but ok
    }
    return bestMove;
  }

  function negamax(b, toMove, depth, alpha, beta, rootPlayer){
    // rootPlayer: whose perspective we evaluate at leaf
    if(depth === 0 || gameOver(b)){
      return evalBoard(b, rootPlayer);
    }

    const moves = legalMoves(b, toMove);
    if(!moves.length){
      // pass
      return -negamax(b, -toMove, depth-1, -beta, -alpha, rootPlayer);
    }

    // order moves
    const ordered = moves.slice().sort((a,bm) => {
      const ea = (a.flips.length*4 + W[a.r][a.c]);
      const eb = (bm.flips.length*4 + W[bm.r][bm.c]);
      return eb - ea;
    });

    let best = -Infinity;
    for(const m of ordered){
      const nb = applyMove(b, toMove, m);
      const val = -negamax(nb, -toMove, depth-1, -beta, -alpha, rootPlayer);
      if(val > best) best = val;
      if(val > alpha) alpha = val;
      if(alpha >= beta) break; // prune
    }
    return best;
  }

  function chooseComputerMove(){
    const diff = difficultyEl.value;
    if(diff === "basic") return pickMoveBasic(board, WHITE);
    return pickMoveAdvanced(board, WHITE);
  }

  // ====== Turn Loop ======

  async function step(){
    renderBoard();

    if(gameOver(board)){
      setStatus("遊戲結束");
      clearHints();
      announceGameOver();
      return;
    }

    if(turn === BLACK){
      const moves = legalMoves(board, BLACK);
      if(!moves.length){
        setStatus("玩家（黑）無子可下 → 交換回合給電腦");
        clearHints();
        await wait(400);
        turn = WHITE;
        step();
        return;
      }
      setStatus("輪到：玩家（黑）");
      renderHints(moves);
    } else {
      const moves = legalMoves(board, WHITE);
      if(!moves.length){
        setStatus("電腦（白）無子可下 → 交換回合給玩家");
        clearHints();
        await wait(400);
        turn = BLACK;
        step();
        return;
      }

      clearHints();
      setStatus("輪到：電腦（白）");
      setLocked(true);
      showThinking(true);

      // Let UI update
      await wait(120);

      const mv = chooseComputerMove();
      if(!mv){
        showThinking(false);
        setLocked(false);
        turn = BLACK;
        step();
        return;
      }

      takeSnapshot(); // allow undo after computer move too
      await animateFlipsSequential(mv, WHITE);

      showThinking(false);
      setLocked(false);
      turn = BLACK;
      step();
    }
  }

  async function handlePlayerClick(r,c){
    if(locked || turn !== BLACK) return;

    const moves = legalMoves(board, BLACK);
    const mv = moves.find(m => m.r === r && m.c === c);
    if(!mv) return;

    takeSnapshot();
    clearHints();

    setLocked(true);
    await animateFlipsSequential(mv, BLACK);
    setLocked(false);

    turn = WHITE;
    step();
  }

  // ====== Build UI ======
  function buildBoardUI(){
    boardEl.innerHTML = "";
    cells.length = 0;

    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.setAttribute("role", "gridcell");
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);

        const disc = document.createElement("div");
        disc.className = "disc";

        const hint = document.createElement("div");
        hint.className = "hint";

        const flipNum = document.createElement("div");
        flipNum.className = "flipNum";

        cell.appendChild(disc);
        cell.appendChild(hint);
        cell.appendChild(flipNum);

        cell.addEventListener("click", () => handlePlayerClick(r,c));
        boardEl.appendChild(cell);

        cells.push({el: cell, disc, hint, flipNum});
      }
    }
  }

  // ====== Events ======
  btnNew.addEventListener("click", () => startNew());
  btnNew2.addEventListener("click", () => { dlgOver.close(); startNew(); });
  btnUndo.addEventListener("click", () => undoOne());
  btnCloseDlg.addEventListener("click", () => dlgOver.close());

  showHintsEl.addEventListener("change", () => step());
  difficultyEl.addEventListener("change", () => {
    // no forced restart; just affects next computer move
  });

  function startNew(){
    dlgOver.close();
    initBoard();
    renderBoard();
    setLocked(false);
    showThinking(false);
    step();
  }

  // ====== boot ======
  buildBoardUI();
  startNew();
})();
