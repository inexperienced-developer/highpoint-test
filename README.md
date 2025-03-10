# Spellchecking Tool TypeScript

It's always interesting tackling a problem long-solved but never personally seen. When you think of a spell-checker, Microsoft Word has had it down for almost 30 years, so you just assume it's simple.

I picked this problem because it's these "simple" things in life that always seem to teach the most.

As I tackled this problem with the approach of an "untainted mind" as of now I'm not sure how professional programs implement the spellcheck (I am about to go check as I send this out to see how far off I was)

## Instructions

1. Install all node required node packages: `npm install`
2. Locate your dictionary and file to read
3. Run the program: `node spellchecker.js <dictionary_path> <file_to_check_path>`

## Design

### Thought Process

I went with a dictionary mapped to the first letter of each word to sort of chunk out the dictionary. That way I could not only parse less on each search but even less when performing a binary search on the list.

**Since this is a pre-loaded dictionary -- it might behoove us to break it down even further into sections of two or three letter words**

### Solutions considered but didn't attempt due to time constraints:

- Vectorization of dictionary and input file

### Typescript

I went with TypeScript as it's directly pertinent to the job.
