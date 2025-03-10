"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* Helper functions */
function charIsPunctuation(letter) {
    return letter.replace(/[^a-zA-Z0-9 ]/, '') === '';
}
function lastLetterPunctuation(word) {
    return charIsPunctuation(word.charAt(word.length - 1));
}
function firstLetterCapital(word) {
    return word.charAt(0).toUpperCase() === word[0];
}
// Creates a stylized context string with max of 2 leading words and 2 trailing words
function createContextString(word, file, i) {
    return `${i - 2 > 0 ? '...' : ''}${i - 2 >= 0 ? `${file[i - 2]} ` : ''}${i - 1 >= 0 ? `${file[i - 1]} ` : ''}${word}${i + 1 < file.length ? ` ${file[i + 1]}` : ''}${i + 2 < file.length ? ` ${file[i + 2]}...` : ''}`;
}
const args = process.argv.slice(2);
const fs = require('fs');
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (args.length !== 2) {
            console.log("Please provide 2 arguments: a dictionary file and a file to be checked.\n");
            console.log("Example:");
            console.log("\tnode spellcheck.js dictionary.txt file.txt");
            return;
        }
        // Get the dictionary
        const dictionary = yield readFile(args[0]).then(data => data === null || data === void 0 ? void 0 : data.split('\n'));
        if (dictionary === undefined) {
            console.log("Cannot read dictionary. Exiting.");
            return;
        }
        // Sort dictionary into chunks by starting letter
        const sortedDictionary = new Map();
        dictionary.forEach(word => {
            const prev = sortedDictionary.get(word.charAt(0).toLowerCase());
            let words = [];
            if (prev !== undefined)
                words = [...prev, word];
            else
                words = [word];
            sortedDictionary.set(word.charAt(0).toLowerCase(), words);
        });
        // Split the input file into individual words
        const file = yield readFile(args[1]).then(data => data === null || data === void 0 ? void 0 : data.split(' '));
        const misspelledWords = [];
        // Go word by word searching for mispelled words
        file === null || file === void 0 ? void 0 : file.forEach((word, i) => {
            const context = createContextString(word, file, i);
            // Removes any non-alphanumeric characters
            const strippedWord = word.replace(/[^a-zA-Z0-9 ]/g, '');
            const strippedWordLower = strippedWord.toLowerCase();
            const dictionarySection = sortedDictionary.get(strippedWordLower.charAt(0));
            const exists = wordExists(strippedWordLower, dictionarySection);
            if (exists === undefined) {
                const alternativeWords = checkForAlternativeWords(strippedWordLower, dictionarySection);
                // Last check is for proper nouns
                // Checking for proper nouns -- if the word doesn't exist, it's the first letter, and it's uppercase accept it as a proper noun
                const isProperNoun = alternativeWords.length === 0 && firstLetterCapital(strippedWord);
                if (!isProperNoun) {
                    misspelledWords.push({
                        mistake: strippedWord,
                        context: context,
                        alternativeWords: alternativeWords
                    });
                }
            }
            else {
                // If the word is not the first word, is capital, and does not come after a punctuation mark -- consider it a proper noun
                if (i > 0 && firstLetterCapital(word) && !lastLetterPunctuation(file[i - 1])) {
                    misspelledWords.push({
                        mistake: strippedWord,
                        context: context,
                        alternativeWords: [exists]
                    });
                }
            }
        });
        // Read out of our words
        misspelledWords.forEach(i => {
            console.log(`${i.mistake}`);
            console.log(`Context:`);
            console.log(`\t${i.context}`);
            console.log(`Suggestions:`);
            if (i.alternativeWords.length === 0) {
                console.log("N/A");
            }
            else {
                i.alternativeWords.forEach(word => {
                    console.log(`\t${word}`);
                });
            }
            console.log();
        });
    });
}
function readFile(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            fs.readFile(path, 'utf-8', (err, data) => {
                if (err)
                    console.log(`${err.message}`);
                resolve(data);
            });
        });
    });
}
function wordExists(word, section) {
    var _a, _b;
    if (section === undefined)
        return undefined;
    // binary search
    let low = 0;
    let high = section.length;
    let mid = (low + high) / 2;
    // Makes sure it's alphanumeric
    while (low <= high) {
        if (((_a = section[mid]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) < word.toLowerCase()) {
            low = mid + 1;
        }
        else if (((_b = section[mid]) === null || _b === void 0 ? void 0 : _b.toLowerCase()) > word.toLowerCase()) {
            high = mid - 1;
        }
        mid = Math.floor((low + high) / 2);
        if (section[mid + 1].toLowerCase().trim() === word.toLowerCase().trim()) {
            return section[mid + 1].toLowerCase();
        }
    }
    return undefined;
}
// Going to hard-code -- I'm sure there is an algorithm but let's just figure this out first
function checkForAlternativeWords(mistake, section) {
    // Figuring out solution for similar words?? Maybe ascii total?
    /*  Possible Rules
    *   1. Out of order
    *   2. Extra-letter
    *   3. Mispelling
    *   4. Proper noun (if i !== 0 and [0] is capital we can call it a proper noun)
    */
    // Section for this letter doesn't exist
    if (section === undefined)
        return [];
    const altWords = [];
    // Check for words that start with the same letter and have one letter difference
    section.forEach(word => {
        // Same order -- check for misplaced or duplicated letters 
        const wordMap = new Map();
        word = word.trim();
        if (word.length === mistake.length) {
            for (let i = 0; i < word.length; i++) {
                wordMap.set(word.charAt(i).toLowerCase(), 1);
                wordMap.set(mistake.charAt(i).toLowerCase(), 1);
            }
            if (wordMap.size === mistake.length) {
                altWords.push(word); // If the map is the same size as the mistake array then it's just out of order
            }
        }
    });
    return altWords;
}
main();
