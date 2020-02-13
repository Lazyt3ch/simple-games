<script>
    // import { fade } from 'svelte/transition';
    
    import { languages, gameName, gameId, uiStrings as ui } from './ui/Battleship.js';
    // import { globalLanguage } from '../stores.js';

    // currentGame is a bugfix that disables transitions when routing
    import { globalLanguage, currentGame } from '../stores.js';


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

        /*
        if (num === 0) {
            char = ' ';
        }
        */
        if (num === 0) {
            char = ' ';
        } else {
            char = num.toString();
        }

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

    // GAME LOGIC TAIL ==============================>

</script>


<style>
    table, tr, td {
        /* border: 1px solid black; */
        border-collapse: collapse;        
        font-family: Arial, Helvetica, sans-serif;
        font-size: 1em;
        font-weight: 100;
    }

    table {
        margin-top: 1em;
        background-color: inherit;        
    }

    td {
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
        display: inline-block;
        margin-left: 1em;
        margin-right: 2em;
        /* float: left; */
    }

    .opponent {
        display: inline-block;
        margin-left: 1em;
        /* float: right; */
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
    }

    .user-or-opponent {
        text-align: center;
    }

</style>


<!-- GAME NAME -->
<!-- <h1 class="center">{ gameName[language] }</h1> -->

<div class="container">
    <div class="user">
        <h3 class="user-or-opponent">{ ui["user_ships"][language] }</h3>

        <!-- TABLE with USER's SHIPS -->
        <table>
            {#each userBoard as row, rowIndex}
                <tr>
                    {#each row as cell, colIndex}
                        <td on:click={ () => placeShip(rowIndex, colIndex) }
                            class="{getCellClass(rowIndex, colIndex)}"                                                   
                        >
                            { @html rowIndex > 0 && colIndex > 0 ? num2char(cell) : cell }
                        </td>
                    {/each}
                </tr>
            {/each}
        </table>
    </div>

    <div class="opponent">
        <h3 class="user-or-opponent">{ ui["opponent_ships"][language] }</h3>

        <!-- TABLE with OPPONENT's SHIPS -->
        <table>
            {#each oppoBoard as row, rowIndex}
                <tr>
                    {#each row as cell, colIndex}
                        <td on:click={ () => fireSalvo(rowIndex, colIndex) }
                            class="{getCellClass(rowIndex, colIndex)}"                         
                        >
                            { @html rowIndex > 0 && colIndex > 0 ? num2char(cell) : cell }
                        </td>
                    {/each}
                </tr>
            {/each}
        </table>
    </div>
</div>    

<p>&nbsp</p> <!-- dummy paragraph -->