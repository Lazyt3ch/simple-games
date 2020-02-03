<script>
    const gameName = "Tic Tac Toe";

    let language = 'en';
    // let language = 'ru';

    const emptyBoard = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' '],
    ];

    const uiStrings = {
        'start_new_game': 
        {   
            en: 'Start a new game',
            ru: 'Начать новую игру',
        },
        'stop_game': 
        {   
            en: 'Stop the game',
            ru: 'Остановить игру',
        },
        'user_begins':
        {   
            en: 'Me',
            ru: 'Я',        
        },
        'opponent_begins':
        {
            en: 'My opponent',
            ru: 'Противник',
        },
        'game_on':
        {
            en: 'The game is on!',
            ru: 'Игра началась!',
        },
    
    };

    /*
    console.log("uiStrings =", uiStrings);
    console.log('start_new_game =', uiStrings['start_new_game']);
    console.log(uiStrings['start_new_game']['en']);
    console.log(uiStrings['start_new_game']['ru']);
    */

//    let userFirst = false;  // true if user plays first, otherwise false
    let userFirst = null;  // true if user plays first, otherwise false

    let board;
    clearBoard();

    function clearBoard() {        
        board = JSON.parse(JSON.stringify(emptyBoard));
        console.log("board =", board);
        userFirst = null;
    }

    function markCell(rowIndex, cellIndex) {
        console.log("rowIndex, cellIndex =", rowIndex, cellIndex);
        let markChar = userFirst ? 'X' : 'O';
        if (board[rowIndex][cellIndex] === ' ') {
            board[rowIndex][cellIndex] = markChar;  
        }
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

    table.margin-after {
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
        max-width: 30%;
    }

    div-inline {
        display: inline;
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

{#if userFirst === null}
    <fieldset>
        <label>Who plays first?</label>
        
        <div class="div-inline">
            <label for="user-begins">
                <input type='radio' bind:group={userFirst} 
                    id='user-begins' name="who-begins" value='user'>
                { uiStrings['user_begins'][language] } 
            </label>

            <label for="opponent-begins">
                <input type='radio' bind:group={userFirst} 
                    id='opponent-begins' name="who-begins" value='opponent'>
                { uiStrings['opponent_begins'][language] } 
            </label>
        </div>
    </fieldset>
{:else}
    <h2 class="center"> { uiStrings['game_on'][language] } </h2>
{/if}

<div class="center">
    <button class="cool-button" on:click={clearBoard}>
        { uiStrings['start_new_game']['en'] }
    </button>

    <button class="cool-button">
        { uiStrings['stop_game']['en'] }
    </button>
</div>
