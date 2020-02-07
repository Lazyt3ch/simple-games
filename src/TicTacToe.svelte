<script>    
    import { fade } from 'svelte/transition';
    
    import { languages, uiStrings } from './ui/TicTacToe.js';

    let language = languages[0].short;
    // console.log("language, languages =", language, languages);

    let moveCount = 0;

    let gameBegan = false;

    let highlighted = false;

    let selectedLang;

    let oppoTurn = false;

    let info = 'lets_play';
    let infoText;

    // let userMoveAllowed = false;

    $: infoText = uiStrings[info][language];

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

    let whoPlaysFirst = null;  // true if user plays first, otherwise false

    let board = null;
    let boardNumeric = null;

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
        // console.log("gameBegan, userChar =", gameBegan, userChar);
    }

    $: {
        if (moveCount === 9) {
            whoPlaysFirst = null;
        }        
    }

    $: { 
        language = language;
        // infoText = infoText;
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

    function isWinnerCell(rowIndex, colIndex) {
        let result = winnerCells !== null 
            && winnerCells.some(cell => (cell[0] === rowIndex && cell[1] === colIndex));
        // console.log("FUNCTION isWinnerCell:  row, col, result =", rowIndex, colIndex, result);
        return result;
    }


    function randomInt(n) {
        return Math.floor(Math.random() * Math.floor(n));
    }


    function restartGame() {        
        board = JSON.parse(JSON.stringify(emptyBoard));
        boardNumeric = JSON.parse(JSON.stringify(emptyBoardNumeric));

        if (whoPlaysFirst === "opponent") {
            oppoTurn = true;
            // infoText = uiStrings["opponent_move"][language];
            info = "opponent_move";
        } else {
            // infoText = uiStrings["user_move"][language];
            info = "user_move";
            oppoTurn = false;
        }
        
        // console.log("board =", board);
        // whoPlaysFirst = null;
        moveCount = 0;
        gameBegan = false;
        winnerCells = null;

        board = board; // for reactivity
        winnerCells = winnerCells; // for reactivity

        if (whoPlaysFirst === "opponent") {
            oppoMove();
        } else if (whoPlaysFirst === "user") {
            // infoText = uiStrings['user_move'][language];
            info = 'user_move';
        } else {
            // infoText = uiStrings['lets_play'][language];
            info = 'lets_play';
        }

        isWin = false;

    }  
    

    function markCell(rowIndex, colIndex) {
        if (oppoTurn) return;
        
        if (moveCount === 0 && whoPlaysFirst === "opponent") return;

        if (whoPlaysFirst === null) { 
            highlighted = true;
            setTimeout(() => highlighted = false, 2000);            
            return;
        }

        // let userChar = whoPlaysFirst ? 'X' : 'O';
        if (board[rowIndex][colIndex] === E) {
            // console.log("Trying to mark the cell...")
            // console.log("userChar =", userChar);
            board[rowIndex][colIndex] = userChar;  
            boardNumeric[rowIndex][colIndex] = userNum;  
            // infoText = uiStrings["opponent_move"][language];
            moveCount++;   
            console.log("moveCount =", moveCount);
            oppoTurn = moveCount < 9 ? true : false;
            info = 'opponent_move';

            isWin = checkThree(3) || false;
            // console.log("isWin, winnerCells =", isWin, winnerCells);
            if (isWin) {                
                // alert(uiStrings['user_won'][language]);
                // infoText = uiStrings['user_won'][language];
                info = 'user_won';
                oppoTurn = true;
                whoPlaysFirst = null;

                board = board; // for reactivity
                winnerCells = winnerCells; // for reactivity
                return;
            }

            // moveCount++;            

            // oppoMove();

            if (moveCount === 9) {
                // alert(uiStrings['score_draw'][language]);
                // infoText = uiStrings['score_draw'][language];
                info = 'score_draw';
                whoPlaysFirst = null;
            } else {
                setTimeout(oppoMove, 1000);                
            }
        }
    }

    function markWinnerCells(winnerCells) {
        if (winnerCells === null || winnerCells.length !== 3) return;

        let char;

        oppoTurn = true;
        let repeats = 5;

        for (let h = 0; h < repeats; h++) {
            // console.log("h =", h);
            (function(h) {
                 setTimeout(function() {
                    for (let i = 0; i < 3; i++){
                        char = board[(winnerCells[i][0])][(winnerCells[i][1])];
                        char = (h % 2 === 0 ? char.toUpperCase() : char.toLowerCase());
                        board[(winnerCells[i][0])][(winnerCells[i][1])] = char;
                    }
                    if (h === repeats - 1) oppoTurn = false;
                 }, h * 500);
            }(h));
        }        
    }

    function checkThree(either2or3) {

        // Checking each row
        for (let row = 0; row < 3; row++) {
            let theSum = 0;
            for (let col = 0; col < 3; col++) {
                theSum += boardNumeric[row][col];
            }

            if (Math.abs(theSum) === either2or3) {
                winnerCells = [[row, 0], [row, 1], [row, 2]];
                if (either2or3 === 3) {
                    markWinnerCells(winnerCells);
                }
                return true;
            }
        }

        // Checking each column 
        for (let col = 0; col < 3; col++) {
            let theSum = 0;
            for (let row = 0; row < 3; row++) {
                theSum += boardNumeric[row][col]
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
        if (Math.abs(boardNumeric[0][0] + boardNumeric[1][1] + boardNumeric[2][2]) === either2or3) {
            winnerCells = [[0, 0], [1, 1], [2, 2]];
            if (either2or3 === 3) {
                markWinnerCells(winnerCells);
            }
            return true;

        }

        // Checking diagonal two
        if (Math.abs(boardNumeric[0][2] + boardNumeric[1][1] + boardNumeric[2][0]) === either2or3) {
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

                boardNumeric[rowIndex][colIndex] = oppoNum;
                board[rowIndex][colIndex] = oppoChar;

                moveCount++;
                console.log("moveCount =", moveCount);
                info = 'user_move';
                oppoTurn = false;
                return;
            }

            // If a later move, look for your own or your opponent's to-be-complete streak
            if (moveCount < 9) {
                if (checkThree(2)) {
                    if (winnerCells !== null && winnerCells.length === 3) {
                        let oppoCharCount = 0;
                        for (let i = 0; i < 3; i++) {
                            if (board[(winnerCells[i][0])][(winnerCells[i][1])] === E) {
                                // Empty cell found
                                board[(winnerCells[i][0])][(winnerCells[i][1])] = oppoChar;
                                boardNumeric[(winnerCells[i][0])][(winnerCells[i][1])] = oppoNum;

                                moveCount++;
                                if (moveCount < 9) info = 'user_move';
                            } 
                            
                            if (board[(winnerCells[i][0])][(winnerCells[i][1])] === oppoChar) {
                                oppoCharCount++;
                            }
                        }

                        console.log("oppoCharCount =", oppoCharCount);
                        oppoTurn = false;
                        if (oppoCharCount === 3) {
                            isWin = true;
                            oppoTurn = true;
                            info = "opponent_won";
                            markWinnerCells(winnerCells);
                        }
                        return;
                    }
                }
            } else {
                whoPlaysFirst = null;
            }

            while (true) {
                rowIndex = randomInt(3);
                colIndex = randomInt(3);
                console.log("rowIndex, colIndex =", rowIndex, colIndex);
                if (board[rowIndex][colIndex] === E) {
                    board[rowIndex][colIndex] = oppoChar;
                    boardNumeric[rowIndex][colIndex] = oppoNum;
                    moveCount++;
                    console.log("moveCount =", moveCount);
                    // isWin = checkThree(3);

                    isWin = checkThree(3) || false;
                    // console.log("isWin, winnerCells =", isWin, winnerCells);
                    if (isWin) {
                        oppoTurn = true;
                        // alert(uiStrings['opponent_won'][language]);
                        // infoText = uiStrings['opponent_won'][language];
                        info = 'opponent_won';
                        whoPlaysFirst = null;
                        return;
                    }
                    // infoText = uiStrings["user_move"][language];
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
                <td on:click={ () => markCell(rowIndex, colIndex) }
                    class={cell === XW || cell === OW ? 'winner' : ''}
                >
                    { cell } 
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
<!-- {#if !gameBegan} -->
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

