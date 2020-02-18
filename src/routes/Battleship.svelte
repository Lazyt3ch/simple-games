<script>
    import { beforeUpdate, tick } from 'svelte';

    import { fade } from 'svelte/transition';
    
    import { languages, gameName, gameId, uiStrings as ui } from './ui/Battleship.js';
    // import { globalLanguage } from '../stores.js';

    // currentGame is a bugfix that disables transitions when routing
    import { globalLanguage, currentGame } from '../stores.js';

    import { onDestroy } from 'svelte';

    import WhoPlaysFirst from './ui/WhoPlaysFirst.svelte';

    // console.log("whoBegins =", whoBegins);

    document.addEventListener('click', updateMousePosition);    

    onDestroy(() => {
        console.log('the component is being destroyed');
        document.removeEventListener('click', updateMousePosition);
        // isAlive = false;
    });    

    // LANGUAGE HEAD ==============================>
    let language;    
    console.log("Battleship:  $globalLanguage =", $globalLanguage);

	const unsubscribe = globalLanguage.subscribe(value => {
        language = value;        
		console.log("Battleship:  language =", language);
    });     
    // LANGUAGE TAIL ==============================<


    // currentGame is a bugfix that disables transitions when routing
    let curGame;
	const unsubscribe2 = currentGame.subscribe(value => {
        curGame = value;        
		console.log("Battleship:  curGame, gameId =", curGame, " &", gameId);
    });    
    

    // GAME LOGIC HEAD ==============================>

    function randomInt(n) {
        return Math.floor(Math.random() * Math.floor(n));
    }

    let isGameOn = false;

    let whoBegins = null; // Must be *exactly* null, otherwise condition won't work!

    // let isUserReady = false;
    let isUserBoardReady = false;
    let isOppoBoardReady = false;

    function handleWhoBegins(event) {
        whoBegins = event.detail.text;
        console.log("whoBegins =", whoBegins);
        // isUserReady = true;
        recountUserShips();
    }

    let info = 'position_ships';
    // globalToBePositioned
    let infoText;

    $: infoText = ui[info][language];
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Both User's and Opponent's board size is 10 x 10
    // But we need to add one column for row letters
    // and one row for column numbers, so the resulting
    // size is 11 x 11    
    const dataHeight = 10;
    const dataWidth = 10;
    let totalHeight = dataHeight + 1;
    let totalWidth = dataWidth + 1;

    // 9 = unused cell (the upper left corner cell)
    // 0 = empty cell    
    // 1 = undiscovered cell containing a ship
    // 2 = discovered cell containing a damaged ship
    // 3 = discovered cell containing a sunken ship
    // 4 = empty cell that cannot be used because it touches a ship
    // *********** cells *************
    const EMPTY = 0;
    const SHIP = 1;
    const DAMAGED = 2;
    const SUNKEN = 3;
    const EDGE = 4;

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

        console.log("board =", board);
        return board;
    }

    function num2char(num) {
        let char;

        if (num === 0) {
            char = ' ';
        } else {
            char = num.toString();
        }

        return char;
    }

    function isShipSunken(rowIndex, colIndex) {
        // 2 = discovered cell containing a damaged ship
        // 3 = discovered cell containing a sunken ship            
        
        // let damagedCellsCount = 0;
        let damagedCells = [];
        let curCell;

        // left
        for (let r = rowIndex; r > 0; r--) {
            curCell = oppoBoard[r][colIndex];
            if (curCell === SHIP) {
                return false; // some cells of this ship have not been hit yet
            } else if (curCell === EMPTY) {
                break; // No need to continue checking this direction            
            } else if (curCell === DAMAGED) {
                damagedCells.push([r, colIndex]);
            }
        }

        // right
        for (let r = rowIndex; r < totalHeight; r++) {
            curCell = oppoBoard[r][colIndex];
            if (curCell === SHIP) {
                return false; // some cells of this ship have not been hit yet
            } else if (curCell === EMPTY) {
                break; // No need to continue checking this direction             
            } else if (curCell === DAMAGED) {
                damagedCells.push([r, colIndex]);
            }
        }        

        // top
        for (let c = colIndex; c > 0; r--) {
            curCell = oppoBoard[rowIndex][c];
            if (curCell === SHIP) {
                return false; // some cells of this ship have not been hit yet
            } else if (curCell === EMPTY) {
                break; // No need to continue checking this direction             
            } else if (curCell === DAMAGED) {
                damagedCells.push([rowIndex, c]);
            }
        }               

        // bottom
        for (let c = colIndex; c < totalWidth; r++) {
            curCell = oppoBoard[rowIndex][c];
            if (curCell === SHIP) {
                return false; // some cells of this ship have not been hit yet
            } else if (curCell === EMPTY) {
                break; // No need to continue checking this direction               
            } else if (curCell === DAMAGED) {
                damagedCells.push([rowIndex, c]);
            }
        }         

        // Marking ship as sunken
        oppoBoard[rowIndex][colIndex] = SUNKEN;
        damagedCells.forEach(coord => {
            oppoBoard[coord[0]][coord[1]] = SUNKEN;
        });

        return true;
    }


    function fire(rowIndex, colIndex) {
        if (!isGameOn) return;

        // user fires at a opponent board cell
        // 2 = discovered cell containing a damaged ship
        // 3 = discovered cell containing a sunken ship            
        if (oppoBoard[rowIndex, colIndex] === SHIP) {            
            if (isShipSunken(rowIndex, colIndex)) {
                info = ui['oppo_ship_sunken'][language];
            } else {
                oppoBoard[rowIndex, colIndex] = DAMAGED;
                info = ui['oppo_ship_hit'][language];
            }
        }

    }


    let mouseX = 0, mouseY = 0; // mouse position

    function updateMousePosition() {
        // if (cellClicksBlocked) return;
        mouseX = event.clientX;
        mouseY = event.clientY;
        console.log("mouseX, mouseY =", mouseX, mouseY);
    }


    let selectedShipClass = null;
    // let selectedShipClass = ui['select_ship'][language];

    $: {
        if (selectedShipClass) {
            console.log("selectedShipClass =", selectedShipClass);
        }
    }

    let curShipIndex = 0;



    /*
    function isAnythingAround(rowIndex, colIndex) {
        for (let r = Math.max(1, rowIndex - 1); r < rowIndex + 1 && r < totalWidth; r++) {
            for (let c = Math.max(1, colIndex - 1); c < colIndex + 1 && c < totalHeight; c++) {

            }
        }

        return true;
    }
    */

    let userBoard, oppoBoard;

    function clearUserBoard() {
        userBoard = newEmptyBoard();
        console.log("userBoard =", userBoard);
    }

    function clearOppoBoard() {
        // let oppoBoard = newEmptyBoard();
        oppoBoard = JSON.parse(JSON.stringify(userBoard));
        console.log("oppoBoard =", oppoBoard);
    }



    

    


    // initOppoBoard

    /*
    // For testing purposes only!
    userBoard[2][1] = 3;
    oppoBoard[9][0] = 1;
    console.log("TEST ----------------------");
    console.log("userBoard =", userBoard);
    console.log("oppoBoard =", oppoBoard);    
    */

    function getCellClass(rowIndex, colIndex, someBoard) {        
        let cellClass = `
        board-cell unselectable
        ${colIndex === 0 && rowIndex === 0 ? 'no-top-left-borders' : ''}
        ${(colIndex === 0 || rowIndex === 0) && colIndex !== rowIndex ? 'top-and-left-headers' : ''}
        ${(colIndex === 0 && colIndex === rowIndex) ? 'top-left-header-cell' : ''}
        ${(rowIndex > 0 && colIndex > 0 && someBoard[rowIndex][colIndex] === 0) ? 'board-data' : ''}        
        ${(rowIndex > 0 && colIndex > 0 && someBoard[rowIndex][colIndex] === 1) ? 'ship-cell' : ''}
        `;
        // console.log("cellClass =", cellClass);
        return cellClass;
    }

    function getInfoClass(toBePositioned, totalNumber) {
        let cellClass = `
        ${toBePositioned === 0 ? 'ships-ready' : ''}
        ${toBePositioned < 0 ? 'ships-overlimit' : ''}
        ${toBePositioned > 0 && toBePositioned < totalNumber ? 'ships-underway' : ''}
        `;

        return cellClass;    
    }

    // let isUserShipsPlaced = false;
    // let isReadyToPlay = false;
    // let isUserShipsPlaced = true;    

    // Use fewer ships for development, but more ships for production
    const ships = [    
        /*    
        { class: 'battleship', size: 4, totalNumber: 1 },
        { class: 'cruiser',   size: 3, totalNumber: 2 },
        { class: 'destroyer', size: 2, totalNumber: 3 },
        { class: 'motorboat', size: 1, totalNumber: 4 },
        */
        /*
        { class: 'battleship', size: 4, totalNumber: 1 },
        { class: 'cruiser',   size: 3, totalNumber: 1 },
        { class: 'destroyer', size: 2, totalNumber: 1 },
        { class: 'motorboat', size: 1, totalNumber: 1 },
        */
        { class: 'destroyer', size: 2, totalNumber: 1 },
        { class: 'motorboat', size: 1, totalNumber: 1 },
        
        
        // { class: 'unknown', size: 0, totalNumber: 0 }, // Here both size & totalNumber are dummy values
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
        let shipSize = 1;

        // Check left
        for (let c = Math.max(colIndex - 1, 1); c > 0; c--) {
            if (c !== colIndex && userBoard[rowIndex][c] === 1) {
                shipSize++;
            } else {
                break;
            }
        }

        // Check right
        for (let c = Math.min(colIndex + 1, dataWidth); c < totalWidth; c++) {
            if (c !== colIndex && userBoard[rowIndex][c] === 1) {
                shipSize++;
            } else {
                break;
            }
        }        

        // Check top
        for (let r = Math.max(rowIndex - 1, 1); r > 0; r--) {
            if (r !== rowIndex && userBoard[r][colIndex] === 1) {
                shipSize++;
            } else {
                break;
            }
        }

        // Check bottom
        for (let r = Math.min(rowIndex + 1, dataHeight); r < totalHeight; r++) {
            if (r !== rowIndex && userBoard[r][colIndex] === 1) {
                shipSize++;
            } else {
                break;
            }
        }              

        console.log("shipSize =", shipSize);

        return (validSizes.indexOf(shipSize) > -1);
    }    

    // isUserReady = false;

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
        console.log("globalToBePositioned =", globalToBePositioned);
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

        /*
        if (isUserBoardReady && whoBegins === null && curGame === gameId) {
            console.log("Condition met!");
        }
        */
    }


    function isValidCell(rowIndex, colIndex) {
        return (rowIndex > 0 && rowIndex < 11 && colIndex > 0 && colIndex < 11);
    }


    function isUnsafeAtCorners(rowIndex, colIndex, board) {      
        // console.log("rowIndex, colIndex =", rowIndex, colIndex);
        
        // top left corner  
        if (isValidCell(rowIndex - 1, colIndex - 1) && board[rowIndex - 1][colIndex - 1] !== 0) {
            return true;
        }

        // top right corner
        if (isValidCell(rowIndex - 1, colIndex + 1) && board[rowIndex - 1][colIndex + 1] !== 0) {
            return true;
        }

        // bottom right corner  
        if (isValidCell(rowIndex + 1, colIndex + 1) && board[rowIndex + 1][colIndex + 1] !== 0) {
            return true;
        }      

        // bottom left corner  
        if (isValidCell(rowIndex + 1, colIndex - 1) && board[rowIndex + 1][colIndex - 1] !== 0) {
            return true;
        }        

        return false;
    }
    

    function isUnsafeAtSides(rowIndex, colIndex, board) {              
        // top  
        if (isValidCell(rowIndex - 1, colIndex) && board[rowIndex - 1][colIndex] !== 0) {
            return true;
        }

        // right
        if (isValidCell(rowIndex, colIndex + 1) && board[rowIndex][colIndex + 1] !== 0) {
            return true;
        }

        // bottom  
        if (isValidCell(rowIndex + 1, colIndex) && board[rowIndex + 1][colIndex] !== 0) {
            return true;
        }        

        // left  
        if (isValidCell(rowIndex, colIndex - 1) && board[rowIndex][colIndex - 1] !== 0) {
            return true;
        }      

        return false;
    }

    let popupText = '';
    let popupVisible = false;
    let cellClicksBlocked = false;
    let popupX = 0, popupY = 0;

    function showPopup(textToShow) {
        popupText = textToShow;
        popupVisible = true;
        cellClicksBlocked = true;
        // popupX = Math.max(20, mouseX - 50);
        // popupY = mouseY - 50;
        popupX = mouseX;
        popupY = mouseY;
        console.log("mouseX, mouseY, popupX, popupY =", mouseX, mouseY, popupX, popupY);

        // style="left: {Math.max(20, mouseX - 50)}px; top: {mouseY - 50}px"

        setTimeout( () => {
            popupVisible = false;
            cellClicksBlocked = false;
        }, 2000);
    }

    function placeShip(rowIndex, colIndex) {
        // if (cellClicksBlocked) return;
        // if (isReadyToPlay) return;
        // if (isUserReady) return;
        // if (isUserReady && isOppoBoardReady && whoBegins !== null) return;
        // if (isUserBoardReady && isOppoBoardReady && whoBegins !== null) return;
        // if (isUserBoardReady && whoBegins !== null) return;
        if (isGameOn) return;

        if (rowIndex === 0 || colIndex === 0) return; // headers

        if (userBoard[rowIndex][colIndex] === 0) {  // empty cell
            if (isUnsafeAtCorners(rowIndex, colIndex, userBoard)) {
                // alert("You cannot place a ship here!");
                showPopup(ui['cannot_position_here'][language]);
                return;
            }

            if (!isValidSize(rowIndex, colIndex)) {
                showPopup(ui['invalid_ship_size'][language]);
                return;
            }

            userBoard[rowIndex][colIndex] = 1; // ship-containing cell            
        } else if (userBoard[rowIndex][colIndex] === 1) { // ship-containing cell
            userBoard[rowIndex][colIndex] = 0;  // empty cell
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
            console.log("globalToBePositioned =", globalToBePositioned);

            userShips.push(userShip);
        })

        userShips.sort(function(a, b) {
            return b.size - a.size;
        });

        console.log("userShips =", userShips);
    }


    let oppoShipsFlatList = [];
    let biggestSize;

    function initOppoShips() {
        let oppoShips = [];
        ships.forEach( ship => {
            let oppoShip = {
                // class: ship.class,
                size: ship.size,
                totalNumber: ship.totalNumber,
                toBePositioned: ship.totalNumber,         
            };

            // globalToBePositioned += ship.totalNumber;
            // console.log("globalToBePositioned =", globalToBePositioned);

            oppoShips.push(oppoShip);
        })

        oppoShips.sort(function(a, b) {
            return b.size - a.size;
        });

        biggestSize = oppoShips[0];

        console.log("oppoShips =", oppoShips);

        oppoShips.forEach( ship => {
            for (let s = 0; s < ship.totalNumber; s++) {
                oppoShipsFlatList.push(ship.size);
            }
        })

        console.log("oppoShipsFlatList =", oppoShipsFlatList);

        positionOppoShips();
    }
    

    let oppoBoardFlatList = [];
    // this array begin with [1, 1] and ends with [10, 10] 
    // Note that board size is 11 x 11 (to include left header and top header)
    //
    // flatPos = (rowIndex - 1) * dataHeight + (colIndex - 1)
    //
    let eligibleCellCount = dataHeight * dataWidth; // cell count

    function initOppoBoardFlatList() {
        for (let r = 0; r < totalHeight; r++) {
            for (let c = 0; c < totalWidth; c++) {
                oppoBoardFlatList.push([r, c]);
            }
        }
    }

    function positionOppoShips() {
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
                // let shipHeadPosition = randomInt(eligibleCellCount);
                // let shipHeadPosition = randomInt(eligibleCellCount);
                // console.log("=====================================================")
                // console.log("s =", s);
                // console.log("Ship size = ", oppoShipsFlatList[s]);
                shipHeadFlatPos = randomInt(eligibleCellCount); // (0, 1, ... , 99)
                // console.log("shipHeadFlatPos =", shipHeadFlatPos);
                // shipHeadRow = shipHeadFlatPos % dataHeight + 1;
                shipHeadRow = Math.floor(shipHeadFlatPos / dataHeight) + 1;
                shipHeadCol = shipHeadFlatPos - (shipHeadRow - 1) * dataHeight + 1;
                // console.log("shipHeadRow, shipHeadCol =", shipHeadRow, shipHeadCol);

                // 0 = top, 1 = right, 2 = bottom, 3 = left
                let shipTailDir = randomInt(4);
                // console.log("shipTailDir =", shipTailDir, "(0 = top, 1 = right, 2 = bottom, 3 = left)");
                // shipTailRow = shipHeadRow
                if (shipTailDir % 2 === 0) { // top or bottom
                    shipTailRow = shipHeadRow + (shipTailDir === 0 ? -1 : 1) * (oppoShipsFlatList[s] - 1);
                    // [shipHeadRow, shipTailRow] = [Math.max(shipHeadRow, shipTailRow)]
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
                            if (oppoBoard[r][c] !== 0 ||
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
                                oppoBoard[r][c] = 1;
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
        clearUserBoard();
        clearOppoBoard();

        initUserShips();

        if (whoBegins === "opponent") {
            oppoTurn = true;
            info = "opponent_move";
            // oppoMove();
        } else if (whoBegins === "user") {
            oppoTurn = false;
            info = 'user_move';
        } else {
            // info = 'lets_play';
        }

        // initOppoShips();


    }


    function startGame() {
        isGameOn = true;
        initOppoShips();

        info = 'game_on';
    }
    

    let oppoTurn = false;


    // let shipOptions = ['Select a ship', ...userShips];

    let moveCount = 0;

    let highlighted = false;


    // initialization
    restartGame();

    // GAME LOGIC TAIL ==============================>

</script>


<style>
    .who-plays-first {
        display: block;
        margin-top: 2em;
        /* min-width: 20em; */
    }

    /* Table with user ships data etc */
    .ship-list {
        display: block;
        /* display: flex; */
    }

    .ship-list-table {        
        margin-top: .5em;
        margin-bottom: 1em;
        border-collapse: collapse;      

        font-size: 1em;
        min-width: 10em;
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
        width: 2em;
        height: 2em;
        /* width: 30px;
        height: 30px; */
        /*
        padding: 0;
        margin: 0;
        */
    }
   
    .board-data {
        /* font-size: 1em; */ /* Use this option in development */
        font-size: 0; /* Use this option in production */
        font-weight: 100;

        height: 2em;
        width: 2em;
        vertical-align: center;
        text-align: center;
        background-color: lightskyblue;

        border-style: solid;
        border-width: 1px;
        border-color: gray;
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

    .ship-cell {
        border-style: none;
        background-color: cadetblue;
        font-size: 0;
    }




    .user {
        /* display: inline-block; */
        margin-left: 1em;
        margin-right: 2em;
        margin-top: 0;
        float: left;
    }

    .opponent {
        /* display: inline-block; */
        margin-left: 1em;
        margin-top: 0;
        float: right;
    }    

    /* .ship-select { */
    .ship-list {
        /* display: inline-block; */
        margin-top: .5em;
        float: right;
        margin-right: 1em;
        margin-bottom: 1em;
    }

    .ships-ready {
        background-color: lightgreen;
        color: blue;
        font-weight: bold;
    }

    .ships-underway {
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
        /* display: flex; */
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
        /* display: flex; */
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

    button.cool-button {
        display: block;
        background-color: aqua;
        color: blue;
        font-weight: bold;
        /* margin-top: 0; */
        margin-bottom: 1em;
        margin-left: auto;
        margin-right: auto;
    }

    button.cool-button:disabled {
        background-color: lightgray;
        color: gray;
    }    

    /* used by who-plays-first */
    .margin-after {
        margin-bottom: 1em;
    }

    .limited-width {
        max-width: 20em;
    }

    /* POPUP HEAD ==================================> */
    /* source: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_popup */

    /* Popup container - can be anything you want 
    .popup {
        position: relative;
        display: inline-block;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    } */

    /* The actual popup 
    .popup .popuptext {
        visibility: hidden;
        width: 160px;
        background-color: #555;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 8px 0;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -80px;
    } */

    /* Popup arrow 
    .popup .popuptext::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #555 transparent transparent transparent;
    } */

    /* Toggle this class - hide and show the popup 
    .popup .show {
        visibility: visible;
        -webkit-animation: fadeIn 1s;
        animation: fadeIn 1s;
    } */

    /* Add animation (fade in the popup) 
    @-webkit-keyframes fadeIn {
        from {opacity: 0;} 
        to {opacity: 1;}
    } */

    /*
    @keyframes fadeIn {
        from {opacity: 0;}
        to {opacity:1 ;}
    } */
    /* POPUP TAIL ==================================< */

    .cell-popup {
        position: absolute;
        z-index: 100;
        background-color: black;
        color: white;        
        padding: 0.5em;        
        border-radius: 5px;
        font-size: .8em;
    }

    .popup-hidden {
        visibility: hidden;
    }

    .popup-visible {
        visibility: visible;
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
                            class="{ getCellClass(rowIndex, colIndex, userBoard) }"                                                   
                        >
                            { @html rowIndex > 0 && colIndex > 0 ? num2char(cell) : cell }
                        </td>
                    {/each}
                </tr>
            {/each}
        </table>
    </div>

    <!-- HERE USER CAN CHECK USER SHIPS POSITIONED ON THE BOARD -->
    <!-- {#if !isUserBoardReady && whoBegins === null && curGame === gameId} -->
    <!-- {#if !isUserBoardReady && curGame === gameId} -->
    {#if !isGameOn && curGame === gameId}
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
            <WhoPlaysFirst on:whoBegins={handleWhoBegins} />
        </div>


        <!-- <div>&nbsp;</div> -->
    {/if}




    <!-- {#if isReadyToPlay && curGame === gameId} -->
    <!-- {#if isUserBoardReady && isOppoBoardReady && whoBegins !== null && curGame === gameId} -->
    <!-- {#if isUserBoardReady && isOppoBoardReady && whoBegins !== null && curGame === gameId} -->
    {#if isGameOn && curGame === gameId}
        <div class="opponent" transition:fade="{ {delay: 100, duration: 500} }">
            <h3 class="user-or-opponent">{ ui["opponent_ships"][language] }</h3>

            <!-- TABLE with OPPONENT's SHIPS -->
            <table class="board">
                <!-- Must use a key in #each loop -->
                {#each oppoBoard as row, rowIndex (rowIndex)}
                    <tr>
                        <!-- Must use a key in #each loop -->
                        {#each row as cell, colIndex 
                            (colIndex * dataHeight + colIndex)}
                            <td on:click={ () => fire(rowIndex, colIndex) }
                                class="{getCellClass(rowIndex, colIndex, oppoBoard)}"                         
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
    <!-- BUTTON -->
    <button class="cool-button" on:click={startGame} 
            disabled={!isUserBoardReady || whoBegins === null || isGameOn}
    >
        { ui['start_game'][language] }
    </button>            

    <!-- INFO TEXT -->
    <div class="info-text center unselectable margin-after"> 
        <!-- Do not remove &nbsp; -->
        { @html infoText } &nbsp;
    </div>      
</div>      




<p>&nbsp</p> <!-- dummy paragraph -->

<div id="cell-popup" class="cell-popup popup-{popupVisible ? 'visible' : 'hidden'}"
    style="left: {popupX}px; top: {popupY}px"
>
    { popupText }
</div>
