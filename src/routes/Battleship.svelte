<script>
    import { fade } from 'svelte/transition';
    
    import { gameId, uiStrings as ui } from '../ui/Battleship.js';

    // currentGame is a bugfix that disables transitions when routing
    import { globalLanguage, currentGame } from '../stores.js';

    import WhoPlaysFirst from '../components/WhoPlaysFirst.svelte';

    import { randomInt, alphabet } from '../lib.js';

    // LANGUAGE HEAD ==============================>
    let language;    

	const unsubscribe = globalLanguage.subscribe(value => {
        language = value;        
    });     
    // LANGUAGE TAIL ==============================<


    // currentGame is a bugfix that disables transitions when routing
    let curGame;
	const unsubscribe2 = currentGame.subscribe(value => {
        curGame = value;        
    });        


    // GAME LOGIC HEAD ==============================>

    // Can be used in more than one function!!!
    const corners = [
        { r: -1, c: -1},
        { r: -1, c: 1},
        { r: 1, c: -1},
        { r: 1, c: 1},
    ]

    // Can be used in more than one function!!!
    const sideSteps = [
        { r: 0, c: -1 },    // left
        { r: 1, c: 0 },     // bottom
        { r: 0, c: 1 },     // right
        { r: -1, c: 0 },    // top
    ];


    let oppoTurn = false;

    // let moveCount = 0;
    let userMoveCount, oppoMoveCount;

    let highlighted = false;
    let isGameOn = false;

    let whoBegins = null; // Initially must be *exactly* null, otherwise condition won't work!

    // let isUserReady = false;
    let isUserBoardReady = false;
    let isOppoBoardReady = false;

    let globalToBePositioned;

    let flashing = null;

    // let lastHitUserCellRow;
    // let lastHitUserCellCol;
    // let lastHitUserCell; // to be { row: x, col: y }
    let hitUserCells; // to be [{ row: x, col: y }, {row: x2, col: y2}, ... ]
    let hitUserShipOrient; // to be VERTICAL or HORIZONTAL
    let hitChecked; // either { head: false } or { tail: false }

    function handleWhoBegins(event) {
        whoBegins = event.detail;
        // console.log("Battleship;  FUNCTION: handleWhoBegins;  event =", event);
        // console.log("Battleship;  FUNCTION: handleWhoBegins;  whoBegins =", whoBegins);
        // isUserReady = true;
        // recountUserShips();
    }

    let userShipCount, oppoShipCount;

    // let info = 'position_ships';
    // globalToBePositioned
    let info;
    let infoText;

    $: infoText = ui[info][language];
    
    // Both User's and Opponent's board size is 10 x 10 (other sizes are possible).
    // But we need to add one column for row letters and one row for column numbers, 
    // so the resulting size is 11 x 11.
    const dataHeight = 10;
    const dataWidth = 10;
    let totalHeight = dataHeight + 1;
    let totalWidth = dataWidth + 1;

    // *********** cells *************
    // const OUTSIDE = 'OUTSIDE';
    // const EMPTY = 'EMPTY';
    // const SHIP = 'SHIP';    
    // const HIT = 'HIT';
    // const SUNK = 'SUNK';
    // const WATER = 'WATER';
    const OUTSIDE = -1;
    const EMPTY = 0;
    const SHIP = 1;    
    const HIT = 2;
    const SUNK = 3;
    const WATER = 5;    

    const USERBOARD = 'USERBOARD';
    const OPPOBOARD = 'OPPOBOARD';

    const IRRELEVANT = 'IRRELEVANT';
    const TOP = 'TOP';
    const RIGHT = 'RIGHT';
    const BOTTOM = 'BOTTOM';
    const LEFT = 'LEFT';

    const VERTICAL = 'VERTICAL';
    const HORIZONTAL = 'HORIZONTAL';
    // const BAD_ORIENT = 0;

    // const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function newEmptyBoard() {
        let board = [];
        let rowContent;

        for (let r = 0; r < totalHeight; r++) {
            if (r === 0) { // top-header row
                rowContent = [' ']; // top left header corner cell
            } else {
                rowContent = [alphabet.slice(r - 1, r)]; // row header ('A', 'B', 'C', ...)
            }

            for (let c = 0; c < dataWidth; c++) {
                if (r === 0) { // top-header row 
                    rowContent.push((c + 1).toString()); // column header ('1', '2', '3', ...)
                } else {
                    rowContent.push(0);
                }                
            }

            board.push(rowContent);
        }

        // console.log("board =", board);
        return board;
    }


    function num2char(num) {
        let char;

        if (num === HIT || num === SUNK ) {
            // &#x2573;  // BOX DRAWINGS LIGHT DIAGONAL CROSS in Unicode // use instead of 'x'            
            char = '&#x2573;';
        } else {
            char = ' ';
        }

        return char;
    }


    function isSunk(row, col, someBoard, boardId) {
        let curCell;
        let hitCells = [{row: row, col: col}];
        let sidesClear = 0;

        sideSteps.forEach(step => {
            for (let r = row + step.r, c = col + step.c; ; r += step.r, c += step.c) {
                // console.log("r, c =", r, c);
                if (isValidCell(r, c)) {
                    curCell = someBoard[r][c];
                    if (curCell === EMPTY || curCell === WATER) {
                        sidesClear++;
                        break; // This direction has been checked
                    } else if (curCell === SHIP) {
                        return false; // some cells of this ship have not been hit yet
                    } else if (curCell === HIT) {
                        hitCells.push({row: r, col: c});
                    }
                } else {
                    sidesClear++;
                    break; // This direction has been checked
                }
            }         
        })

        // console.log("hitCells =", hitCells);
        if (sidesClear < 4) return false;

        hitCells.forEach(cell => {
            someBoard[cell.row][cell.col] = SUNK;
        });

        markAroundShip(hitCells, someBoard);
        // console.log("SHIP IS SUNK! row, col =", row, col);
        return true;
    }

    
    function markAroundShip(hitCells, someBoard) {
        // console.log("FUNCTION:  markAroundShip");
        let headAndTail = getHeadAndTail(hitCells);
        // console.log("headAndTail =", headAndTail);

        let startRow = Math.max(1, headAndTail[0].row - 1);
        let endRow = Math.min(dataHeight, headAndTail[1].row + 1);
        let startCol = Math.max(1, headAndTail[0].col - 1);
        let endCol = Math.min(dataWidth, headAndTail[1].col + 1);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                // console.log("r, c =", r, c);
                if (isValidCell(r, c) && someBoard[r][c] === EMPTY) {
                    someBoard[r][c] = WATER;
                }                
            }
        }
    }


    function markCornersAsWater(row, col, someBoard, boardId) {
        // console.log("FUNCTION: markCornersAsWater");
        let r, c;

        let corners = [
            { r: -1, c: 1},     // top right corner
            { r: 1, c: 1},      // bottom right corner
            { r: 1, c: -1},     // bottom left corner
            { r: -1, c: -1},    // top left corner
        ]

        corners.forEach(corner => {
            r = row + corner.r;
            c = col + corner.c;
            if (isValidCell(r, c) && someBoard[r][c] === EMPTY) {
                someBoard[r][c] = WATER;
            }
        })        
    }


    function makeReactive(boardId) { // for reactivity
        if (boardId === USERBOARD) {
            userBoard = userBoard;
        } else {
            oppoBoard = oppoBoard;
        }
    }


    function flashOnHit(row, col, someBoard, boardId) {        
        // Adds flashing effect, which is applied to the hit cell        
        // console.log("FUNCTION: flashOnHit");
        let flashingDelay = 100;

        flashing = {row: row, col: col, boardId: boardId, class: 'hit-cell-1'};

        makeReactive(boardId);

        setTimeout( () => { 
            flashing.class = 'hit-cell-2';
            makeReactive(boardId);
        }, flashingDelay);

        setTimeout( () => { 
            flashing.class = 'hit-cell-3';
            makeReactive(boardId);
        }, flashingDelay * 2);
       
        setTimeout( () => { 
            flashing = null;
            makeReactive(boardId);
        }, flashingDelay * 3);
    }


    function fireAtOppoBoard(row, col) {
        // User fires at an opponent board cell
        // console.log("FUNCTION: fire;  isGameOn =", isGameOn);

        if (!isGameOn) return;

        if (oppoTurn) return;

        updateMousePosition();

        let cell = oppoBoard[row][col];

        if (cell === WATER || cell === HIT || cell === SUNK) {
            showPopup(ui['no_use_firing_here'][language], row, col);
            return;
        }

        if (cell === EMPTY) {
            oppoBoard[row][col] = WATER;
            info = 'oppo_ship_missed';
            makeReactive(OPPOBOARD);
        } else if (cell === SHIP) {      
            oppoBoard[row][col] = HIT;    
            // hitCells.push([row, col]);
            if (isSunk(row, col, oppoBoard, OPPOBOARD)) {
                info = 'oppo_ship_sunk';
                oppoShipCount--;
                flashOnHit(row, col, oppoBoard, OPPOBOARD);
            } else {                
                info = 'oppo_ship_hit';                
                markCornersAsWater(row, col, oppoBoard, OPPOBOARD);      
                // markAroundShip([{row: row, col: col}], oppoBoard);
                // markWaterAroundHitCells();         
                // markAroundHit(row, col, oppoBoard);
                flashOnHit(row, col, oppoBoard, OPPOBOARD);             
            }
        }

        // makeReactive(OPPOBOARD);

        // console.log("oppoBoard[row][col] =", oppoBoard[row][col]);
        // userMoveCount++;
        oppoTurn = true; // causes reaction!!!

        if (oppoShipCount < 1) {
            info = 'user_won';
            // isGameOn = false;
            // oppoTurn = true;
            return;
        }

        setTimeout( () => { 
            info = 'opponent_move';
            fireAtUserBoard();     
        }, 2000);            
    }


    function getHeadAndTail(hitCells) {
        let headAndTail = [
            { row: dataHeight, col: dataWidth}, // either uppermost or leftmost cell of ship/frag
            { row: 1, col: 1},                  // either bottommost or rightmost cell of ship/frag
        ];                

        for (let i = hitCells.length - 1; i >= 0; i--) {
            headAndTail[0].row = Math.min(headAndTail[0].row, hitCells[i].row); // head
            headAndTail[0].col = Math.min(headAndTail[0].col, hitCells[i].col); // head
            headAndTail[1].row = Math.max(headAndTail[1].row, hitCells[i].row); // tail
            headAndTail[1].col = Math.max(headAndTail[1].col, hitCells[i].col); // tail
        }

        return headAndTail;
    }


    function getOrient(cells) {
        let orient;

        if (cells[0].row === cells[1].row) {
            orient = HORIZONTAL;
        } else if (cells[0].col === cells[1].col) {
            orient = VERTICAL;
        // } else {
        //     orient = BAD_ORIENT;
        }
        
        return orient;
    }


    function isCellInvalidOrWater(row, col, someBoard) {
        if (!isValidCell(row, col)) return true;
        return (someBoard[row][col] === WATER);
    }


    function fireAtUserBoard() {
        let cellFlatPos;
        let row = -1, col = -1;
        let cell;        
        let r, c;
        let direction;
        let head, tail;
        let cells;
        // let orient;
        let dirList = [TOP, RIGHT, BOTTOM, LEFT];

        if (hitUserCells.length > 0) {
            // Try and finish off a hit user ship
            // console.log("hitUserCells =", hitUserCells); 
            if (hitUserCells.length > 1) {
                cells = getHeadAndTail(hitUserCells); // either head.row < tail.row, or head.col < tail.col
                head = cells[0];
                tail = cells[1];

                if (head.row === tail.row) {
                    hitUserShipOrient = HORIZONTAL;
                    if (isCellInvalidOrWater(head.row, head.col - 1, userBoard)) {
                        dirList = [RIGHT];
                        hitChecked.head = true;
                    } else if (isCellInvalidOrWater(tail.row, tail.col + 1, userBoard)) {
                        dirList = [LEFT];
                        hitChecked.tail = true;
                    } else {
                        dirList = [LEFT, RIGHT];
                    }                    
                } else if (head.col === tail.col) {
                    hitUserShipOrient = VERTICAL;                    
                    if (isCellInvalidOrWater(head.row - 1, head.col, userBoard)) {
                        dirList = [BOTTOM];
                        hitChecked.head = true;
                    } else if (isCellInvalidOrWater(tail.row + 1, tail.col, userBoard)) {
                        dirList = [TOP];
                        hitChecked.tail = true;
                    } else {
                        dirList = [TOP, BOTTOM]; // The order is important!
                    }                    
                }
            } else {
                // only 1 cell, so we need to check all of its sides
                dirList = [TOP, RIGHT, BOTTOM, LEFT];
                cells = [{ 
                    // row: hitUserCells[hitUserCells.length - 1].row, 
                    // col: hitUserCells[hitUserCells.length - 1].col,
                    row: hitUserCells[0].row, 
                    col: hitUserCells[0].col,
                }];
            }

            for (let i = 0; i < cells.length; i++) { // either 1 or 2 iterations
                r = cells[i].row;
                c = cells[i].col;

                if (cells.length > 1 && dirList.length === 2) {
                    // head (top or left) or tail (right or bottom)
                    // dirList = [dirList[i]];                     // check 1 cell only
                    if (i === 0) { 
                        if (hitChecked.head) continue;
                        hitChecked.head = true;
                    } else if (i === 1) {
                        if (hitChecked.tail) continue;
                        hitChecked.tail = true;                            
                    }
                    dirList = [dirList[i]];  // check 1 cell only                        
                    // console.log("dirList =", dirList);
                    // orient = getOrient(cells);                    
                }

                direction = checkIfShipOrEmptyAtCellSides(r, c, userBoard, dirList);
                if (direction !== IRRELEVANT) {
                    if (direction === TOP) {
                        row = r - 1;
                        col = c;
                    } else if (direction === BOTTOM) {
                        row = r + 1;
                        col = c;
                    } else if (direction === LEFT) {
                        col = c - 1;
                        row = r;
                    } else if (direction === RIGHT) {
                        col = c + 1;
                        row = r;
                    }
                    break;
                }
            // cell = userBoard[row][col];                     
            }               
            // }
        }

        if (row === -1 || col === -1) {
            // Fire at a random cell
            while (true) {
                cellFlatPos = randomInt(cellCount); // (0, 1, ... , 99)
                row = Math.floor(cellFlatPos / dataHeight) + 1;
                col = cellFlatPos - (row - 1) * dataHeight + 1;           
                cell = userBoard[row][col];
                if (cell === EMPTY || cell === SHIP) break;
            }
        } else {
            cell = userBoard[row][col];
        }
            
        if (cell === EMPTY) {
            userBoard[row][col] = WATER;
            info = 'user_ship_missed';
            makeReactive(USERBOARD);
        } else if (cell === SHIP) {        
            userBoard[row][col] = HIT; 
            // hitCells.push([row, col]);                             
            // hitUserCells.push({ row: row, col: col });
            if (isSunk(row, col, userBoard, USERBOARD)) {
                info = 'user_ship_sunk';
                userShipCount--;
                hitUserCells = [];
                hitUserShipOrient = null;
                hitChecked = { head: false, tail: false };
                // markAroundShip(hitUserCells, oppoBoard);
                flashOnHit(row, col, userBoard, USERBOARD);
            } else {                
                hitUserCells.push({ row: row, col: col });
                if (hitUserCells.length > 1) {
                    cells = getHeadAndTail(hitUserCells);
                    hitUserShipOrient = getOrient(cells);
                } else {
                    // markAroundShip([{row: row, col: col}], userBoard);
                }
                markCornersAsWater(row, col, userBoard, USERBOARD);
                flashOnHit(row, col, userBoard, USERBOARD);
                info = 'user_ship_hit';
            }
        }

        // userBoard = userBoard; // for reactivity

        // console.log("userBoard[row][col] =", userBoard[row][col]);
        oppoMoveCount++;

        if (userShipCount < 1) {
            info = 'opponent_won';
            // isGameOn = false;
            oppoTurn = true;
            return;
        }

        setTimeout( () => { 
            info = 'user_move';
            oppoTurn = false;
        }, 1000);          
    }


    function checkIfShipOrEmptyAtCellSides(row, col, board, dirList) {          
        let r, c;
        let direction;    
        let dirPos;
        // let dirList = [TOP, RIGHT, BOTTOM, LEFT];
       // let cell;
        let dirList2 = [...dirList];
 
        while (true) {
            // direction = randomInt(4) + 1; // 1 = top, 2 = right, 3 = bottom, 4 = left
            if (dirList2.length > 1) {
                dirPos = randomInt(dirList2.length);
                // direction = dirList2[dirPos];
            } else if (dirList2.length === 1) {
                dirPos = 0;
                // direction = dirList2[0];
            } else {
                break; // The list has been exhausted
            }

            direction = dirList2[dirPos];
            dirList2.splice(dirPos, 1); // remove direction from list

            if (direction === TOP) {
                r = row - 1;
                c = col;
            } else if (direction === RIGHT) {
                r = row;
                c = col + 1;
            } else if (direction === BOTTOM) {
                r = row + 1;
                c = col;
            } else if (direction === LEFT) {
                r = row;
                c = col - 1;
            }

            if (isValidCell(r, c) && board[r][c] !== WATER) {          
                // cell = board[r][c];
                if (board[r][c] === SHIP || board[r][c] === EMPTY) {
                    return direction;
                }
            }
        }

        return IRRELEVANT; // 0 == false
    }


    let mouseX = 0, mouseY = 0; // mouse position

    function updateMousePosition() {
        mouseX = event.pageX;
        mouseY = event.pageY;
    }


    let selectedShipClass = null;

    $: {
        if (selectedShipClass) {
            // console.log("selectedShipClass =", selectedShipClass);
        }
    }

    let userBoard, oppoBoard;


    function uB(row, col) {
        // console.log("uB:  ", (isValidCell(row, col) ? userBoard[row][col] : OUTSIDE));
        return isValidCell(row, col) ? userBoard[row][col] : OUTSIDE;
    }


    function oB(row, col) {
        return isValidCell(row, col) ? oppoBoard[row][col] : OUTSIDE;
    }    


    function clearUserBoard() {
        userBoard = newEmptyBoard();
        userBoard = userBoard; // for reactivity
        isUserBoardReady = false;
        // console.log("userBoard =", userBoard);
    }

    function clearOppoBoard() {
        // let oppoBoard = newEmptyBoard();
        oppoBoard = JSON.parse(JSON.stringify(userBoard));
        isOppoBoardReady = false;
        // console.log("oppoBoard =", oppoBoard);
    }


    function getCellClass(row, col, someBoard, boardId) {      
        let cellClass;
        let isDataCell = (row > 0 && col > 0);
        let isFlashing = (flashing && row === flashing.row && col === flashing.col);

        cellClass = `
            board-cell unselectable
            ${col === 0 && row === 0 ? 'no-top-left-borders' : ''}
            ${(col === 0 || row === 0) && col !== row ? 'top-and-left-headers' : ''}
            ${(col === 0 && col === row) ? 'top-left-header-cell' : ''}
            ${(isDataCell && someBoard[row][col] === SUNK) ? 'sunk-cell' : ''}
            ${(isDataCell && someBoard[row][col] === WATER) ? 'water-cell' : ''}
            ${(isDataCell && someBoard[row][col] === HIT) ? 'hit-cell' : ''}
        `

        if (boardId === OPPOBOARD) { // opponent board
            cellClass += `
            ${(isDataCell && someBoard[row][col] === EMPTY) ? 'fog-cell' : ''}        
            ${(isDataCell && someBoard[row][col] === SHIP) ? 'fog-cell' : ''}
            ${(isDataCell && isGameOn && !oppoTurn) ? 'whose-turn' : ''}
            ${(isDataCell && isFlashing && flashing.boardId === boardId) ? flashing.class : ''}
            `;
        } else { // user board
            cellClass += `
            ${(isDataCell && someBoard[row][col] === EMPTY) ? 'board-data' : ''}        
            ${(isDataCell && someBoard[row][col] === SHIP) ? 'ship-cell' : ''}
            ${(isDataCell && !isGameOn) ? 'whose-turn' : ''}
            ${(isDataCell && isFlashing && flashing.boardId === boardId) ? flashing.class : ''}
            `;
        }

        // console.log("row, col, cellClass =", row, col, cellClass);
        return cellClass;
    }    


    function getInfoClass(toBePositioned, totalNumber) {
        let cellClass = `
        ${toBePositioned === 0 ? 'ships-ready' : ''}
        ${toBePositioned < 0 ? 'ships-overlimit' : ''}
        ${toBePositioned > 0 && toBePositioned < totalNumber ? 'ships-in-process' : ''}
        `;

        return cellClass;    
    }

    // Use fewer ships for development, but more ships for production
    const ships = [    
        { class: 'battleship', size: 4, totalNumber: 1 },
        { class: 'cruiser',   size: 3, totalNumber: 2 },
        { class: 'destroyer', size: 2, totalNumber: 3 },
        { class: 'motorboat', size: 1, totalNumber: 4 },
        /*
        { class: 'battleship', size: 4, totalNumber: 1 },
        { class: 'cruiser',   size: 3, totalNumber: 1 },
        { class: 'destroyer', size: 2, totalNumber: 1 },
        { class: 'motorboat', size: 1, totalNumber: 1 },
        */
        /*
        { class: 'destroyer', size: 2, totalNumber: 1 },
        { class: 'motorboat', size: 1, totalNumber: 1 },
        */
    ]

    const totalClasses = ships.length;

    // Make an array of valid ship sizes
    let validSizes = [];
    for (let i = 0; i < totalClasses; i++) {
        validSizes.push(ships[i].size);
    }    
    // console.log("validSizes =", validSizes);

    let userShips = [];


    function isValidSize(row, col) {
        // Used for userBoard only
        let shipSize = 1;

        sideSteps.forEach(step => {
            for (let r = row + step.r, c = col + step.c; ; r += step.r, c += step.c) {
                if (isValidCell(r, c)) {
                    if (userBoard[r][c] === SHIP) {
                        shipSize++;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
        })

        // console.log("shipSize =", shipSize);
        return (validSizes.indexOf(shipSize) > -1);
    }    


    function recountUserShips(row, col) {
        let shipSize;
        let pos;

        // head ship (if any), at top or left
        // new ship-cell, which can become a multi-cell ship; or empty cell
        // tail ship (if any), at left or right
        let headMidTail = [0, -1, 0];

        sideSteps.forEach(step => {
            pos = step.r === -1 || step.c === -1 ? 0 : 2;
            for (let r = row + step.r, c = col + step.c; ; r += step.r, c += step.c) {
                if (uB(r, c) === SHIP) {
                    headMidTail[pos]++; // add to head or tail ship
                } else {
                    break;
                }
            }
        })

        if (userBoard[row][col] === SHIP) { // Was empty-cell, now ship-cell
            headMidTail[1] = headMidTail[0] + headMidTail[2] + 1; // More ships of this size
            headMidTail[0] = -headMidTail[0];   // Less ships of this size
            headMidTail[2] = -headMidTail[2];   // Less ships of this size            
        } else { // Was ship-cell, possibly inside a multi-cell ship; now empty-cell
            headMidTail[1] = -(headMidTail[0] + headMidTail[2] + 1); // Less ships of this size
        }

        for (let i = 0; i < 3; i++) { // head (if any), mid (new), tail (if any)
            if (headMidTail[i] !== 0) {
                shipSize = Math.abs(headMidTail[i]);
                for (let s = 0; s < totalClasses; s++) {
                    if (userShips[s].size === shipSize) {
                        userShips[s].toBePositioned -= Math.sign(headMidTail[i]);                                
                        break;
                    }
                }            
            }
        }

        let curToBePositioned = 0;
        for (let s = 0; s < totalClasses; s++) {
            curToBePositioned += userShips[s].toBePositioned;
        }

        userShips = userShips;

        globalToBePositioned = curToBePositioned;

        if (globalToBePositioned === 0) {
            isUserBoardReady = true;
            if (whoBegins === null) {
                info = "but_who_begins"
            } else {
                info = 'can_start_now';
            }            
        } else {
            isUserBoardReady = false;
            info = 'position_ships';
        }
    }


    function isValidCell(row, col) {
        return (row > 0 && row < totalHeight && col > 0 && col < totalWidth);
    }


    function isUnsafeAtCorners(row, col, someBoard) {      
        // console.log("row, col =", row, col);
        let r, c;

        // Remember: it's not so easy to break out of a *forEach* loop, so use a *for* loop!!!
        for (let i = 0; i < 4; i++) {
            r = row + corners[i].r;
            c = col + corners[i].c;
            // console.log("FUNCTION: isUnsafeAtCorners;  r, c =", r, c);
            if (isValidCell(r, c) && someBoard[r][c] === SHIP) {
                // console.log("someBoard[r][c] =", someBoard[r][c]);
                return true;
            }
        }

        return false;
    }
    

    function isUnsafeAtSides(row, col, someBoard) {    
        let r, c;

        // Remember: it's not so easy to break a *forEach* loop, so use a *for* loop!!!
        for (let i = 0; i < 4; i++) {
            r = row + sideSteps[i].r;
            c = col + sideSteps[i].c;
            // console.log("FUNCTION: isUnsafeAtCorners;  r, c =", r, c);
            if (isValidCell(r, c) && someBoard[r][c] === SHIP) {
                // console.log("someBoard[r][c] =", someBoard[r][c]);
                return true;
            }
        }

        return false;
    }


    let popupText = '';
    let isPopupVisible = false;
    let isCellClickBlocked = false;
    let popupX = 0, popupY = 0;
    // let popupWidth = 0;
    // let popupElement

    function showPopup(textToShow, row, col) {
        popupText = textToShow;
        isPopupVisible = true;
        isCellClickBlocked = true;

        popupY = mouseY;

        // Need to prevent popup from going to the right outside the board!
        popupX = mouseX;
        // console.log(document.getElementById('cell-popup').offsetWidth);
        if (dataWidth - col < 5) {
            popupX -= (document.getElementById('cell-popup').offsetWidth + 10);
        } 

        // console.log("row, col =", row, col);
        // console.log("mouseX, mouseY, popupX, popupY =", mouseX, mouseY, popupX, popupY);

        setTimeout( () => {
            isPopupVisible = false;
            isCellClickBlocked = false;
        }, 2000);
    }


    function placeShip(row, col) {
        if (isGameOn) return;

        if (row === 0 || col === 0) return; // headers

        updateMousePosition();

        if (userBoard[row][col] === EMPTY) {  
            if (isUnsafeAtCorners(row, col, userBoard)) {
                // updateMousePosition();
                showPopup(ui['cannot_position_here'][language], row, col);
                return;
            }

            if (!isValidSize(row, col)) {
                // updateMousePosition();
                showPopup(ui['invalid_ship_size'][language], row, col);
                return;
            }

            userBoard[row][col] = SHIP;          
        } else if (userBoard[row][col] === SHIP) { // ship-containing cell
            userBoard[row][col] = EMPTY;  
        }

        userBoard = userBoard;

        recountUserShips(row, col);
    }    


    // let globalToBePositioned = 0;

    function initUserShips() {
        userShips = [];
        ships.forEach( ship => {
            let userShip = {
                class: ship.class,
                size: ship.size,
                totalNumber: ship.totalNumber,
                toBePositioned: ship.totalNumber,         
            }

            globalToBePositioned += ship.totalNumber;
            // console.log("globalToBePositioned =", globalToBePositioned);
            userShips.push(userShip);
        })

        userShips.sort(function(a, b) {
            return b.size - a.size;
        });
        // console.log("userShips =", userShips);
    }


    let oppoShipsFlatList;
    let bigSize;

    function initOppoShips() {
        let oppoShips = [];
        ships.forEach( ship => {
            let oppoShip = {
                // class: ship.class,
                size: ship.size,
                totalNumber: ship.totalNumber,
                toBePositioned: ship.totalNumber,         
            };

            oppoShips.push(oppoShip);
        })

        oppoShips.sort(function(a, b) {
            return b.size - a.size;
        });

        bigSize = oppoShips[0];

        oppoShips.forEach( ship => {
            for (let s = 0; s < ship.totalNumber; s++) {
                oppoShipsFlatList.push(ship.size);
            }
        })

        oppoShipCount = oppoShipsFlatList.length;
        userShipCount = oppoShipCount;

        positionOppoShips();
    }
    

    let oppoBoardFlatList = [];
    // This array begins with [1, 1] and ends with [10, 10] for a 10 x 10 board.
    // Note that board size is 11 x 11 (to include left header and top header).
    //
    // flatPos = (row - 1) * dataHeight + (col - 1)

    let cellCount = dataHeight * dataWidth; // cell count (e.g. 100)
    let cellCountAndDirections = cellCount * 4; // cell count multiplied by possible directions


    function initOppoBoardFlatList() {
        for (let r = 0; r < totalHeight; r++) {
            for (let c = 0; c < totalWidth; c++) {
                oppoBoardFlatList.push([r, c]);
            }
        }
    }


    function positionOppoShips() {
        let shipHeadFlatPosAndTailDir;
        let shipHeadFlatPos;
        let shipTailDirection;
        let shipHeadRow, shipHeadCol;
        let shipTailRow, shipTailCol;
        let isMisfit;

        let oppoShipsToPosition = oppoShipsFlatList.length;
        let isShipNotPositioned;

        // console.log("oppoShipsFlatList =", oppoShipsFlatList);

        for (let s = 0; s < oppoShipsToPosition; s++) {
            isShipNotPositioned = true;
            
            while (isShipNotPositioned) {
                isMisfit = false;
                shipHeadFlatPosAndTailDir = randomInt(cellCountAndDirections); // (0, 1, 396)
                shipHeadFlatPos = Math.floor(shipHeadFlatPosAndTailDir / 4);
                shipHeadRow = Math.floor(shipHeadFlatPos / dataHeight) + 1;
                shipHeadCol = shipHeadFlatPos - (shipHeadRow - 1) * dataHeight + 1;

                // 0 = top, 1 = right, 2 = bottom, 3 = left
                // let shipTailDir = randomInt(4);
                let shipTailDir = shipHeadFlatPosAndTailDir % cellCount;
                if (shipTailDir % 2 === 0) { // top or bottom
                    shipTailRow = shipHeadRow + (shipTailDir === 0 ? -1 : 1) * (oppoShipsFlatList[s] - 1);
                    if (shipTailRow < shipHeadRow) {
                        [shipTailRow, shipHeadRow] = [shipHeadRow, shipTailRow]; // now tail > head
                    } // right or left
                    if (shipHeadRow < 1 || shipTailRow > dataHeight) {
                        // break; // Part of the ship is outside the data board 
                        isMisfit = true; // Part of the ship is outside the data board 
                    }
                    shipTailCol = shipHeadCol;
                } else {
                    shipTailRow = shipHeadRow;
                    shipTailCol = shipHeadCol + (shipTailDir === 3 ? -1 : 1) * (oppoShipsFlatList[s] - 1);
                    if (shipTailCol < shipHeadCol) {
                        [shipTailCol, shipHeadCol] = [shipHeadCol, shipTailCol]; // now tail > head
                    }
                    if (shipHeadCol < 1 || shipTailCol > dataWidth) {
                        // break; // Part of the ship is outside the data board 
                        isMisfit = true; // Part of the ship is outside the data board 
                    }                    
                }
                // console.log("shipHeadRow, shipHeadCol =", shipHeadRow, shipHeadCol);
                // console.log("shipTailRow, shipTailCol =", shipTailRow, shipTailCol);

                // let isMisfit = false;

                if (!isMisfit) {
                    // Supposedly, the ship is competely within the board.
                    // Now we need to check if it touches or intersects with any other ship.
                    for (let r = shipHeadRow; r <= shipTailRow; r++) {
                        if (isMisfit) break;
                        for (let c = shipHeadCol; c <= shipTailCol; c++) {
                            if (oppoBoard[r][c] !== EMPTY ||
                                isUnsafeAtSides(r, c, oppoBoard) || 
                                isUnsafeAtCorners(r, c, oppoBoard)) {
                                isMisfit = true;
                                break;
                            }
                        }
                    }

                    if (!isMisfit) {
                        for (let r = shipHeadRow; r <= shipTailRow; r++) {
                            for (let c = shipHeadCol; c <= shipTailCol; c++) {
                                oppoBoard[r][c] = SHIP;
                            }
                        }
                        isShipNotPositioned = false;                
                    }
                }
            }
        }

        // console.log("oppoBoard =", oppoBoard);
        // isReadyToPlay = true;
        isOppoBoardReady = true;
    }


    function restartGame() {
        oppoShipsFlatList = [];

        clearUserBoard();
        clearOppoBoard();

        let isUserBoardReady = false;
        let isOppoBoardReady = false;

        initUserShips();        

        let oppoTurn = true;

        // let userMoveCount, oppoMoveCount;

        highlighted = false;        

        flashing = null;

        whoBegins = null;

        hitUserCells = [];
        hitUserShipOrient = null;
        hitChecked = { head: false, tail: false };

        globalToBePositioned = 0;

        isGameOn = false;

        info = 'position_ships';

        // userShips = [];
        // globalToBePositioned = 0;

        // testPositionUserShips(); // for test purposes only
    }


    function testPositionUserShips() {
        // Used for testing only
        userBoard = [
            [" ", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
            ["A", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ["B", 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            ["C", 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
            ["D", 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            ["E", 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
            ["F", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ["G", 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            ["H", 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
            ["I", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ["J", 0, 1, 0, 0, 0, 1, 1, 1, 0, 0],
        ];     
    }

    $: {
        if (isGameOn) {
            userBoard = userBoard;
            oppoBoard = oppoBoard;
        }
    }

    $: {
        if (!oppoTurn) {
            // userBoard = userBoard;
            oppoBoard = oppoBoard; // for reactivity!!! *** IMPORTANT ***
            // console.log("oppoTurn =", oppoTurn);
        }
    }


    function startGame() {
        isGameOn = true;

        userMoveCount = 0;
        oppoMoveCount = 0;

        hitUserCells = [];

        initOppoShips();

        info = 'game_on';
        // console.log("oppoBoard =", oppoBoard);

        if (whoBegins === "opponent") {
            oppoTurn = true;
            info = 'opponent_move';
            setTimeout( () => { 
                fireAtUserBoard();
            }, 2000);            
                        
        } else {
            oppoTurn = false;
            setTimeout( () => { 
                info = 'user_move';
            }, 1000);
        }
    }    

    // initialization
    restartGame();

    // GAME LOGIC TAIL ==============================>

</script>


<style>
    .ship-list-and-who-plays-first {
        display: block;        
        max-width: 25em;
        float: right;
    }

    .who-plays-first {
        display: block;
        margin-top: 2em;
        width: 90%;
    }

    .ship-list {
        display: block;
        width: 100%;
        margin-top: .5em;
        margin-bottom: 1em;
    }

    .ship-list-table {        
        margin-top: .5em;
        margin-bottom: 1em;
        border-collapse: collapse;      
        font-size: 1em;
    }

    .ship-list-data {
        background-color: white;

        border-style: solid;
        border-width: 1px;
        border-color: gray;   

        padding: 0.2em;

        word-wrap: normal;
    }

    .content-leftish {
        text-align: left;
    }

    .content-rightish {
        text-align: right;
    }    

    .ship-list-headers {
        font-size: .8em;
    }

    .small-header {
        margin-block-start: .5em;
        margin-block-end: .5em;
    }


    /* Board (table) */
    .board {
        border-collapse: collapse;  
        margin-top: 1em;
        margin-bottom: 1em;
        background-color: inherit;     
        padding: 0;
    }    

    .board-cell { /* any cells, including header cells */
        width: 35px;
        height: 35px;
        text-align: center;
    }
   
    .board-data {
        background-color: lightskyblue;
    }

    .whose-turn {
        border-color: greenyellow;
        border-width: 2px;
    }

    .top-and-left-headers {
        background-color: lightsteelblue;
        text-align: center;
        font-size: 1em;
        font-family: Arial, Helvetica, sans-serif;
        font-weight: 100;
    }

    .top-left-header-cell {
        background-color: inherit;
        border-style: none;
    }


    /* data cells with different content or in different external context */
    .ship-cell {
        background-color: cadetblue;
    }

    .fog-cell {
        background-color: gray;
    }

    .water-cell {
        background-color: blue;
        transition: color 800ms linear 50ms;
    }


    .sunk-cell {
        background-color: brown;
    }    

    .hit-cell {
        background-color: red;
    }

    .hit-cell-1 {
        background-color: yellow;
    }

    .hit-cell-2 {
        background-color: rgb(255, 196, 0);
    }

    .hit-cell-3 {
        background-color: orange;
    }

    .sunk-cell, .hit-cell, .hit-cell-1, .hit-cell-2, .hit-cell-3 {
        transition: color 100ms linear 50ms;
    }


    .board-data, .ship-cell, .hit-cell, .sunk-cell, .fog-cell, .water-cell {
        border-style: solid;
        border-width: 1px;
        border-color: black;

        padding: 0;
        margin: 0;
        vertical-align: center;
        text-align: center;       

        font-size: 1em;
        font-family: 'Lucida Console', 'Courier New', Courier, monospace;
    }


    .whose-turn:hover {
        border-style: dotted;
        border-width: 2px;
        border-color: yellow;
    }

    .user {
        /* display: inline-block; */
        /* margin-left: .5rem; */
        margin-right: 1rem;
        /* margin-right: 2em; */
        margin-top: 0;
        float: left;

        position: relative;
    }

    .opponent {
        /* margin-left: .5rem; */
        margin-top: 0;
        float: right;

        position: relative;
    }    



    .ships-ready {
        background-color: lightgreen;
        color: blue;
        font-weight: bold;
    }

    .ships-in-process {
        background-color: lightblue;
        color: brown;
        font-weight: bold;
    }

    .ships-overlimit {
        background-color: red;
        color: white;
        font-weight: bold;
    }    

    .center {
        margin-left: auto;
        margin-right: auto;
        text-align: center;
    }

    .margin-after {
        margin-bottom: 1em;
    }

    .container {
        width: 100%;
        /* max-width: 60em; */
        margin-top: 0.5em;
        margin-bottom: 1em;

        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        padding-left: .5rem;
        padding-right: .5rem;

        /* position: relative; */
    }

    .left-or-top {
      position: relative;
    }

    .user-or-opponent {
        text-align: center;
        margin: 0;

        font-weight: 600;
        font-size: 1rem;
    }

    .user, .opponent {
        display: block;
        min-width: 25em;
    }

    .user {
        float: left;
    }

    .opponent {
        float: right;
    }

    /*
    .leftish {
        float: left;
    }
    */

    .buttons-and-info {
        /* display: flex; */
        /* width: 50%; */
        display: block;
        clear: both;
        min-width: 25em;
        max-width: 35em;
        margin-top: 2em;
    }

    .info-text {
        /* display: flex; */
        font-size: 1em;
        font-weight: normal;
        font-family: Arial, Helvetica, sans-serif;
        color: black;
        margin-top: 1em;
        max-width: 25em;
        text-align: left;
    }

    .unselectable {
        -moz-user-select: -moz-none;
        -khtml-user-select: none;
        -webkit-user-select: none;
        -o-user-select: none;
        user-select: none;
    }        

    .buttons {
        margin-left: 2em;
        margin-right: auto;
    }

    .cool-button {
        display: inline;        
        background-color: aqua;
        color: blue;
        font-weight: bold;
        margin-left: 1em;
        margin-right: 1em;
    }

    .cool-button:disabled {
        background-color: lightgray;
        color: gray;
    }    

    /* used by who-plays-first */
    .margin-after {
        margin-bottom: 1em;
    }

    .cell-popup {
        position: absolute;
        z-index: 100;
        background-color: black;
        color: white;        
        padding: 0.5em;        
        border-radius: 5px;
        font-size: .8em;
        transition: opacity 1s ease-in-out;
    }

    .popup-hidden {
        visibility: hidden;
        opacity: 1;
    }

    .popup-visible {
        visibility: visible;
        opacity: 0;
    }

    @media (max-width: 900px) {
      .container {
        padding-left: 1.5rem;

        flex-direction: column;
      }

      .user-or-opponent {
        position: absolute;

        left: -0.8rem;
        top: 50%;

        transform-origin: left;
        transform: rotate(-90deg) translateX(-50%);
      }
    }

</style>


<!-- GAME NAME -->
<!-- <h1 class="center">{ gameName[language] }</h1> -->
<!-- class="{ () => getCellClass(row, col) }"  -->

<div class="container">
    <div class="left-or-top">     

      <div class="user">
        <div class="user-or-opponent">{ ui["user_ships"][language] }</div>

        <!-- TABLE with USER's SHIPS -->
        <table class="board">
          <!-- Must use a key in #each loop -->
          {#each userBoard as rowContent, row (row)} 
            <tr>
              <!-- Must use a key in #each loop -->
              {#each rowContent as cell, col (col * dataHeight + col)}
                <td on:click={ () => placeShip(row, col) }
                    class="{ getCellClass(row, col, userBoard, USERBOARD) }"                                                   
                >
                    { @html row > 0 && col > 0 ? num2char(cell) : cell }
                </td>
              {/each}
            </tr>
          {/each}
        </table>
      </div>

      <!-- BUTTON(S) and INFO TEXT -->
      <div class="buttons-and-info">
        <!-- INFO TEXT -->
        <div class="info-text center unselectable margin-after"> 
          <!-- Do not remove &nbsp; -->
          { @html infoText } &nbsp;
        </div>            

        <div class="buttons">
          <!-- BUTTON -->
          <button class="cool-button" on:click={startGame} 
                  disabled={!isUserBoardReady || whoBegins === null || isGameOn}
          >
              { ui['start_game'][language] }
          </button>            

          <!-- BUTTON -->
          <button class="cool-button" on:click={restartGame}>
              { ui['restart_game'][language] }
          </button>            
        </div>  
      </div>            
    </div>

    <!-- HERE USER CAN CHECK USER SHIPS POSITIONED ON THE BOARD -->
    {#if !isGameOn && curGame === gameId}
        <div class="ship-list-and-who-plays-first">
            <div class="ship-list">
                <h4 class="small-header">{ ui['user_ships'][language] }</h4>

                <!-- TABLE TO DISPLAY HOW MANY USER SHIPS ARE AWAILABLE -->
                <table class="ship-list-table">
                    <tr class="content-leftish ship-list-headers">
                        <th class="ship-list-data"> { ui['class'][language]} </th>
                        <th class="ship-list-data"> { ui['size'][language]} </th>       
                        <th class="ship-list-data"> { ui['total_number'][language]} </th>                             
                        <th class="ship-list-data"> { ui['to_be_positioned'][language]} </th>                             
                    </tr>
                    <!-- Must use a key in #each loop -->
                    {#each userShips as userShip, index (index)}
                        <tr>
                            <td class="ship-list-data content-leftish"> { ui[userShip.class][language] } </td>
                            <td class="ship-list-data content-rightish"> { userShip.size } </td>
                            <td class="ship-list-data content-rightish"> { userShip.totalNumber } </td>
                            <td class="ship-list-data content-rightish 
                                { getInfoClass(userShip.toBePositioned, userShip.totalNumber) }
                                "> 
                                { userShip.toBePositioned } 
                            </td>
                        </tr>
                    {/each}        
                </table>
            </div>

            <div class="who-plays-first">
                <!-- WHO PLAYS FIRST radio buttons etc -->
                <!-- The fade transition messes up with routing, so use currentGame as a bugfix!!! -->
                <WhoPlaysFirst on:whoBegins={handleWhoBegins} whoBegins="{whoBegins}" />
            </div>
        </div>
        <!-- <div>&nbsp;</div> -->
    {/if}    

    {#if isGameOn && curGame === gameId}
        <div class="opponent" transition:fade="{ {delay: 100, duration: 500} }">
            <h3 class="user-or-opponent">{ ui["opponent_ships"][language] }</h3>

            <!-- TABLE with OPPONENT's SHIPS -->
            <table class="board">
                <!-- Must use a key in #each loop -->
                {#each oppoBoard as rowContent, row (row)}
                    <tr>
                        <!-- Must use a key in #each loop -->
                        {#each rowContent as cell, col (col * dataHeight + col)}
                            <td on:click={ () => fireAtOppoBoard(row, col) }
                                class="{getCellClass(row, col, oppoBoard, OPPOBOARD)}"                         
                            >
                                { @html row > 0 && col > 0 ? num2char(cell) : cell }
                            </td>
                        {/each}
                    </tr>
                {/each}
            </table>
        </div>
    {/if}


    <p>&nbsp</p> <!-- dummy empty paragraph -->

    <div id="cell-popup" class="cell-popup popup-{isPopupVisible ? 'visible' : 'hidden'}"
        style="left: {popupX}px; top: {popupY}px"
    >
        { popupText }
    </div>

</div>    <!-- container end -->
