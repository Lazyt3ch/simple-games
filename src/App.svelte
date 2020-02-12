<script>
	import TicTacToe from './TicTacToe.svelte';
	import Battleship from './Battleship.svelte';

	import { languages, uiStrings } from './ui/App.js';

	import { gameName as game0 } from './ui/TicTacToe.js';
	import { gameName as game1 } from './ui/Battleship.js';

	let selectedGame = null;
	let game = null;

	// let language = "en";
	let language = languages[0].short;
	// let selectedLang = languages[0];
	let selectedLang;

	let games = [
		uiStrings['select_game'][language],
		game0[language],
		game1[language],
	]

	console.log("games =", games);

	$: language = language;

</script>

<main>

	<!-- Game selector -->
	<label for="game-select" >
		&nbsp;
		<select name="game-name" id="game-select" 
			bind:value={selectedGame} on:change={() => game = selectedGame}
		>
			{#each games as game, index}
				<option value="{game}" > { game } </option>
			{/each}
		</select>
	</label>

	<!-- Language selector -->
	<label for="language-select" >
		&nbsp;
		<select name="language" id="language-select" 
			bind:value={selectedLang} on:change={() => language = selectedLang}
		>
			{#each languages as lang}
				<option value="{lang.short}"> { lang.full } </option>
			{/each}
		</select>
	</label>

	<hr> <!-- Above this line, the App; below this line, a specific game -->

	<TicTacToe> </TicTacToe>
</main>


<style>
	/*
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
	*/
	
	/*
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
	*/

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

