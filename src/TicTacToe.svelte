<script>
    let board = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' '],
    ]

    function testBoard() {
        console.log(board);
    }

    testBoard();
</script>

<style>
    .row {
        background-color: black;
    }

    .cell {
        background-color: gray;
        color: blue;
        margin: 1px 5px;
    }
</style>




<!--
{#each board as row}
    <p class="row">
        {#each row as cell}            
            <span class="cell">{@html cell === ' ' ? '&nbsp;' : cell }</span>
        {/each}
    </p>
{/each}
*/
-->

