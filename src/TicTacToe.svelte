<script>    
    import { fade } from 'svelte/transition';
    
    import { languages, uiStrings } from './ui/TicTacToe.js';

    // const gameName = "Tic Tac Toe";

    // let language = 'en';
    let language = languages[0].short;
    console.log("language, languages =", language, languages);

    let moveCount = 0;

    let gameBegan = false;

    let highlighted = false;

    let selectedLang;

    let oppoTurn = false;

    let infoText = uiStrings["lets_play"][language];
    // uiStrings['make_your_move'][language]
    // <!-- { uiStrings['game_on'][language] } { uiStrings['make_your_move'][language] } -->

    const X = "x", O = "o", E = " ";
    const XW = "X", OW = "O"; // winner cells


    const emptyBoardNumeric = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];

    const emptyBoard = [
        [E, E, E],
        [E, E, E],
        [E, E, E],
    ];



//    let whoPlaysFirst = false;  // true if user plays first, otherwise false
    let whoPlaysFirst = null;  // true if user plays first, otherwise false

    let board = null;
    let boardNumeric = null;
    // board = clearBoard();

    let userChar, oppoChar;
    let userNum, oppoNum;

    let isWin = false;
    let winnerCells = null;

    $: {
        gameBegan = (whoPlaysFirst === null ? false : true);
        userChar = gameBegan ? (whoPlaysFirst === 'user' ? X : O) : ' ';
        userNum = gameBegan ? (whoPlaysFirst === 'user' ? 1 : -1) : 0;
        oppoChar = gameBegan ? (whoPlaysFirst === 'opponent' ? X : O) : ' ';
        oppoNum = gameBegan ? (whoPlaysFirst === 'opponent' ? 1 : -1) : 0;
        console.log("gameBegan, userChar =", gameBegan, userChar);
    }

    $: { 
        console.log(language);
    }

    $: {
        if (whoPlaysFirst !== null) {
            // showAlert(whoPlaysFirst);

        }
    }

    $: {
        if (isWin) {
            winnerCells = winnerCells;
            console.log("isWin, winnerCells =", isWin, winnerCells);
            // winnerCells = winnerCells;
            // board = board;
        }
    }

    function isWinnerCell(rowIndex, colIndex) {
        let result = winnerCells !== null 
            && winnerCells.some(cell => (cell[0] === rowIndex && cell[1] === colIndex));
        console.log("FUNCTION isWinnerCell:  row, col, result =", rowIndex, colIndex, result);
        return result;
    }


    function random012() {
        return Math.floor(Math.random() * Math.floor(3));
    }


    function restartGame() {        
        board = JSON.parse(JSON.stringify(emptyBoard));
        boardNumeric = JSON.parse(JSON.stringify(emptyBoardNumeric));

        if (whoPlaysFirst === "opponent") {
            oppoTurn = true;
        }

        setTimeout(function() {
            // console.log("board =", board);
            // whoPlaysFirst = null;
            moveCount = 0;
            gameBegan = false;
            winnerCells = null;

            isWin = false;
            board = board; // for reactivity
            winnerCells = winnerCells; // for reactivity

            if (whoPlaysFirst === "opponent") {
                oppoMove();
            } else if (whoPlaysFirst === "user") {
                infoText = uiStrings['make_your_move'][language];
            } else {
                infoText = uiStrings['lets_play'][language];
            }

        }, 1500);

    }  
    

    function markCell(rowIndex, colIndex) {
        if (oppoTurn) return;

        console.log("FUNCTION:  markCell");
        console.log("whoPlaysFirst =", whoPlaysFirst);
        if (whoPlaysFirst === null) { 
            highlighted = true;
            setTimeout(() => highlighted = false, 2000);            
            return;
        }

        // let userChar = whoPlaysFirst ? 'X' : 'O';
        if (board[rowIndex][colIndex] === E) {
            console.log("Trying to mark the cell...")
            console.log("userChar =", userChar);
            board[rowIndex][colIndex] = userChar;  
            boardNumeric[rowIndex][colIndex] = userNum;  

            isWin = checkThree() || false;
            console.log("isWin, winnerCells =", isWin, winnerCells);
            if (isWin) {                
                // alert(uiStrings['user_won'][language]);
                infoText = uiStrings['user_won'][language];
                whoPlaysFirst = null;

                board = board; // for reactivity
                winnerCells = winnerCells; // for reactivity
                return;
            }

            moveCount++;

            setTimeout(oppoMove, 1000);

            // oppoMove();

            if (moveCount === 9) {
                // alert(uiStrings['score_draw'][language]);
                infoText = uiStrings['score_draw'][language];
            }
        }
    }

    function markWinnerCells(winnerCells) {
        if (winnerCells === null || winnerCells.length !== 3) return;

        let cellContent;

        for (let i = 0; i < 3; i++) {
            cellContent = board[(winnerCells[i][0])][(winnerCells[i][1])];
            board[(winnerCells[i][0])][(winnerCells[i][1])] = cellContent.toUpperCase();
        }
    }

    function checkThree(rowIndex, colIndex) {
        // Checking each row
        for (let row = 0; row < 3; row++) {
            let theSum = 0;
            for (let col = 0; col < 3; col++) {
                theSum += boardNumeric[row][col]
            }
            if (Math.abs(theSum) === 3) {
                winnerCells = [[row, 0], [row, 1], [row, 2]];
                
                // Tentative
                markWinnerCells(winnerCells);

                // isWin = true
                return true; // isWin         
            }
        }

        // Checking each column 
        for (let col = 0; col < 3; col++) {
            let theSum = 0;
            for (let row = 0; row < 3; row++) {
                theSum += boardNumeric[row][col]
            }
            if (Math.abs(theSum) === 3) {
                winnerCells = [[0, col], [1, col], [2, col]];

                // Tentative
                markWinnerCells(winnerCells);

                return true; // isWin           
            }
        }

        // Checking diagonal one
        if (Math.abs(boardNumeric[0][0] + boardNumeric[1][1] + boardNumeric[2][2]) === 3) {
            winnerCells = [[0, 0], [1, 1], [2, 2]];

            // Tentative
            markWinnerCells(winnerCells);

            return true; // isWin
        }

        // Checking diagonal two
        if (Math.abs(boardNumeric[0][2] + boardNumeric[1][1] + boardNumeric[2][0]) === 3) {
            winnerCells = [[0, 2], [1, 1], [2, 0]];

            // Tentative
            markWinnerCells(winnerCells);

            return true; // isWin
        }
    }


    function oppoMove() {
        oppoTurn = true; // To prevent the user from making a move out of turn

        infoText = uiStrings["opponent_move"][language];
        while (true) {
            setTimeout(function() {}, 4000); // pause
            let rowIndex = random012();
            let colIndex = random012();
            if (boardNumeric[rowIndex][colIndex] === 0) {
                boardNumeric[rowIndex][colIndex] = oppoNum;
                board[rowIndex][colIndex] = oppoChar;
                moveCount++;
                checkThree();

                isWin = checkThree(rowIndex, colIndex) || false;
                console.log("isWin, winnerCells =", isWin, winnerCells);
                if (isWin) {
                    // alert(uiStrings['opponent_won'][language]);
                    infoText = uiStrings['opponent_won'][language];
                    whoPlaysFirst = null;
                    return;
                }
                infoText = uiStrings["make_your_move"][language];
                oppoTurn = false;
                return;
            }
        }

        
    }

    restartGame();


</script>


<style>
    table, tr, td {
        border: 1px solid black;
        border-collapse: collapse;
    }

    td {
        height: 2em;
        width: 2em;
        vertical-align: center;
        font-size: 3em;
    }

    .winner {
        font-weight: 200;
        background-color: yellow;
        color: blue;
        font-weight: bolder;
    }

    .center {
        margin-left: auto;
        margin-right: auto;
        text-align: center;
    }

    .rightish {
        margin-left: 70%;
        margin-right: auto;
        text-align: left;
    }

    .margin-after {
        margin-bottom: 1em;
    }

    button.cool-button {
        background-color: aqua;
        color: blue;
        font-weight: bold;
        margin-left: 1em;
        margin-right: 1em;
    }

    fieldset {
        margin-left: auto;
        margin-right: auto;
        max-width: 40%;
    }

    .highlighted {
        background: yellow;
        color: blue;
    }

    button:disabled {
        /* background-color: lightgray;
        color: gray; */
        background-color: #cccccc;
        color: #666666;        
    }


</style>


<h1 class="center">{ uiStrings['game_name'][language] }</h1>

<label for="language-select" class="rightish">
    &nbsp;
    <select name="language" id="language-select" 
        bind:value={selectedLang} on:change={() => language = selectedLang}
    >
        {#each languages as lang}
            <option value="{lang.short}"> { lang.full } </option>
        {/each}
    </select>
</label>

<!-- The Tic Tac Toe Table -->
<table class="center margin-after">
    {#each board as row, rowIndex}
        <tr>
            {#each row as cell, colIndex}
                <td on:click={ () => markCell(rowIndex, colIndex) }
                    class={cell === XW || cell === OW ? 'winner' : ''}
                >
                    { cell } 
                </td>
            {/each}
        </tr>
    {/each}
</table>

<div class="center margin-after">
    <button class="cool-button" on:click={restartGame} disabled={whoPlaysFirst === null}>
        { uiStrings['start_game'][language] }
    </button>

    <button class="cool-button" on:click={restartGame} disabled={whoPlaysFirst === null}>
        { uiStrings['restart_game'][language] }
    </button>
</div>

<h2 class="center"> 
    <!-- Do not remove &nbsp; -->
    { infoText } &nbsp;
</h2>

{#if whoPlaysFirst === null}
<!-- {#if !gameBegan} -->
    <fieldset id='who-plays-first' transition:fade="{{delay: 300, duration: 800}}"
        class="margin-after {highlighted? 'highlighted': ''}">
        <label> { uiStrings['who_plays_first'][language] } </label>
        
        <div class="div-inline">
            <label for="user-begins">
                <input type='radio' bind:group={whoPlaysFirst} 
                    id='user-begins' name="who-begins" value='user'>
                { uiStrings['user_begins'][language] } 
            </label>

            <label for="opponent-begins">
                <input type='radio' bind:group={whoPlaysFirst} 
                    id='opponent-begins' name="who-begins" value='opponent'>
                { uiStrings['opponent_begins'][language] } 
            </label>
        </div>
    </fieldset>
{/if}


