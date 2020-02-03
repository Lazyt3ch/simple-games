<script>
    const gameName = "Tic Tac Toe";

    const emptyBoard = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' '],
    ];

    let userFirst = false;  // true if user plays first, otherwise false

    let board;
    clearBoard();


    function clearBoard() {
        board = [...emptyBoard];
    }

    function markCell(rowIndex, cellIndex) {
        let markChar = userFirst ? 'X' : 'O';
        board[rowIndex][cellIndex] = markChar;
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
        height: 3em;
        width: 3em;
        vertical-align: center;
    }

    table.center {
        margin-left: auto;
        margin-right: auto;
    }

</style>

<h1>{ gameName }</h1>

<table class="center">
    {#each board as row, rowIndex}
        <tr>
            {#each row as cell, cellIndex}
                <td on:click={ markCell(rowIndex, cellIndex) }> { cell } </td>
            {/each}
        </tr>
    {/each}
</table>

