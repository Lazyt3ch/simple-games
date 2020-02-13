<script>
    // import { fade } from 'svelte/transition';
    
    import { languages, gameName, uiStrings as ui } from './ui/Battleship.js';
    import { globalLanguage } from '../stores.js';

    // LANGUAGE HEAD ==============================>
    let language;    
    console.log("Battleship:  $globalLanguage =", $globalLanguage);

	const unsubscribe = globalLanguage.subscribe(value => {
        language = value;        
		console.log("Battleship:  language =", language);
	});    
    // LANGUAGE TAIL ==============================<

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
                row = [9];
            } else {
                row = [alphabet.slice(r - 1, i)]; // row header
            }

            for (let c = 0; c < totalWidth; c++) {
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

        /*
        if (num === 0) {
            char = ' ';
        }
        */
        char = num.toString();

        return char;
    }


    function fireSalvo() {


    }


    function placeShip() {

    }


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

    // GAME LOGIC TAIL ==============================>

</script>


<style>
    table, tr, td {
        border: 1px solid black;
        border-collapse: collapse;        
        font-family: Arial, Helvetica, sans-serif;
        font-size: 1em;
        font-weight: 100;
    }

    table {
        margin-top: 1em;
        background-color: aquamarine;
    }

    td {
        height: 0.5em;
        width: 0.5em;
        vertical-align: center;
        font-size: 3em;
        font-weight: bolder;
    }

    .user {
        display: inline-block;
        margin-right: 2em;
        /* float: left; */
    }

    .opponent {
        display: inline-block;
        /* float: right; */
    }    

    .center {
        margin-left: auto;
        margin-right: auto;
        text-align: center;
    }

    .margin-after {
        margin-bottom: 1em;
    }

</style>


<!-- GAME NAME -->
<h1 class="center">{ gameName[language] }</h1>

<div class="user">
    <h3>{ ui["user_ships"][language] }</h3>

    <!-- TABLE with USER's SHIPS -->
    <table>
        {#each userBoard as row, rowIndex}
            <tr>
                {#each row as cell, colIndex}
                    <td on:click={ () => placeShip(rowIndex, colIndex) }
                        class="{cell === 2 || cell === -2 ? 'winner' : ''} unselectable"                            
                    >
                        { @html num2char(cell) }
                    </td>
                {/each}
            </tr>
        {/each}
    </table>
</div>

<div class="opponent">
    <h3>{ ui["opponent_ships"][language] }</h3>

    <!-- TABLE with OPPONENT's SHIPS -->
    <table>
        {#each oppoBoard as row, rowIndex}
            <tr>
                {#each row as cell, colIndex}
                    <td on:click={ () => fireSalvo(rowIndex, colIndex) }
                        class="{cell === 2 || cell === -2 ? 'winner' : ''} unselectable"                            
                    >
                        { @html num2char(cell) }
                    </td>
                {/each}
            </tr>
        {/each}
    </table>
</div>