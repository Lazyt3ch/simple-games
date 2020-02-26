<script>
    import { beforeUpdate, tick } from 'svelte';

    import { fade } from 'svelte/transition';
    
    import { languages, gameName, gameId, uiStrings as ui } from './ui/Battleship.js';

    // currentGame is a bugfix that disables transitions when routing
    import { globalLanguage, currentGame } from '../stores.js';

    // import { onDestroy } from 'svelte';

    import WhoPlaysFirst from './ui/WhoPlaysFirst.svelte';

    import { randomInt } from '../lib.js';

    // document.addEventListener('click', updateMousePosition);    

    // onDestroy(() => {
    //     console.log('Battleship: The component is being destroyed');
    //     // document.removeEventListener('click', updateMousePosition);
    // });    


    // LANGUAGE HEAD ==============================>
    let language;    
    // console.log("Battleship:  $globalLanguage =", $globalLanguage);

	const unsubscribe = globalLanguage.subscribe(value => {
        language = value;        
		// console.log("Battleship:  language =", language);
    });     
    // LANGUAGE TAIL ==============================<


    // currentGame is a bugfix that disables transitions when routing
    let curGame;
	const unsubscribe2 = currentGame.subscribe(value => {
        curGame = value;        
		// console.log("Battleship:  curGame, gameId =", curGame, " &", gameId);
    });        


    // GAME LOGIC HEAD ==============================>

    let oppoTurn = false;

    // let moveCount = 0;
    let userMoveCount, oppoMoveCount;

    let highlighted = false;
    let isGameOn = false;

    let whoBegins = null; // Initially must be *exactly* null, otherwise condition won't work!

    // let isUserReady = false;
    let isUserBoardReady = false;
    let isOppoBoardReady = false;

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
        recountUserShips();
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
    const EMPTY = 0;
    const SHIP = 1;    
    const HIT = 2;
    const SUNK = 3;
    const WATER = 5;
    const FOG = 6;
    const HIT1 = 21;
    const HIT2 = 22;
    const HIT3 = 23;

    const USERBOARD = 1;
    const OPPOBOARD = 2;

    const IRRELEVANT = 0;
    const TOP = 1;
    const RIGHT = 2;
    const BOTTOM = 3;
    const LEFT = 4;

    const VERTICAL = 1;
    const HORIZONTAL = 2;
    // const BAD_ORIENT = 0;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function newEmptyBoard() {
        let board = [];
        let row;

        for (let r = 0; r < totalHeight; r++) {
            if (r === 0) { // top-header row
                row = [' ']; // top left header corner cell
            } else {
                row = [alphabet.slice(r - 1, r)]; // row header ('A', 'B', 'C', ...)
            }

            for (let c = 0; c < dataWidth; c++) {
                if (r === 0) { // top-header row 
                    row.push((c + 1).toString()); // column header ('1', '2', '3', ...)
                } else {
                    row.push(0);
                }                
            }

            board.push(row);
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

    // Used in more than one function!!!
    const sideSteps = [
        { r: 0, c: -1 },    // left
        { r: 1, c: 0 },     // bottom
        { r: 0, c: 1 },     // right
        { r: -1, c: 0 },    // top
    ];

    function isSunk(rowIndex, colIndex, someBoard, boardId) {
        let curCell;
        let hitCells = [{row: rowIndex, col: colIndex}];
        let sidesClear = 0;

        sideSteps.forEach(step => {
            for (let r = rowIndex + step.r, c = colIndex + step.c; ; r += step.r, c += step.c) {
                console.log("r, c =", r, c);
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
        console.log("SHIP IS SUNK! rowIndex, colIndex =", rowIndex, colIndex);
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


    function makeReactive(boardId) { // for reactivity
        if (boardId === USERBOARD) {
            userBoard = userBoard;
        } else {
            oppoBoard = oppoBoard;
        }
    }


    function flashOnHit(rowIndex, colIndex, someBoard, boardId) {        
        // Adds flashing effect, which is applied to the hit cell        
        // console.log("FUNCTION: flashOnHit");
        let flashingDelay = 100;

        flashing = {row: rowIndex, col: colIndex, boardId: boardId, class: 'hit-cell-1'};

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


    function fireAtOppoBoard(rowIndex, colIndex) {
        // User fires at an opponent board cell
        // console.log("FUNCTION: fire;  isGameOn =", isGameOn);

        if (!isGameOn) return;

        if (oppoTurn) return;

        updateMousePosition();

        let cell = oppoBoard[rowIndex][colIndex];

        if (cell === WATER || cell === HIT || cell === SUNK) {
            showPopup(ui['no_use_firing_here'][language], rowIndex, colIndex);
            return;
        }

        if (cell === EMPTY) {
            oppoBoard[rowIndex][colIndex] = WATER;
            info = 'oppo_ship_missed';
            makeReactive(OPPOBOARD);
        } else if (cell === SHIP) {      
            oppoBoard[rowIndex][colIndex] = HIT;    
            // hitCells.push([rowIndex, colIndex]);
            if (isSunk(rowIndex, colIndex, oppoBoard, OPPOBOARD)) {
                info = 'oppo_ship_sunk';
                oppoShipCount--;
                flashOnHit(rowIndex, colIndex, oppoBoard, OPPOBOARD);
            } else {                
                info = 'oppo_ship_hit';                
                // markCornersAsWater(rowIndex, colIndex, oppoBoard, OPPOBOARD);      
                markAroundShip([{row: rowIndex, col: colIndex}], oppoBoard);
                // markWaterAroundHitCells();         
                // markAroundHit(rowIndex, colIndex, oppoBoard);
                flashOnHit(rowIndex, colIndex, oppoBoard, OPPOBOARD);             
            }
        }

        // makeReactive(OPPOBOARD);

        // console.log("oppoBoard[rowIndex][colIndex] =", oppoBoard[rowIndex][colIndex]);
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


    function isCellInvalidOrWater(rowIndex, colIndex, someBoard) {
        if (!isValidCell(rowIndex, colIndex)) return true;
        return (someBoard[rowIndex][colIndex] === WATER);
    }


    function fireAtUserBoard() {
        let cellFlatPos;
        let rowIndex = -1, colIndex = -1;
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

            // directions = []

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
                        rowIndex = r - 1;
                        colIndex = c;
                    } else if (direction === BOTTOM) {
                        rowIndex = r + 1;
                        colIndex = c;
                    } else if (direction === LEFT) {
                        colIndex = c - 1;
                        rowIndex = r;
                    } else if (direction === RIGHT) {
                        colIndex = c + 1;
                        rowIndex = r;
                    }
                    break;
                }
            // cell = userBoard[rowIndex][colIndex];                     
            }               
            // }
        }

        if (rowIndex === -1 || colIndex === -1) {
            // Fire at a random cell
            while (true) {
                cellFlatPos = randomInt(cellCount); // (0, 1, ... , 99)
                rowIndex = Math.floor(cellFlatPos / dataHeight) + 1;
                colIndex = cellFlatPos - (rowIndex - 1) * dataHeight + 1;           
                cell = userBoard[rowIndex][colIndex];
                if (cell === EMPTY || cell === SHIP) break;
            }
        } else {
            cell = userBoard[rowIndex][colIndex];
        }
            
        if (cell === EMPTY) {
            userBoard[rowIndex][colIndex] = WATER;
            info = 'user_ship_missed';
            makeReactive(USERBOARD);
        } else if (cell === SHIP) {        
            userBoard[rowIndex][colIndex] = HIT; 
            // hitCells.push([rowIndex, colIndex]);                             
            // hitUserCells.push({ row: rowIndex, col: colIndex });
            if (isSunk(rowIndex, colIndex, userBoard, USERBOARD)) {
                info = 'user_ship_sunk';
                userShipCount--;
                hitUserCells = [];
                hitUserShipOrient = null;
                hitChecked = { head: false, tail: false };
                // markAroundShip(hitUserCells, oppoBoard);
                flashOnHit(rowIndex, colIndex, userBoard, USERBOARD);
            } else {                
                hitUserCells.push({ row: rowIndex, col: colIndex });
                if (hitUserCells.length > 1) {
                    cells = getHeadAndTail(hitUserCells);
                    hitUserShipOrient = getOrient(cells);
                } else {
                    markAroundShip([{row: rowIndex, col: colIndex}], userBoard);
                }
                flashOnHit(rowIndex, colIndex, userBoard, USERBOARD);
                info = 'user_ship_hit';
            }
        }

        // userBoard = userBoard; // for reactivity

        // console.log("userBoard[rowIndex][colIndex] =", userBoard[rowIndex][colIndex]);
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


    function checkIfShipOrEmptyAtCellSides(rowIndex, colIndex, board, dirList) {          
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
                r = rowIndex - 1;
                c = colIndex;
            } else if (direction === RIGHT) {
                r = rowIndex;
                c = colIndex + 1;
            } else if (direction === BOTTOM) {
                r = rowIndex + 1;
                c = colIndex;
            } else if (direction === LEFT) {
                r = rowIndex;
                c = colIndex - 1;
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


    function getCellClass(rowIndex, colIndex, someBoard, boardId) {      
        let cellClass;
        let isDataCell = (rowIndex > 0 && colIndex > 0);
        let isFlashing = (flashing && rowIndex === flashing.row && colIndex === flashing.col);

        cellClass = `
            board-cell unselectable
            ${colIndex === 0 && rowIndex === 0 ? 'no-top-left-borders' : ''}
            ${(colIndex === 0 || rowIndex === 0) && colIndex !== rowIndex ? 'top-and-left-headers' : ''}
            ${(colIndex === 0 && colIndex === rowIndex) ? 'top-left-header-cell' : ''}
            ${(isDataCell && someBoard[rowIndex][colIndex] === SUNK) ? 'sunk-cell' : ''}
            ${(isDataCell && someBoard[rowIndex][colIndex] === WATER) ? 'water-cell' : ''}
            ${(isDataCell && someBoard[rowIndex][colIndex] === HIT) ? 'hit-cell' : ''}
        `

        if (boardId === OPPOBOARD) { // opponent board
            cellClass += `
            ${(isDataCell && someBoard[rowIndex][colIndex] === EMPTY) ? 'fog-cell' : ''}        
            ${(isDataCell && someBoard[rowIndex][colIndex] === SHIP) ? 'fog-cell' : ''}
            ${(isDataCell && isGameOn && !oppoTurn) ? 'whose-turn' : ''}
            ${(isDataCell && isFlashing && flashing.boardId === boardId) ? flashing.class : ''}
            `;
        } else { // user board
            cellClass += `
            ${(isDataCell && someBoard[rowIndex][colIndex] === EMPTY) ? 'board-data' : ''}        
            ${(isDataCell && someBoard[rowIndex][colIndex] === SHIP) ? 'ship-cell' : ''}
            ${(isDataCell && !isGameOn) ? 'whose-turn' : ''}
            ${(isDataCell && isFlashing && flashing.boardId === boardId) ? flashing.class : ''}
            `;
        }

        // console.log("rowIndex, colIndex, cellClass =", rowIndex, colIndex, cellClass);
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


    function isValidSize(rowIndex, colIndex) {
        // Used for userBoard only
        let shipSize = 1;

        sideSteps.forEach(step => {
            for (let r = rowIndex + step.r, c = colIndex + step.c; ; r += step.r, c += step.c) {
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


    function recountUserShips() {
        // To be called each time the user marks/unmarks a cell on the user board

        initUserShips();
        let curShipSize;

        // Checking for vertical ships (but not for one-cell ships)
        for (let c = 1; c < totalWidth; c++) {
            curShipSize = 0;
            for (let r = 1; r < totalHeight; r++) {
                if (userBoard[r][c] === 1) { // ship cell
                    if ((c === 1 || userBoard[r][c - 1] === 0) 
                    && (c === dataWidth || userBoard[r][c + 1] === 0)) {
                        curShipSize++;
                        // console.log("VERTICAL: r, c, curShipSize", r, c, curShipSize);
                    }
                } 
                
                if (r === dataHeight || userBoard[r][c] === 0) {
                    if (curShipSize) {
                        if (curShipSize === 1) { // Skip one-cell ships
                            curShipSize = 0;
                            // return; 
                        } else {
                            for (let s = 0; s < totalClasses; s++) {
                                if (userShips[s].size === curShipSize) {
                                    userShips[s].toBePositioned--;                                    
                                    break;
                                }
                            }    
                            curShipSize = 0;           
                        }         
                    }
                }
            }
        }

        curShipSize = 0;

        // Checking for horizontal ships and one-cell ships
        for (let r = 1; r < totalHeight; r++) {
            curShipSize = 0;
            for (let c = 1; c < totalWidth; c++) {
                if (userBoard[r][c] === 1) { // ship cell
                    if ((r === 1 || userBoard[r - 1][c] === 0) 
                    && (r === dataHeight || userBoard[r + 1][c] === 0)) {
                        curShipSize++;
                        // console.log("HORIZONTAL: r, c, curShipSize", r, c, curShipSize);
                    }
                } 
            
            if (c === dataWidth || userBoard[r][c] === 0) {
                    // console.log("HORIZONTAL: r, c =", r, c);
                    if (curShipSize) {
                        // Handle any ships, including one-cell ships 
                        // console.log("HORIZONTAL (HANDLING): r, c =", r, c);
                        for (let s = 0; s < totalClasses; s++) {
                            if (userShips[s].size === curShipSize) {
                                userShips[s].toBePositioned--;                                
                                break;
                            }
                        }            
                        curShipSize = 0;            
                    }
                }
            }
        }

        let curToBePositioned = 0;
        for (let s = 0; s < totalClasses; s++) {
            curToBePositioned += userShips[s].toBePositioned;
        }

        userShips = userShips;
        // console.log("userShips =", userShips);

        globalToBePositioned = curToBePositioned;
        // console.log("globalToBePositioned =", globalToBePositioned);
        if (globalToBePositioned === 0) {
            // isUserReady = true;
            isUserBoardReady = true;
            if (whoBegins === null) {
                info = "but_who_begins"
            } else {
                info = 'can_start_now';
            }
            
            // console.log("info, infoText = ", info, infoText);
            // console.log("isUserBoardReady, whoBegins =", isUserBoardReady, whoBegins);
            // console.log("curGame, gameId =", curGame, gameId);
        } else {
            // isUserReady = false;
            isUserBoardReady = false;
            info = 'position_ships';
        }
    }


    function isValidCell(rowIndex, colIndex) {
        return (rowIndex > 0 && rowIndex < totalHeight && colIndex > 0 && colIndex < totalWidth);
    }


    const corners = [
        { r: -1, c: -1},
        { r: -1, c: 1},
        { r: 1, c: -1},
        { r: 1, c: 1},
    ]


    function isUnsafeAtCorners(rowIndex, colIndex, someBoard) {      
        // console.log("rowIndex, colIndex =", rowIndex, colIndex);
        let r, c;

        // Remember: it's not so easy to break a *forEach* loop, so use a *for* loop!!!
        for (let i = 0; i < 4; i++) {
            r = rowIndex + corners[i].r;
            c = colIndex + corners[i].c;
            // console.log("FUNCTION: isUnsafeAtCorners;  r, c =", r, c);
            if (isValidCell(r, c) && someBoard[r][c] === SHIP) {
                // console.log("someBoard[r][c] =", someBoard[r][c]);
                return true;
            }
        }

        return false;
    }
    

    function isUnsafeAtSides(rowIndex, colIndex, someBoard) {    
        let r, c;

        // Remember: it's not so easy to break a *forEach* loop, so use a *for* loop!!!
        for (let i = 0; i < 4; i++) {
            r = rowIndex + sideSteps[i].r;
            c = colIndex + sideSteps[i].c;
            // console.log("FUNCTION: isUnsafeAtCorners;  r, c =", r, c);
            if (isValidCell(r, c) && someBoard[r][c] === SHIP) {
                // console.log("someBoard[r][c] =", someBoard[r][c]);
                return true;
            }
        }

        return false;
    }
    

    function pxToNum(pixels) {
        if (pixels.endsWith('px')) {
            return parseInt(pixels.slice(0, pixels.length - 2));
        }
    }


    let popupText = '';
    let isPopupVisible = false;
    let isCellClickBlocked = false;
    let popupX = 0, popupY = 0;
    // let popupWidth = 0;
    // let popupElement

    function showPopup(textToShow, rowIndex, colIndex) {
        popupText = textToShow;
        isPopupVisible = true;
        isCellClickBlocked = true;

        popupY = mouseY;

        // Need to prevent popup from going to the right outside the board!
        popupX = mouseX;
        // console.log(document.getElementById('cell-popup').offsetWidth);
        if (dataWidth - colIndex < 5) {
            popupX -= (document.getElementById('cell-popup').offsetWidth + 10);
        } 

        // console.log("rowIndex, colIndex =", rowIndex, colIndex);
        // console.log("mouseX, mouseY, popupX, popupY =", mouseX, mouseY, popupX, popupY);

        setTimeout( () => {
            isPopupVisible = false;
            isCellClickBlocked = false;
        }, 2000);
    }


    function placeShip(rowIndex, colIndex) {
        if (isGameOn) return;

        if (rowIndex === 0 || colIndex === 0) return; // headers

        updateMousePosition();

        if (userBoard[rowIndex][colIndex] === EMPTY) {  
            if (isUnsafeAtCorners(rowIndex, colIndex, userBoard)) {
                // updateMousePosition();
                showPopup(ui['cannot_position_here'][language], rowIndex, colIndex);
                return;
            }

            if (!isValidSize(rowIndex, colIndex)) {
                // updateMousePosition();
                showPopup(ui['invalid_ship_size'][language], rowIndex, colIndex);
                return;
            }

            userBoard[rowIndex][colIndex] = SHIP;          
        } else if (userBoard[rowIndex][colIndex] === SHIP) { // ship-containing cell
            userBoard[rowIndex][colIndex] = EMPTY;  
        }

        userBoard = userBoard;

        recountUserShips();
    }    


    let globalToBePositioned = 0;

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
    // this array begin with [1, 1] and ends with [10, 10] 
    // Note that board size is 11 x 11 (to include left header and top header)
    //
    // flatPos = (rowIndex - 1) * dataHeight + (colIndex - 1)

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

        console.log("oppoShipsFlatList =", oppoShipsFlatList);

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
        // Need to debug: If run more than once, causes web browser to hang up  :(

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

        isGameOn = false;

        info = 'position_ships';

        // userShips = [];
        // globalToBePositioned = 0;

        // testPositionUserShips(); // for test purposes only
    }


    function testPositionUserShips() {
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
            console.log("oppoTurn =", oppoTurn);
        }
    }


    function startGame() {
        isGameOn = true;

        userMoveCount = 0;
        oppoMoveCount = 0;

        hitUserCells = [];

        initOppoShips();

        info = 'game_on';
        console.log("oppoBoard =", oppoBoard);

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

    // let oppoTurn = false;

    // // let moveCount = 0;
    // let userMoveCount, oppoMoveCount;

    // let highlighted = false;

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
        /* min-width: 20em; */
        width: 90%;
        /* margin-right: 1em; */
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
        /* min-width: 10em; */
    }

    .ship-list-data {
        background-color: white;

        border-style: solid;
        border-width: 1px;
        border-color: gray;   

        padding: 0.2em;
        /* text-align: left; */

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
        /*
        width: 2em;
        height: 2em;
        */
        width: 35px;
        height: 35px;
        text-align: center;
    }
   
    .board-data {
        /* font-weight: 100; */
        /* font-weight: bolder; */
        /* font-family: Arial, Helvetica, sans-serif; */

        background-color: lightskyblue;
    }

    .whose-turn {
        border-color: greenyellow;
        border-width: 2px;
    }

    /*
    .thick-bottom-border {
        border-bottom-color: black;
        border-bottom-width: 3px;
    }

    .thick-right-border {
        border-right-color: black;
        border-right-width: 3px;
    }    
    */

    /*
    .no-top-left-borders {
        border-top-style: none;
        border-left-style: none;
    }
    */

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
        margin-left: 1em;
        margin-right: 2em;
        margin-top: 0;
        float: left;
    }

    .opponent {
        margin-left: 1em;
        margin-top: 0;
        float: right;
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
        max-width: 60em;
        margin-top: 0.5em;
        margin-bottom: 1em;
    }

    .user-or-opponent {
        text-align: center;
        margin: 0;
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

</style>


<!-- GAME NAME -->
<!-- <h1 class="center">{ gameName[language] }</h1> -->
<!-- class="{ () => getCellClass(rowIndex, colIndex) }"  -->

<div class="container">
    <div class="user">
        <h3 class="user-or-opponent">{ ui["user_ships"][language] }</h3>

        <!-- TABLE with USER's SHIPS -->
        <table class="board">
            <!-- Must use a key in #each loop -->
            {#each userBoard as row, rowIndex (rowIndex)} 
                <tr>
                    <!-- Must use a key in #each loop -->
                    {#each row as cell, colIndex (colIndex * dataHeight + colIndex)}
                        <td on:click={ () => placeShip(rowIndex, colIndex) }
                            class="{ getCellClass(rowIndex, colIndex, userBoard, USERBOARD) }"                                                   
                        >
                            { @html rowIndex > 0 && colIndex > 0 ? num2char(cell) : cell }
                        </td>
                    {/each}
                </tr>
            {/each}
        </table>
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
                {#each oppoBoard as row, rowIndex (rowIndex)}
                    <tr>
                        <!-- Must use a key in #each loop -->
                        {#each row as cell, colIndex (colIndex * dataHeight + colIndex)}
                            <td on:click={ () => fireAtOppoBoard(rowIndex, colIndex) }
                                class="{getCellClass(rowIndex, colIndex, oppoBoard, OPPOBOARD)}"                         
                            >
                                { @html rowIndex > 0 && colIndex > 0 ? num2char(cell) : cell }
                            </td>
                        {/each}
                    </tr>
                {/each}
            </table>
        </div>
    {/if}

</div>    

<!-- BUTTON(S) and INFO TEXT -->
<div class="buttons-and-info">
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

    <!-- INFO TEXT -->
    <div class="info-text center unselectable margin-after"> 
        <!-- Do not remove &nbsp; -->
        { @html infoText } &nbsp;
    </div>      
</div>      




<p>&nbsp</p> <!-- dummy empty paragraph -->

<div id="cell-popup" class="cell-popup popup-{isPopupVisible ? 'visible' : 'hidden'}"
    style="left: {popupX}px; top: {popupY}px"
>
    { popupText }
</div>
