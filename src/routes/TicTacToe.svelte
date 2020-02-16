<script>    
    // import { onDestroy } from 'svelte';

    import { fade } from 'svelte/transition';
    
    import { languages, gameName, gameId, uiStrings as ui } from './ui/TicTacToe.js';

    // currentGame is a bugfix that disables transitions when routing
    import { globalLanguage, currentGame } from '../stores.js';

    /*
    let isAlive = true;

    onDestroy(() => {
        console.log('the component is being destroyed');
        isAlive = false;
    });
    */

    let language;
    
    console.log("TicTacToe:  $globalLanguage =", $globalLanguage);

	const unsubscribe = globalLanguage.subscribe(value => {
        language = value;        
		console.log("TicTacToe:  language =", language);
    });    
    
    // currentGame is a bugfix that disables transitions when routing
    let curGame;
	const unsubscribe2 = currentGame.subscribe(value => {
        curGame = value;        
		console.log("TicTacToe:  curGame, gameId =", curGame, " &", gameId);
	});    

    let moveCount = 0;

    let highlighted = false;

    let oppoTurn = false;

    let info = 'lets_play';
    let infoText;

    let lastUserCell = null;

    $: infoText = ui[info][language];

  
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

    let whoPlaysFirst = null;  // "user" if user plays first, otherwise "opponent"

    let board = null;

    let userNum, oppoNum;

    let streak = null;

    $: {
        userNum = whoPlaysFirst === null ? 0 : (whoPlaysFirst === 'user' ? 1 : -1);
        oppoNum = -userNum;
    }

    $: {
        if (moveCount === 9) {
            whoPlaysFirst = null;
        }        
    }

    function isMustHaveSpot(r, c, num) { // rowIndex, colIndex, and number (userNum or oppoNum)
        // midside cell on top or bottom (r !== 1)
        if (c === 1) { 
            if (board[r][0] === board[r][2] && board[r][0] === num) { // row
                console.log("midside cell on top or bottom");
                if (num === oppoNum) {
                    streak = [[r, 0], [r, 1], [r, 2]];
                }
                return true;                                                           
            } 

            if (board[2-r][1] === board[1][1] && board[2-r][1] === num) { // center col
                console.log("midside cell on top or bottom");
                if (num === oppoNum) {
                    streak = [[0, 1], [1, 1], [2, 1]];
                }
                return true;                                                          
            } 
        }  

        // midside cell on left side or right side (c !== 1)
        if (r === 1) {
            if (board[0][c] === board[2][c] && board[0][c] === num) { // col
                console.log("midside cell on left side or right side");
                if (num === oppoNum) {
                    streak = [[0, c], [1, c], [2, c]];
                }
                return true;                                        
            } 

            if (board[1][2-c] === board[1][1] && board[1][2-c] === num) { // center row
                console.log("midside cell on left side or right side");
                if (num === oppoNum) {
                    streak = [[1, 0], [1, 1], [1, 2]];
                }
                return true;                                                          
            } 
        }

        // corner cell
        if (r !== 1 && c !== 1) {
            if (board[1][c] === board[2-r][c] && board[1][c] === num) { // column
                console.log("corner cell - column - isMustHaveSpot");
                if (num === oppoNum) {
                    streak = [[0, c], [1, c], [2, c]];
                }
                return true;                                                          
            }   

            if (board[r][1] === board[r][2-c] && board[r][1] === num) { // row
                console.log("corner cell - row - isMustHaveSpot");
                if (num === oppoNum) {
                    streak = [[r, 0], [r, 1], [r, 2]];
                }
                return true;                                                          
            }   

            if (board[1][1] === board[2-r][2-c] && board[1][1] === num) { // diagonals
                console.log("corner cell - diagonal - isMustHaveSpot");
                console.log("num, oppoNum =", num, oppoNum);
                if (num === oppoNum) {                    
                    streak = [[r, c], [1, 1], [2 - r, 2 - c]];
                    console.log("streak =", streak);
                }
                return true;                                                          
            }   
        } 
        return false;
    }

    function isGoodSpot(r, c) { // rowIndex, colIndex
        // midside cell on top or bottom (r !== 1)
        if (c === 1  
            && ((   (board[r][0] === oppoNum && board[r][2] === 0)  // row
                 || (board[r][2] === oppoNum && board[r][0] === 0))  // row
              || (  (board[2-r][1] === oppoNum && board[1][1] === 0)  // center column
                 || (board[1][1] === oppoNum && board[2-r][1] === 0)) // center column
            )) {
                console.log("midside cell on top or bottom");
                return true;                                                                
        }

        // midside cell on left side or right side (c !== 1)
        if (r === 1  
            && ((   (board[0][c] === oppoNum && board[2][c] === 0)  // column
                 || (board[2][c] === oppoNum && board[0][c] === 0))  // column
              || (  (board[1][2-c] === oppoNum && board[1][1] === 0) // center row
                 || (board[1][1] === oppoNum && board[1][2-c] === 0)) // center row
            )) {
                console.log("midside cell on top or bottom");
                return true;                                                                
        }

        if (r !== 1 && c !== 1  // corner cell
            && ((   (board[1][c] === oppoNum && board[2-r][c] === 0)   // column
                 || (board[2-r][c] === oppoNum && board[1][c] === 0))  // column
              || (  (board[r][1] === oppoNum && board[r][2-c] === 0)   // row
                 || (board[r][2-c] === oppoNum && board[r][1] === 0))  // row
              || (  (board[1][1] === oppoNum && board[2-r][2-c] === 0) // diagonals
                 || (board[2-r][2-c] === oppoNum && board[1][1] === 0)) // diagonals
            )) {
                console.log("corner cell");
                return true;                                                              
        }
        return false;        
    }

    function randomInt(n) {
        return Math.floor(Math.random() * Math.floor(n));
    }

    function restartGame() {        
        board = JSON.parse(JSON.stringify(emptyBoard));

        moveCount = 0;
        streak = null; 

        if (whoPlaysFirst === "opponent") {
            oppoTurn = true;
            info = "opponent_move";
            oppoMove();
        } else if (whoPlaysFirst === "user") {
            oppoTurn = false;
            info = 'user_move';
        } else {
            info = 'lets_play';
        }
    }  

    function userMove(rowIndex, colIndex) {
        if (whoPlaysFirst === null) { 
            highlighted = true;
            setTimeout( () => highlighted = false, 1000 );            
            return;
        }

        if (oppoTurn) return;        
        if (moveCount === 0 && whoPlaysFirst === "opponent") return;

        if (board[rowIndex][colIndex] === 0) {
            board[rowIndex][colIndex] = userNum;  
            moveCount++;   
            console.log("moveCount =", moveCount);

            if (isWinnerFound()) {                
                info = 'user_won';
                oppoTurn = true; // To block X/O marking by user
                whoPlaysFirst = null;
                return;
            }            

            if (moveCount === 9) { 
                // Nobody won, and no more empty cells are left
                info = 'score_draw';
                whoPlaysFirst = null;
            } else {
                oppoTurn = true;
                info = 'opponent_move';                
                setTimeout(oppoMove, 500);                
            }
        }
    }

    function flashStreak() {        
        // Adds flashing effect, which is applied to three winning X's (or O's)

        console.log("FUNCTION: flashStreak");
        console.log("streak =", streak);

        if (streak === null || streak.length !== 3) return;

        let num;

        oppoTurn = true;
        let repeats = 5;

        for (let h = 0; h < repeats; h++) {
            (function(h) {
                 setTimeout(function() {
                    for (let i = 0; i < 3; i++){
                        num = board[(streak[i][0])][(streak[i][1])];
                        num = (h % 2 === 0 ? num * 2 : num / 2);
                        board[(streak[i][0])][(streak[i][1])] = num;
                        console.log(board[(streak[i][0])][(streak[i][1])]);
                        board = board; // for reactivity
                        console.log("FLASHING:  h =", h);
                    }
                 }, h * 500);
            }(h));
        }        
    }

    function isWinnerFound() {
        console.log("FUNCTION: isWinnerFound");

        // Checking each row
        for (let r = 0; r < 3; r++) {
            if (isWinningStreak(board[r][0], board[r][1], board[r][2])) {
                console.log("winner found - isWinnerFound");
                streak = [[r, 0], [r, 1], [r, 2]];
                flashStreak();                
                return true;
            }            
        }

        // Checking each column 
        for (let c = 0; c < 3; c++) {
            if (isWinningStreak(board[0][c], board[1][c], board[2][c])) {
                console.log("winner found - isWinnerFound");
                streak = [[0, c], [1, c], [2, c]];
                flashStreak();
                return true;
            }
        }        

        // Checking each diagonal
        for (let i = 0; i < 2; i++) {
            if (isWinningStreak(board[2 - 2 * i][0], board[1][1], board[2 * i][2])) {
                console.log("winner found - isWinnerFound");
                streak = [[2 - 2 * i, 0], [1, 1], [2 * i, 2]];
                console.log("streak =", streak);
                flashStreak();
                return true;
            }
        }

        return false; // Nobody won (yet, or at all)
    }

    function isWinningStreak(c0, c1, c2) { // input: content of three cells
        console.log("c0, c1, c2 =", c0, c1, c2);
        if (Math.abs(c0 + c1 + c2) === 3) {
            info = (c0 === oppoNum ? "opponent_won" : "user_won");
            whoPlaysFirst = null;
            return true;
        }        
        
        return false;
    }

    function moveOne() {
        let rowIndex, colIndex;
        [rowIndex, colIndex] = [[0, 0], [0, 2], [2, 0], [2, 2]][randomInt(4)];
        board[rowIndex][colIndex] = oppoNum;        
        moveCount++;
        console.log("moveCount =", moveCount);
        info = 'user_move';
        oppoTurn = false; // Unblocking X/O marking by user
    }

    function isMoveTwoOkay() {
        // Checking corners for user's X
        if (board[0][0] === userNum || board[0][2] === userNum
        ||  board[2][0] === userNum || board[2][2] === userNum) {
            board[1][1] = oppoNum; // Marking the center cell
            moveCount++;
            console.log("moveCount =", moveCount);
            info = 'user_move';
            oppoTurn = false; // Unblocking X/O marking by user
            return true;
        }     
        return false;       
    }

    function isMoveFourOkay() {
        let rowIndex, colIndex;
        if (    board[1][1] === oppoNum 
             && (  (board[0][0] === userNum && board[2][2] === userNum) 
                || (board[0][2] === userNum && board[2][0] === userNum))
        ) {
            // Take any midside cell
            [rowIndex, colIndex] = [[0, 1], [1, 0], [2, 1], [1, 2]][randomInt(4)];
            board[rowIndex][colIndex] = oppoNum;        
            moveCount++;
            console.log("moveCount =", moveCount);
            info = 'user_move';
            oppoTurn = false; // Unblocking X/O marking by user
            return true;
        }
        return false;
    }

    function moveNine() {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === 0) {
                    board[r][c] = oppoNum;
                    info = isWinnerFound() ? "opponent_won" : "score_draw";
                    whoPlaysFirst = null;
                }
            }
        }        
    }

    function isOppoStreakOkay() {
        // Look for opponent's to-be-complete streak
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === 0) { // maybe opponent should mark this empty cell?                            
                    if (isMustHaveSpot(r, c, oppoNum)) {
                        board[r][c] = oppoNum;            
                        moveCount++;           

                        if (isWinnerFound()) {
                            console.log("winner found!");
                            oppoTurn = true;
                            info = 'opponent_won';
                            whoPlaysFirst = null;                                    
                        } else {
                            info = 'user_move'; 
                            oppoTurn = false;                                                              
                        }

                        return true;
                    }                            
                }
            }
        }      
        return false;  
    }

    function isUserStreakPreventionOkay() {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === 0) { // maybe opponent should mark this empty cell?                            
                    if (isMustHaveSpot(r, c, userNum)) {
                        board[r][c] = oppoNum;            
                        moveCount++;           
                        info = 'user_move'; 
                        oppoTurn = false;
                        return true;                                   
                    }                            
                }
            }
        }      
        return false;              
    }

    function isStreakAttemptOkay() {
        // Look for opportunity to build a streak
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === 0) { // maybe opponent should mark this empty cell?                            
                    if (isGoodSpot(r, c)) {
                        board[r][c] = oppoNum;            
                        moveCount++;           
                        info = 'user_move'; 
                        oppoTurn = false;
                        return true;                                   
                    }                            
                }
            }
        }
        return false;
    }

    function moveRandom() {
        let rowIndex, colIndex;
        while (true) {
            rowIndex = randomInt(3);
            colIndex = randomInt(3);
            console.log("rowIndex, colIndex =", rowIndex, colIndex);
            if (board[rowIndex][colIndex] === 0) {
                board[rowIndex][colIndex] = oppoNum;
                moveCount++;
                console.log("moveCount =", moveCount);

                if (isWinnerFound()) {
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
    }

    function oppoMove() {
        oppoTurn = true; // To prevent the user from making a move out of turn
        info = 'opponent_move';

        setTimeout(function() {            
            if (moveCount === 8) { // Only one empty cell is left
                moveNine();
                return;
            }

            if (moveCount === 0) { // If the very first move, mark any corner
                moveOne();
                return;
            }

            if (moveCount === 1) { // After user made the very first move
                // Checking corners for user's X
                if (isMoveTwoOkay()) return;
            }

            if (moveCount === 3) {
                if (isMoveFourOkay()) return;
            }

            // A later move, except for above-mentioned ones
            if (moveCount < 9) {                
                // Look for opponent's to-be-complete streak
                if (isOppoStreakOkay()) return;
                
                // Look for user's to-be-complete streak
                if (isUserStreakPreventionOkay()) return;
                
                // Look for opportunity to try and build a streak
                if (isStreakAttemptOkay()) return;
            } else {
                whoPlaysFirst = null;
                return;
            }

            // If nothing has worked so far, opponent will try and make a random move
            moveRandom();
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

    /*
    .rightish {
        margin-left: 70%;
        margin-right: auto;
        text-align: left;
    }
    */

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

    button.cool-button:disabled {
        background-color: lightgray;
        color: gray;
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

    .unselectable {
        -moz-user-select: -moz-none;
        -khtml-user-select: none;
        -webkit-user-select: none;
        -o-user-select: none;
        user-select: none;
    }    
</style>


<!-- GAME NAME -->
<!-- <h1 class="center">{ gameName[language] }</h1> -->

<!-- TABLE -->
<table class="center margin-after">
    {#each board as row, rowIndex}
        <tr>
            {#each row as cell, colIndex}
                <td on:click={ () => userMove(rowIndex, colIndex) }
                    class="{cell === 2 || cell === -2 ? 'winner' : ''} unselectable"                            
                >
                    { @html num2char(cell) }
                </td>
            {/each}
        </tr>
    {/each}
</table>

<!-- BUTTONS -->
<div class="center margin-after">
    <button class="cool-button" on:click={restartGame} disabled={whoPlaysFirst === null}>
        { ui['start_game'][language] }
    </button>

    <button class="cool-button" on:click={restartGame} disabled={whoPlaysFirst === null}>
        { ui['restart_game'][language] }
    </button>
</div>

<!-- INFO TEXT -->
<h2 class="center unselectable"> 
    <!-- Do not remove &nbsp; -->
    { infoText } &nbsp;
</h2>

<!-- WHO PLAYS FIRST radio buttons etc -->
<!-- The fade transition messes up with routing, so use currentGame as a bugfix!!! -->
<!-- {#if whoPlaysFirst === null && isAlive} -->
{#if whoPlaysFirst === null && curGame === gameId} 
    <fieldset id='who-plays-first' transition:fade="{{delay: 100, duration: 500}}"
        class="limited-width margin-after {highlighted? 'highlighted': ''}"
        on:change={() => oppoTurn = true}    
    >
        <label class="unselectable"> { ui['who_plays_first'][language] } </label>
        
        <div class="div-inline">
            <label for="user-begins" class="unselectable"> 
                <input type='radio' bind:group={whoPlaysFirst} 
                    id='user-begins' name="who-begins" value='user'>
                { ui['user_begins'][language] } 
            </label>

            <label for="opponent-begins" class="left-margin unselectable">
                <input type='radio' bind:group={whoPlaysFirst} 
                    id='opponent-begins' name="who-begins" value='opponent'>
                { ui['opponent_begins'][language] } 
            </label>
        </div>
    </fieldset>
{/if}

