<script>
	import Router from 'svelte-spa-router';
	import {push, pop, replace} from 'svelte-spa-router'	

	import { languages, uiStrings as ui } from './ui/App.js';
	// import { globalLanguageIndex } from './stores.js';
	import { globalLanguage } from './stores.js';
	// console.log("globalLanguageIndex =", globalLanguageIndex);

	import Home from './routes/Home.svelte';

	import TicTacToe from './routes/TicTacToe.svelte';
	import Battleship from './routes/Battleship.svelte';
	// let gamelinks = null;

	import { gameId as gameId1, gameName as gameName1 } from './routes/ui/TicTacToe.js';
	import { gameId as gameId2, gameName as gameName2 } from './routes/ui/Battleship.js';

	// import { writable } from 'svelte/store';

	// let langIndex;

	/*
	const unsubscribe = globalLanguageIndex.subscribe(value => {
		langIndex = value;
		console.log("langIndex =", langIndex);
	});
	*/

	let globLang = null;

	const unsubscribe = globalLanguage.subscribe(value => {
		globLang = value;
		console.log("globLang =", globLang);
	});

	const routes = {// Exact paths
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
	// let language = languages[langIndex].short;
	let language = globLang;
	console.log("language =", language);
	// const globalLanguage = writable(language);
	
	function updateGlobalLanguage() {
		console.log("App:  trying to update globalLanguage...");
		globalLanguage.update(() => language);
		console.log("App:  $globalLanguage =", $globalLanguage);
	}

	$: {
		if (selectedLang !== null) updateGlobalLanguage();
	}

	let gameIndex = null;
	let game = null;
	let games;
	updateGameNames();
	let selectedGameId = games[0].id;

	function updateGameNames() {
		games = [
			{ id: 'home', name: ui['select_game'] },
			{ id: gameId1, name: gameName1 },
			{ id: gameId2, name: gameName2 },
		]			
	}	

	$: {
		if (language !== null) updateGameNames(); 
	}

	$: {
		if (selectedGameId !== null) {
			console.log("selectedGameId =", selectedGameId);
			console.log(`/${selectedGameId}`);
			push(`/${selectedGameId}`);
		}
	}

	console.log("games =", games);

	$: language = language;

</script>

<main>

	<!-- Game selector -->
	<!--			bind:value={selectedGame} on:change={() => game = selectedGame} -->
	<label for="game-select" >
		&nbsp;
		<select name="game-name" id="game-select" class="game-select"
			bind:value={selectedGameId}
		>
			{#each games as game, index}
				<option value="{games[index].id}" disabled={index === 0}> { game.name[language] } </option> 
				<!-- <option value="{game}" > { game } </option> -->
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

	<!-- Component displayed (depending on route) -->
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

