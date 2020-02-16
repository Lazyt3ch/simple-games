<script>
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    import { languages, uiStrings as ui } from './WhoPlaysFirst.js';    
    import { globalLanguage } from '../../stores.js';    

    let language;
	const unsubscribe = globalLanguage.subscribe(value => {
        language = value;        
		console.log("WhoPlaysFirst:  language =", language);
    });     

    let whoPlaysFirst;

    let highlighted = false;

    const dispatch = createEventDispatcher();

    function handleWhoBegins() {
        console.log("FUNCTION: handleWhoBegins;  whoPlaysFirst =", whoPlaysFirst);
        dispatch('whoBegins', whoPlaysFirst);
    }

</script>


<style>
    .limited-width {
        max-width: 20em;
    }

    .margin-after {
        margin-bottom: 1em;
    }

    .highlighted {
        background: yellow;
        color: blue;
    }

    .unselectable {
        -moz-user-select: -moz-none;
        -khtml-user-select: none;
        -webkit-user-select: none;
        -o-user-select: none;
        user-select: none;
    }        


</style>



<!-- WHO PLAYS FIRST radio buttons etc -->
<!-- on:change={() => oppoTurn = true}  -->
<fieldset id='who-plays-first' transition:fade="{{delay: 100, duration: 500}}"
    class="limited-width margin-after {highlighted? 'highlighted': ''}"
    on:change={handleWhoBegins}    
>
    <label class="unselectable"> { ui['who_plays_first'][language] } </label>
    
    <div>
        <label for="user-begins" class="unselectable"> 
            <input type='radio' bind:group={whoPlaysFirst} 
                id='user-begins' name="who-begins" value='user'>
            { ui['user_begins'][language] } 
        </label>

        <label for="opponent-begins" class="left-margin unselectable">
            <input type='radio' bind:group={whoPlaysFirst} 
                id='opponent-begins' name="who-begins" value='opponent'>
            { ui['opponent_begins'][language] } 
        </label>
    </div>
</fieldset>
