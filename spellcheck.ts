interface MispelledWords {
    mistake: string,
    context: string,
    alternativeWords: string[],
}

/* Helper functions */
function charIsPunctuation(letter: string): boolean {
    return letter.replace(/[^a-zA-Z0-9 ]/, '') === '';
}

function lastLetterPunctuation(word: string): boolean {
    return charIsPunctuation(word.charAt(word.length - 1));
}

function firstLetterCapital(word: string): boolean {
    return word.charAt(0).toUpperCase() === word[0];
}

// Creates a stylized context string with max of 2 leading words and 2 trailing words
function createContextString(word: string, file: string[], i: number): string {
    return `${i - 2 > 0 ? '...' : ''}${i - 2 >= 0 ? `${file[i - 2]} ` : ''}${i - 1 >= 0 ? `${file[i - 1]} ` : ''}${word}${i + 1 < file.length ? ` ${file[i + 1]}` : ''}${i + 2 < file.length ? ` ${file[i + 2]}...` : ''}`;
}

const args: string[] = process.argv.slice(2);
const fs = require('fs');

async function main() {
    if (args.length !== 2) {
        console.log("Please provide 2 arguments: a dictionary file and a file to be checked.\n");
        console.log("Example:");
        console.log("\tnode spellcheck.js dictionary.txt file.txt");
        return;
    }

    // Get the dictionary
    const dictionary: string[] | undefined = await readFile(args[0]).then(data => data?.split('\n'));
    if (dictionary === undefined) {
        console.log("Cannot read dictionary. Exiting.");
        return;
    }

    // Sort dictionary into chunks by starting letter
    const sortedDictionary: Map<string, string[]> = new Map<string, string[]>();
    dictionary.forEach(word => {
        const prev: string[] | undefined = sortedDictionary.get(word.charAt(0).toLowerCase());
        let words: string[] = [];
        if (prev !== undefined) words = [...prev, word];
        else words = [word];
        sortedDictionary.set(word.charAt(0).toLowerCase(), words);
    });

    // Split the input file into individual words
    const file: string[] | undefined = await readFile(args[1]).then(data => data?.split(' '));

    const misspelledWords: MispelledWords[] = [];

    // Go word by word searching for mispelled words
    file?.forEach((word: string, i: number) => {
        const context = createContextString(word, file, i);

        // Removes any non-alphanumeric characters
        const strippedWord = word.replace(/[^a-zA-Z0-9 ]/g, '');
        const strippedWordLower = strippedWord.toLowerCase();

        const dictionarySection = sortedDictionary.get(strippedWordLower.charAt(0));
        const exists: string | undefined = wordExists(strippedWordLower, dictionarySection);
        if (exists === undefined)
        {
            const alternativeWords: string[] = checkForAlternativeWords(strippedWordLower, dictionarySection);
            // Last check is for proper nouns
            // Checking for proper nouns -- if the word doesn't exist, it's the first letter, and it's uppercase accept it as a proper noun
            const isProperNoun: boolean = alternativeWords.length === 0 && firstLetterCapital(strippedWord);
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
            if (i > 0 && firstLetterCapital(word) && !lastLetterPunctuation(file[i - 1]))
            {
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
    })
}

async function readFile(path: string): Promise<string | undefined> {
    return new Promise((resolve) => {
        fs.readFile(path, 'utf-8', (err: Error, data: string) => {
            if (err) console.log(`${err.message}`);
            resolve(data);
        });
    });
}

function wordExists(word: string, section: string[] | undefined): string | undefined {
    if (section === undefined) return undefined;
    // binary search
    let low = 0;
    let high = section.length;
    let mid = (low + high) / 2;
    // Makes sure it's alphanumeric
    while (low <= high) {
        if (section[mid]?.toLowerCase() < word.toLowerCase()) {
            low = mid + 1;
        }
        else if (section[mid]?.toLowerCase() > word.toLowerCase()) {
            high = mid - 1;
        } 
        mid = Math.floor((low + high) / 2);
        if(section[mid + 1].toLowerCase().trim() === word.toLowerCase().trim()) {
            return section[mid + 1].toLowerCase();
        }
    }
    return undefined;
}

// Going to hard-code -- I'm sure there is an algorithm but let's just figure this out first
function checkForAlternativeWords(mistake: string, section: string[] | undefined): string[] {
    // Figuring out solution for similar words?? Maybe ascii total?
    /*  Possible Rules
    *   1. Out of order
    *   2. Extra-letter
    *   3. Mispelling
    *   4. Proper noun (if i !== 0 and [0] is capital we can call it a proper noun)
    */
    
    // Section for this letter doesn't exist
    if (section === undefined) return [];
    const altWords: string[] = [];
    // Check for words that start with the same letter and have one letter difference
    section.forEach(word => {
        // Same order -- check for misplaced or duplicated letters 
        const wordMap: Map<string, number> = new Map<string, number>();
        word = word.trim();
        if (word.length === mistake.length) {
            for (let i = 0; i < word.length; i++)
            {
                wordMap.set(word.charAt(i).toLowerCase(), 1);
                wordMap.set(mistake.charAt(i).toLowerCase(), 1);
            }
            if (wordMap.size === mistake.length)
            {
                altWords.push(word); // If the map is the same size as the mistake array then it's just out of order
            }
        }
    });

    return altWords;
}

main();