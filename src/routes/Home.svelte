<script>
    import { languages, uiStrings as ui } from '../ui/Home.js';    
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
        /* width: 80%;
        display: inline-block;
        width: 100%;
        margin: 0 auto; */
        text-align: center;
        height: 100%;
        width: 100%;
    }

    /* .colorful {
        background-color: aquamarine;
    } */
</style>

<div class="centered">
    <h1>{ ui["welcome"][language] }</h1>
    <p>{ ui["offer_to_play"][language] }</p>
    <!-- <h1>PLACEHOLDER</h1> -->
    <!-- <p> { $globalLanguageIndex } </p> -->
</div>