<script>
    import { languages, uiStrings as ui } from './ui/Home.js';    
    import { globalLanguage } from '../stores.js';

    $: language = globalLanguage;

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

    .colorful {
        background-color: aquamarine;
    }
</style>

<div class="centered colorful">
    <h1>{ ui["welcome"][language] }</h1>
    <!-- <h1>PLACEHOLDER</h1> -->
    <!-- <p> { $globalLanguageIndex } </p> -->
</div>