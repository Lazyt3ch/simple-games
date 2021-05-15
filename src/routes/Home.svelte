<svelte:head>
    <title>
        {`${appUi['site_name'][language]} | ${ui['home_page'][language]}`}
    </title>
</svelte:head>

<script>
    import { languages, uiStrings as ui } from '../ui/Home.js';    
    import { uiStrings as appUi } from '../ui/App.js';
    import { globalLanguage } from '../stores.js';

    /* $: language = globalLanguage; */

    let language;
    
    // console.log("Home:  $globalLanguage =", $globalLanguage);

	const unsubscribe = globalLanguage.subscribe(value => {
        language = value;        
		// console.log("Home:  language =", language);
	});    


</script>

<style>
  .centered {
    text-align: center;
    height: 100%;
    width: 100%;      
  }

  h1 {
    font-size: 2rem;
    font-weight: 600;
  }

  p {
    font-size: 1.2rem;
    font-weight: 400;
  }

  @media (max-width: 500px) {
    h1 {
      font-size: 1.6rem;
    }

    p {
      font-size: 1rem;
    }    
  }

</style>

<div class="centered">
  <h1>{ ui["welcome"][language] }</h1>
  <p>{ ui["offer_to_play"][language] }</p>
  <p>{ ui["offer_to_select_game"][language] }</p>
  <!-- <h1>PLACEHOLDER</h1> -->
  <!-- <p> { $globalLanguageIndex } </p> -->
</div>