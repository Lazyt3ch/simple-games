<script>    
    import { fade } from 'svelte/transition';
    
    import { uiStrings } from './ui/TicTacToe.js';

    const gameName = "Tic Tac Toe";

    let language = 'en';
    // let language = 'ru';

    let movesCount = 0;

    let gameBegan = false;

    let highlighted = false;

    const emptyBoard = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' '],
    ];


//    let whoPlaysFirst = false;  // true if user plays first, otherwise false
    let whoPlaysFirst = null;  // true if user plays first, otherwise false

    let board = null;
    // board = clearBoard();
    restartGame();

    let markerChar;

    $: {
        markerChar = gameBegan ? (whoPlaysFirst === 'user' ? 'X' : 'O') : ' ';
    }

    function restartGame() {        
        board = JSON.parse(JSON.stringify(emptyBoard));
        // console.log("board =", board);
        whoPlaysFirst = null;
        movesCount = 0;
        gameBegan = false;
        // return board;
    }
    
    

    function markCell(rowIndex, cellIndex) {
        console.log("FUNCTION:  markCell");
        // console.log("rowIndex, cellIndex =", rowIndex, cellIndex);
        console.log("whoPlaysFirst =", whoPlaysFirst);
        if (whoPlaysFirst === null) { 
            // alert("???");
            highlighted = true;
            setTimeout(() => highlighted = false, 2000);            
            return;
        }

        // let markerChar = whoPlaysFirst ? 'X' : 'O';
        if (board[rowIndex][cellIndex] === ' ') {
            console.log("Trying to mark the cell...")
            board[rowIndex][cellIndex] = markerChar;  
            checkThree(rowIndex, cellIndex);
            makeMove();
        }
    }

    function checkThree(rowIndex, cellIndex) {
        /*
        if (rowIndex === 1 && cellIndex === 1) {
            // central cell
            if (   (board[1][0] === board[1][1] && board[1][2] === board[1][1]) 
                || (board[0][1] === board[1][1] && board[2][1] === board[1][1]) 
                || (board[0][0] === board[1][1] && board[2][2] === board[1][1]) 
                || (board[2][0] === board[1][1] && board[0][2] === board[1][1])
                ) 
                {
                    // the user has won
                    alert(uiStrings["user_won"][language]);
                    return;
                }
        } else if (

            )
        }
        */

    }


    function makeMove() {
        

        movesCount++;
    }

    /*
    function testBoard() {
        console.log(board);
    }

    testBoard();
    */

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

    .center {
        margin-left: auto;
        margin-right: auto;
        text-align: center;
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


</style>


<h1 class="center">{ gameName }</h1>

<table class="center margin-after">
    {#each board as row, rowIndex}
        <tr>
            {#each row as cell, cellIndex}
                <td on:click|preventDefault={
                    () => markCell(rowIndex, cellIndex) 
                    }> { cell } 
                </td>
            {/each}
        </tr>
    {/each}
</table>

<div class="center margin-after">
    <button class="cool-button" on:click={restartGame}>
        { uiStrings['start_new_game']['en'] }
    </button>

    <button class="cool-button">
        { uiStrings['stop_game']['en'] }
    </button>
</div>

{#if whoPlaysFirst !== null}
    <h2 class="center" transition:fade="{{delay: 200, duration: 500}}"> 
        { uiStrings['game_on'][language] } 
    </h2>
{/if}

{#if whoPlaysFirst === null}
<!-- {#if !gameBegan} -->
    <fieldset id='who-plays-first' transition:fade="{{delay: 200, duration: 500}}"
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






