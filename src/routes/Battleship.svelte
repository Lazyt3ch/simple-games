<script>
    import { fade } from 'svelte/transition';
    
    import { languages, gameName, gameId, uiStrings as ui } from './ui/Battleship.js';
    // import { globalLanguage } from '../stores.js';

    // currentGame is a bugfix that disables transitions when routing
    import { globalLanguage, currentGame } from '../stores.js';

    import { onDestroy } from 'svelte';

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

    function newEmptyBoard() {
        let board = [];

        for (let r = 0; r < totalHeight; r++) {
            let row;
            if (r === 0) {
                row = [' '];
            } else {
                row = [alphabet.slice(r - 1, r)]; // row header
            }

            for (let c = 0; c < dataWidth; c++) {
                if (r === 0) {
                    row.push(c + 1); // column header
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


    function fire() {


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

    function recountUserShips() {

    }

    /*
    function isAnythingAround(rowIndex, colIndex) {
        for (let r = Math.max(1, rowIndex - 1); r < rowIndex + 1 && r < totalWidth; r++) {
            for (let c = Math.max(1, colIndex - 1); c < colIndex + 1 && c < totalHeight; c++) {

            }
        }

        return true;
    }
    */




    let userBoard = newEmptyBoard();
    let oppoBoard = newEmptyBoard();
    console.log("userBoard =", userBoard);
    console.log("oppoBoard =", oppoBoard);

    /*
    // For testing purposes only!
    userBoard[2][1] = 3;
    oppoBoard[9][0] = 1;
    console.log("TEST ----------------------");
    console.log("userBoard =", userBoard);
    console.log("oppoBoard =", oppoBoard);    
    */

    function getCellClass(rowIndex, colIndex) {
        return `
        ${colIndex % dataHeight === 0 && rowIndex > 0 ? 'thick-right-border' : ''}
        ${rowIndex % dataWidth === 0 && colIndex > 0 ? 'thick-bottom-border' : ''}
        ${colIndex === 0 && rowIndex === 0 ? 'no-top-left-borders' : ''}
        ${(colIndex === 0 || rowIndex === 0) && colIndex !== rowIndex 
            ? 'table-top-and-left-headers' : ''}
        ${(colIndex === 0 && colIndex === rowIndex) ? 'top-left-header-cell' : ''}
        `

        // table-top-and-left-headers
    }

    let isUserShipsPlaced = false;
    // let isUserShipsPlaced = true;    

    const ships = [        
        { class: 'battleship', size: 4, totalNumber: 1 },
        { class: 'cruiser',   size: 3, totalNumber: 2 },
        { class: 'destroyer', size: 2, totalNumber: 3 },
        { class: 'motorboat', size: 1, totalNumber: 4 },
    ]

    let userShips = [];

    function isValidCell(rowIndex, colIndex) {
        return (rowIndex > 0 && rowIndex < 11 && colIndex > 0 && colIndex < 11);
    }

    function isUnsafeAtCorners(rowIndex, colIndex) {      
        console.log("rowIndex, colIndex =", rowIndex, colIndex);
        
        // top left corner  
        if (isValidCell(rowIndex - 1, colIndex - 1) && userBoard[rowIndex - 1][colIndex - 1] !== 0) {
            return true;
        }

        // top right corner
        if (isValidCell(rowIndex - 1, colIndex + 1) && userBoard[rowIndex - 1][colIndex + 1] !== 0) {
            return true;
        }

        // bottom left corner  
        if (isValidCell(rowIndex + 1, colIndex - 1) && userBoard[rowIndex + 1][colIndex - 1] !== 0) {
            return true;
        }        

        // bottom right corner  
        if (isValidCell(rowIndex + 1, colIndex + 1) && userBoard[rowIndex + 1][colIndex + 1] !== 0) {
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
        if (rowIndex === 0 || colIndex === 0) return; // headers

        if (userBoard[rowIndex][colIndex] === 0) {  // empty cell
            if (isUnsafeAtCorners(rowIndex, colIndex)) {
                // alert("You cannot place a ship here!");
                showPopup(ui['cannot_position_here'][language]);
                return;
            }
            userBoard[rowIndex][colIndex] = 1; // ship-containing cell            
        } else if (userBoard[rowIndex][colIndex] === 1) { // ship-containing cell
            userBoard[rowIndex][colIndex] = 0;  // empty cell
        }

        userBoard = userBoard;
    }    


    function restartGame() {
        // userShips = JSON.parse(JSON.stringify(ships));
        userShips = [];
        // let shipIndex = 0;
        ships.forEach( ship => {
            let userShip = {
                class: ship.class,
                size: ship.size,
                totalNumber: ship.totalNumber,
                toBePositioned: ship.totalNumber,         
                // shipIndex: shipIndex,     
            }
            // shipIndex++;
            userShips.push(userShip);
        })

        console.log("userShips =", userShips);

    }

    restartGame();

    let shipOptions = ['Select a ship', ...userShips];

    // GAME LOGIC TAIL ==============================>

</script>


<style>
    .ship-list {        
        margin-top: .5em;
        border-collapse: collapse;      

        font-size: 1em;
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



    .board, .board-row, .board-data {
        /* border: 1px solid black; */
        border-collapse: collapse;        
        font-family: Arial, Helvetica, sans-serif;
        font-size: 1em;
        font-weight: 100;
    }

    .board {
        margin-top: 1em;
        background-color: inherit;        
    }

    .board-data {
        height: 2em;
        width: 2em;
        vertical-align: center;
        text-align: center;
        /* font-size: 3em;
        font-weight: bolder; */

        background-color: aquamarine;

        border-style: solid;
        border-width: 1px;
        border-color: gray;
    }

    .thick-bottom-border {
        border-bottom-color: black;
        border-bottom-width: 3px;
    }

    .thick-right-border {
        border-right-color: black;
        border-right-width: 3px;
    }    

    .no-top-left-borders {
        border-top-style: none;
        border-left-style: none;
    }

    .table-top-and-left-headers {
        background-color: lightsteelblue;
    }

    .top-left-header-cell {
        background-color: inherit;
        border-style: none;
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

    .ship-select {
        /* display: inline-block; */
        margin-top: .5em;
        float: right;
        margin-right: 1em;
        margin-bottom: 1em;
    }

    .center {
        margin-left: auto;
        margin-right: auto;
        text-align: center;
    }

    /*
    .margin-after {
        margin-bottom: 1em;
    }
    */

    .container {
        width: 100%;
        max-width: 70em;
        margin-top: 0.5em;
    }

    .user-or-opponent {
        text-align: center;
        margin: 0;
    }

    /*
    .leftish {
        float: left;
    }
    */

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

<div class="container">
    <div class="user">
        <h3 class="user-or-opponent">{ ui["user_ships"][language] }</h3>

        <!-- TABLE with USER's SHIPS -->
        <table class="board">
            {#each userBoard as row, rowIndex}
                <tr class="board-row">
                    {#each row as cell, colIndex}
                        <td on:click={ () => placeShip(rowIndex, colIndex) }
                            class="{getCellClass(rowIndex, colIndex)} board-data"                                                   
                        >
                            { @html rowIndex > 0 && colIndex > 0 ? num2char(cell) : cell }
                        </td>
                    {/each}
                </tr>
            {/each}
        </table>
    </div>

    <!-- HERE USER CAN ADD SHIPS ONTO THE BOARD -->
    {#if !isUserShipsPlaced && curGame === gameId}
        <div class='ship-select'>
            <h4 class="small-header">{ ui['select_ship_text'][language] }</h4>
            <!--
            <label for="ship-select" >                
            </label>    
            -->

            <!-- Ship class selector -->
            <select name="ship-class" 
                bind:value={selectedShipClass} 
            >
                {#each shipOptions as ship, index}
                    <option value="{index > 0 ? shipOptions[index].class : null}" 
                        disabled={index === 0}
                    >
                        { index > 0 ? ui[ship.class][language] : ui['select_ship'][language] } 
                    </option> 
                {/each}
            </select>

            <h4 class="small-header">{ ui['user_ships'][language] }</h4>

            <!-- TABLE TO DISPLAY HOW MANY USER SHIPS ARE AWAILABLE -->
            <table class="ship-list">
                <tr class="content-leftish ship-list-headers">
                    <th class="ship-list-data"> { ui['class'][language]} </th>
                    <th class="ship-list-data"> { ui['size'][language]} </th>       
                    <th class="ship-list-data"> { ui['total_number'][language]} </th>                             
                    <th class="ship-list-data"> { ui['to_be_positioned'][language]} </th>                             
                </tr>
                {#each userShips as userShip, index}
                    <tr>
                        <td class="ship-list-data content-leftish"> { ui[userShip.class][language] } </td>
                        <td class="ship-list-data content-rightish"> { userShip.size } </td>
                        <td class="ship-list-data content-rightish"> { userShip.totalNumber } </td>
                        <td class="ship-list-data content-rightish"> { userShip.toBePositioned } </td>
                    </tr>
                {/each}        
            </table>
        </div>

        <div>&nbsp;</div>
    {/if}

    {#if isUserShipsPlaced && curGame === gameId}}
        <div class="opponent" transition:fade="{{delay: 100, duration: 500}}">
            <h3 class="user-or-opponent">{ ui["opponent_ships"][language] }</h3>

            <!-- TABLE with OPPONENT's SHIPS -->
            <table class="board">
                {#each oppoBoard as row, rowIndex}
                    <tr class="board-row">
                        {#each row as cell, colIndex}
                            <td on:click={ () => fire(rowIndex, colIndex) }
                                class="{getCellClass(rowIndex, colIndex)} board-data"                         
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

<p>&nbsp</p> <!-- dummy paragraph -->

<div id="cell-popup" class="cell-popup popup-{popupVisible ? 'visible' : 'hidden'}"
    style="left: {popupX}px; top: {popupY}px"
>
    { popupText }
</div>