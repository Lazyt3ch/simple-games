<script>
	import Router from 'svelte-spa-router';
	import {push} from 'svelte-spa-router'	

	import { languages, uiStrings as ui } from './ui/App.js';
	import { uiStrings as homeUi } from './ui/Home.js';

	// currentGame is a bugfix that disables transitions when routing
	import { globalLanguage, currentGame } from './stores.js';

	import Home from './routes/Home.svelte';

	import TicTacToe from './routes/TicTacToe.svelte';
	import Battleship from './routes/Battleship.svelte';

	import { gameId as gameId1, gameName as gameName1 } from './ui/TicTacToe.js';
	import { gameId as gameId2, gameName as gameName2 } from './ui/Battleship.js';

  let language;

	const unsubscribe = globalLanguage.subscribe(value => {
		language = value;        
	});    


	let curGame;

	const unsubscribe2 = currentGame.subscribe(value => {
		curGame = value;        
	});    

	const routes = { // Exact paths
		'/': Home,
		'/tictactoe': TicTacToe,
		'/battleship': Battleship,
		// Add more paths if necessary...
		'*': Home,
	}

	let selectedLang;
	
	function updateGlobalLanguage() {
		globalLanguage.update(() => language);
	}

	function updateCurrentGame() {
		currentGame.update(() => selectedGameId);
	}	

	$: {
		if (selectedLang !== null) updateGlobalLanguage();
	}

	$: {
		if (selectedGameId !== null) updateCurrentGame();
	}

	let games = [
		{ id: 'home', name: ui['select_game'] },
		{ id: gameId1, name: gameName1 },
		{ id: gameId2, name: gameName2 },	
	];

	let selectedGameId = games[0].id;
	updateGameNames();
	
	function updateGameNames() {
		games = [
			{ id: 'home', 
				name: (
					selectedGameId === 'home' 
						? ui['select_game'] 
						: homeUi['home_page']
				) 
			},
			{ id: gameId1, name: gameName1 },
			{ id: gameId2, name: gameName2 },
		]			
	}	

	$: {
		if (language !== null || selectedGameId !== null) updateGameNames(); 
	}

	$: {
		if (selectedGameId !== null) {
			push(`/${selectedGameId}`);
		}
	}

	$: language = language;

</script>

<style>
	.game-select {
		min-width: 12em;
		font-size: 1rem;
	}

	.language-select {
		min-width: 7em;
		font-size: 1rem;
	}

	.rightish {
		float: right;
		text-align: left;
	}	

	.leftish {
		float: left;
		text-align: left;
	}

	main {
		width: 100%;
		max-width: 1000px;
		margin: 0 auto;
	}
	
</style>


<main>
	<!-- Game selector -->
	<label for="game-select" >
		&nbsp;
		<select name="game-name" id="game-select" class="game-select leftish"
			bind:value={selectedGameId} 
		>
			{#each games as game, index}
				<option value="{games[index].id}" disabled={selectedGameId === games[index].id}> 
					{ game.name[language] } 				
				</option> 
			{/each}
		</select>
	</label>

	<!-- Language selector -->
	<label for="language-select" >
		&nbsp;
		<select name="language" id="language-select" class="language-select rightish"
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
