<script>    
    import { fade } from 'svelte/transition';
    
    import { languages, uiStrings } from './ui/TicTacToe.js';

    let language = languages[0].short;

    let moveCount = 0;

    // let gameBegan = false;

    let highlighted = false;

    let selectedLang;

    let oppoTurn = false;

    let info = 'lets_play';
    let infoText;

    let lastUserCell = null;

    // let userMoveAllowed = false;

    $: infoText = uiStrings[info][language];

  
    // &#x25CB;  // white circle in Unicode // use instead of 'o'
    // &times;  //                          // use instead of 'x'
    // &#x20DD;  // U+25EF = large circle in Unicode // use instead of 'o'
    // &#x274C;  // U+274C = cross in Unicode // use instead of 'x'

    // &#x2573;  // BOX DRAWINGS LIGHT DIAGONAL CROSS in Unicode // use instead of 'x'
    // &#x25EF;  // U+25EF = large circle in Unicode // use instead of 'o'
    const num2char = (num) => num === 0 ? ' ' : num > 0 ? '&#x2573;' : '&#x25EF;';

    const emptyBoard = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];

    let whoPlaysFirst = null;  // true if user plays first, otherwise false

    let board = null;

    let userNum, oppoNum;

    let isWin = false;
    let winnerCells = null;

    $: {
        // gameBegan = !(whoPlaysFirst === null);
        userNum = whoPlaysFirst === null ? 0 : (whoPlaysFirst === 'user' ? 1 : -1);
        oppoNum = -userNum;
        // oppoNum = gameBegan ? (whoPlaysFirst === 'opponent' ? 1 : -1) : 0;
    }

    $: {
        if (moveCount === 9) {
            whoPlaysFirst = null;
        }        
    }

    $: { 
        language = language;
    }

    $: {
        if (whoPlaysFirst !== null) {
            // showAlert(whoPlaysFirst);
        }
    }

    $: {
        if (isWin) {
            oppoTurn = true;
            winnerCells = winnerCells;
            // console.log("isWin, winnerCells =", isWin, winnerCells);
        }
    }

    function countMoves() {
        let emptyCells = 0;

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                emptyCells += (board[r][c] === 0 ? 1 : 0)
            }
        }

        return 9 - emptyCells;
    }

    function isGoodMark(r, c) { // rowIndex, colIndex
        // midside cell on top or bottom (r !== 1)
        if (c === 1  
            && (   (board[r][0] === board[r][2] && board[r][0] !== 0) // row
                || (board[2-r][1] === board[1][1] && board[2-r][1] !== 0) // center col
            )
            ) {
                console.log("midside cell on top or bottom");
                return true;                                                                
        }

        // midside cell on left side or right side (c !== 1)
        if (r === 1  
            && (   (board[0][c] === board[2][c] && board[0][c] !== 0) // col
                || (board[1][2-c] === board[1][1] && board[1][2-c] !== 0) // center row
            )
            ) {
                console.log("midside cell on left side or right side");
                return true;                                        
        }

        if (r !== 1 && c !== 1  // corner cell
            && (   (board[1][c] === board[2-r][c] && board[1][c] !== 0)   // col
                || (board[r][1] === board[r][2-c] && board[r][1] !== 0)  // row
                || (board[1][1] === board[2-r][2-c] && board[1][1] !== 0) // diagonals
            )
            ) {
                console.log("corner cell");
                return true;                                                              
        }

        return false;
    }

    function isWinnerCell(rowIndex, colIndex) {
        let result = (winnerCells !== null 
            && winnerCells.some(cell => (cell[0] === rowIndex && cell[1] === colIndex)));
        return result;
    }


    function randomInt(n) {
        return Math.floor(Math.random() * Math.floor(n));
    }


    function restartGame() {        
        board = JSON.parse(JSON.stringify(emptyBoard));

        if (whoPlaysFirst === "opponent") {
            oppoTurn = true;
            info = "opponent_move";
        } else {
            info = "user_move";
            oppoTurn = false;
        }
        
        moveCount = 0;
        // gameBegan = false;
        winnerCells = null;

        if (whoPlaysFirst === "opponent") {
            oppoMove();
            if (moveCount > 2) checkForWinner();
        } else if (whoPlaysFirst === "user") {
            info = 'user_move';
        } else {
            info = 'lets_play';
        }

        isWin = false;
    }  

    function userMove(rowIndex, colIndex) {
        if (oppoTurn) return;
        
        if (moveCount === 0 && whoPlaysFirst === "opponent") return;

        if (whoPlaysFirst === null) { 
            highlighted = true;
            setTimeout(() => highlighted = false, 2000);            
            return;
        }

        if (board[rowIndex][colIndex] === 0) {
            board[rowIndex][colIndex] = userNum;  
            moveCount++;   
            console.log("moveCount =", moveCount);
            oppoTurn = moveCount < 9 ? true : false;
            info = 'opponent_move';

            isWin = checkThree(3) || false;
            if (isWin) {                
                info = 'user_won';
                oppoTurn = true;
                whoPlaysFirst = null;

                // winnerCells = winnerCells; // for reactivity
                return;
            }

            if (moveCount === 9) {
                info = 'score_draw';
                whoPlaysFirst = null;
            } else {
                setTimeout(oppoMove, 1000);                
            }
        }
    }

    function markWinnerCells(winnerCells) {
        if (winnerCells === null || winnerCells.length !== 3) return;

        let num;

        oppoTurn = true;
        let repeats = 5;

        for (let h = 0; h < repeats; h++) {
            // console.log("h =", h);
            (function(h) {
                 setTimeout(function() {
                    for (let i = 0; i < 3; i++){
                        num = board[(winnerCells[i][0])][(winnerCells[i][1])];
                        num = (h % 2 === 0 ? num * 2 : num / 2);
                        board[(winnerCells[i][0])][(winnerCells[i][1])] = num;
                    }
                    // if (h === repeats - 1) oppoTurn = false;
                 }, h * 500);
            }(h));
        }        
    }

    function checkForWinner() {
        // let arrayOf3 = [0, 0, 0];
        // let check;

        // Checking each row
        for (let r = 0; r < 3; r++) {
            // arrayOf3 = [board[r][0], board[r][1], board[r][2]];
            // if (isWinningStreak(arrayOf3)) {
            if (isWinningStreak(board[r][0], board[r][1], board[r][2])) {
                winnerCells = [[r, 0], [r, 1], [r, 2]];
                return;
            }            
        }

        // Checking each column 
        for (let c = 0; c < 3; c++) {
            // arrayOf3 = [board[0][c], board[1][c], board[2][c]];
            // if (isWinningStreak(arrayOf3)) {
            if (isWinningStreak(board[0][c], board[1][c], board[2][c])) {
                winnerCells = [[0, c], [1, c], [2, c]];
                return;
            }
        }        

        // Checking each diagonal
        for (let i = 0; i < 2; i++) {
            // arrayOf3 = [board[2 - 2*i][0], board[1][1], board[2*i][2]];
            // if (isWinningStreak(arrayOf3)) {
            if (isWinningStreak(board[2 - 2*i][0], board[1][1], board[2*i][2])) {
                winnerCells = [[2 - 2*i, 0], [1, 1], [2*i, 2]];
                return;
            }
        }
    }

    // function isWinningStreak(arrayOf3) { // input: array of three numbers
    function isWinningStreak(c0, c1, c2) { // input: content of three cells
        // if (Math.max(...arrayOf3) === Math.min(...arrayOf3)) {
        // if (Math.max(c0, c1, c2) === Math.min(c0, c1, c2)) {
        if (Math.abs(c0 + c1 + c2) === 3) {
            // info = (arrayOf3[0] === oppoNum ? "opponent_won" : "user_won");
            info = (c0 === oppoNum ? "opponent_won" : "user_won");
            whoPlaysFirst = null;
            return true;
        } else {
            return false;
        }        
    }

    function checkThreeNumbers(either2or3) {


    }



    function checkThree(either2or3) {
        let threeNumbers;
        let minNum = 0;
        let maxNum = 0;
        let theSum;
        let absSum;
        let val;

        // Checking each row
        for (let row = 0; row < 3; row++) {
            theSum = 0; 
            minNum = 0;
            maxNum = 0;
            threeNumbers = [0, 0, 0];
            for (let col = 0; col < 3; col++) {
                // threeNumbers[col] = board[row][col];
                val = board[row][col];
                theSum += val;               
                minNum = Math.min(val, 0);
                maxNum = Math.max(val, 0);
            }

            absSum = Math.abs(theSum);

            if (absSum === either2or3 && (either2or3 === 2 || either2or3 === 3)) {
                winnerCells = [[row, 0], [row, 1], [row, 2]];
                if (either2or3 === 3) {
                    markWinnerCells(winnerCells);
                }
                return true;
            } else if (minNum === maxNum && theSum === oppoNum && either2or3 === 1) {
                // Opportunity found
                winnerCells = [[row, 0], [row, 1], [row, 2]]; 
                return true;
            }
        }

        // Checking each column 
        for (let col = 0; col < 3; col++) {
            let theSum = 0;
            for (let row = 0; row < 3; row++) {
                theSum += board[row][col]
            }
            if (Math.abs(theSum) === either2or3) {
                winnerCells = [[0, col], [1, col], [2, col]];
                if (either2or3 === 3) {
                    markWinnerCells(winnerCells);
                }
                return true;
            }
        }

        // Checking diagonal one
        if (Math.abs(board[0][0] + board[1][1] + board[2][2]) === either2or3) {
            winnerCells = [[0, 0], [1, 1], [2, 2]];
            if (either2or3 === 3) {
                markWinnerCells(winnerCells);
            }
            return true;

        }

        // Checking diagonal two
        if (Math.abs(board[0][2] + board[1][1] + board[2][0]) === either2or3) {
            winnerCells = [[0, 2], [1, 1], [2, 0]];
            if (either2or3 === 3) {
                markWinnerCells(winnerCells);
            }
            return true;
        }
    }


    function oppoMove() {
        oppoTurn = true; // To prevent the user from making a move out of turn
        info = 'opponent_move';

        let rowIndex, colIndex;

        if (moveCount === 8) {
            info = "score_draw";
            whoPlaysFirst = null;

            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if (board[r][c] === 0) {
                        board[r][c] = oppoNum;
                        return;
                    }
                }
            }
        }

        setTimeout(function() {
            // If the very first move, mark any corner
            if (moveCount === 0) {
                let corner = randomInt(4);

                if (corner == 0) {
                    rowIndex = 0;
                    colIndex = 0;
                } else if (corner = 1) {
                    rowIndex = 0;
                    colIndex = 2;
                } else if (corner = 2) {
                    rowIndex = 2;
                    colIndex = 0;
                } else if (corner = 3) {
                    rowIndex = 2;
                    colIndex = 2;
                }

                board[rowIndex][colIndex] = oppoNum;        
                console.log("rowIndex, colIndex =", rowIndex, colIndex);
                console.log("board =", board);

                moveCount++;
                console.log("moveCount =", moveCount);
                info = 'user_move';
                oppoTurn = false;
                return;
            }

            // If a later move, look for your own or your opponent's to-be-complete streak
            if (moveCount < 9) {                
                // moveCount++;

                if (board[1][1] === 0  // center cell
                    && (   (board[0][0] === board[2][2] && board[0][0] !== 0)
                        || (board[0][2] === board[2][0] && board[0][2] !== 0)
                        || (board[1][0] === board[1][2] && board[1][0] !== 0)
                        || (board[0][1] === board[2][1] && board[0][1] !== 0)   
                    )
                ) {
                        board[1][1] = oppoNum;        
                        info = 'user_move';    
                        moveCount++;            
                        oppoTurn = false;
                        return;                    
                }          

                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        if (board[r][c] === 0) { // maybe we should mark this empty cell?                            
                            if (isGoodMark(r, c)) {
                                board[r][c] = oppoNum;            
                                moveCount++;           
                                info = 'user_move'; 
                                oppoTurn = false;
                                return;                                   
                            }                            
                        }
                    }
                }

                /*
                if (checkThree(2)) {
                    if (winnerCells !== null && winnerCells.length === 3) {
                        let oppoCellCount = 0;
                        for (let i = 0; i < 3; i++) {
                            if (board[(winnerCells[i][0])][(winnerCells[i][1])] === 0) {
                                // Empty cell found
                                board[(winnerCells[i][0])][(winnerCells[i][1])] = oppoNum;

                                moveCount++;
                                if (moveCount < 9) info = 'user_move';
                            } 
                            
                            if (board[(winnerCells[i][0])][(winnerCells[i][1])] === oppoNum) {
                                oppoCellCount++;
                            }
                        }

                        console.log("oppoCellCount =", oppoCellCount);
                        oppoTurn = false;
                        if (oppoCellCount === 3) {
                            isWin = true;
                            oppoTurn = true;
                            info = "opponent_won";
                            whoPlaysFirst = null;
                            markWinnerCells(winnerCells);
                        }
                        return;
                    }
                }
                */
            } else {
                whoPlaysFirst = null;
                return;
            }

            while (true) {
                rowIndex = randomInt(3);
                colIndex = randomInt(3);
                console.log("rowIndex, colIndex =", rowIndex, colIndex);
                if (board[rowIndex][colIndex] === 0) {
                    board[rowIndex][colIndex] = oppoNum;
                    moveCount++;
                    console.log("moveCount =", moveCount);
                    // isWin = checkThree(3);

                    isWin = checkThree(3) || false;
                    // console.log("isWin, winnerCells =", isWin, winnerCells);
                    if (isWin) {
                        oppoTurn = true;
                        info = 'opponent_won';
                        whoPlaysFirst = null;
                        return;
                    }

                    if (moveCount < 9) info = 'user_move';
                    oppoTurn = false;
                    return;
                }
            }     

        }, 500);   
    }

    // initialization
    restartGame();

</script>


<style>
    table, tr, td {
        border: 1px solid black;
        border-collapse: collapse;        
        font-family: Arial, Helvetica, sans-serif;
    }

    table {
        margin-top: 1em;
        background-color: aquamarine;
    }

    td {
        height: 2em;
        width: 2em;
        vertical-align: center;
        font-size: 3em;
        font-weight: bolder;
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

    .limited-width {
        max-width: 20em;
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
        background-color: #cccccc;
        color: #666666;        
    }

    .left-margin {
        margin-left: 5%;
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

<!-- Table -->
<table class="center margin-after">
    {#each board as row, rowIndex}
        <tr>
            {#each row as cell, colIndex}
                <td on:click={ () => userMove(rowIndex, colIndex) }
                    class="{cell === 2 || cell === -2 ? 'winner' : ''}"
                            
                >
                    { @html num2char(cell) }
                </td>
            {/each}
        </tr>
    {/each}
</table>

<!-- Buttons -->
<div class="center margin-after">
    <button class="cool-button" on:click={restartGame} disabled={whoPlaysFirst === null}>
        { uiStrings['start_game'][language] }
    </button>

    <button class="cool-button" on:click={restartGame} disabled={whoPlaysFirst === null}>
        { uiStrings['restart_game'][language] }
    </button>
</div>

<!-- Info Text -->
<h2 class="center"> 
    <!-- Do not remove &nbsp; -->
    { infoText } &nbsp;
</h2>

<!-- Who Plays First radio buttons etc -->
{#if whoPlaysFirst === null}
    <fieldset id='who-plays-first' transition:fade="{{delay: 300, duration: 800}}"
        class="limited-width margin-after {highlighted? 'highlighted': ''}"
        on:change={() => oppoTurn = true}    
    >
        <label> { uiStrings['who_plays_first'][language] } </label>
        
        <div class="div-inline">
            <label for="user-begins"> 
                <input type='radio' bind:group={whoPlaysFirst} 
                    id='user-begins' name="who-begins" value='user'>
                { uiStrings['user_begins'][language] } 
            </label>

            <label for="opponent-begins" class="left-margin">
                <input type='radio' bind:group={whoPlaysFirst} 
                    id='opponent-begins' name="who-begins" value='opponent'>
                { uiStrings['opponent_begins'][language] } 
            </label>
        </div>
    </fieldset>
{/if}

