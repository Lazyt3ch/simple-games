import { writable } from 'svelte/store';

import { languages } from './ui/App.js';

console.log("FILE: store.js  |  languages =", languages);

// export const globalLanguageIndex = writable(0);
export const globalLanguage = writable(languages[0].short);