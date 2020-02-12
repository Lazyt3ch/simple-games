<script>
	import Router from 'svelte-spa-router';

	// import { writable } from 'svelte/store';

	import { languages, uiStrings as ui } from './ui/App.js';
	import { globalLanguageIndex } from './stores.js';
	// console.log("globalLanguageIndex =", globalLanguageIndex);

	import Home from './routes/Home.svelte';

	import TicTacToe from './routes/TicTacToe.svelte';
	import Battleship from './routes/Battleship.svelte';

	import { gameName as game0 } from './routes/ui/TicTacToe.js';
	import { gameName as game1 } from './routes/ui/Battleship.js';

	let langIndex;

	const unsubscribe = globalLanguageIndex.subscribe(value => {
		langIndex = value;
		console.log("langIndex =", langIndex);
	});

	const routes = {
		// Exact paths
		'/': Home,
		'/tictactoe': TicTacToe,
		'/battleship': Battleship,
		// Add more paths if necessary...
		'*': Home,
	}

	// let language = "en";
	// let language = languages[0].short;
	// export language;
	// let selectedLang = languages[0];
	let selectedLang;
	let language = languages[langIndex].short;
	console.log("language =", language);
	// const globalLanguage = writable(language);
	
	let game = null;
	let games;
	updateGameNames();
	let selectedGame = games[0];

	function updateGameNames() {
		games = [
			ui['select_game'][language],
			game0[language],
			game1[language],
		]			
	}	

	$: {
		if (language !== null) updateGameNames(); 
	}

	console.log("games =", games);

	$: language = language;

</script>

<main>

	<!-- Game selector -->
	<label for="game-select" >
		&nbsp;
		<select name="game-name" id="game-select" class="game-select"
			bind:value={selectedGame} on:change={() => game = selectedGame}
		>
			{#each games as game, index}
				<!-- <option value="{game}" disabled={index === 0}> { game } </option> -->
				<option value="{game}" > { game } </option>
			{/each}
		</select>
	</label>

	<!-- Language selector -->
	<label for="language-select" >
		&nbsp;
		<select name="language" id="language-select" class="language-select"
			bind:value={selectedLang} on:change={() => language = selectedLang}
		>
			{#each languages as lang}
				<option value="{lang.short}"> { lang.full } </option>
			{/each}
		</select>
	</label>

	<hr> <!-- Above this line, the App; below this line, a specific game -->

	<!-- <TicTacToe> </TicTacToe> -->

	<Router {routes} />
</main>


<style>
	.game-select {
		min-width: 12em;
	}

	.language-select {
		min-width: 7em;
	}


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

