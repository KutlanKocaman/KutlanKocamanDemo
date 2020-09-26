import React from "react";
import { Row, Col } from "reactstrap";
import { DocumentTitle } from '../document-title';
import TrieNode from "../../shared/trie-node";
import { createMultiDimensionalArray, createDeepCopy, randomBetweenInclusive } from "../../shared/functions";
import { ModalInformational } from "../modal-info";
import { AnimationControl } from '../animation-control';

import '../../../css/word-search.css'

class WordSearch extends React.Component {
    constructor(props) {
        super(props)

        const rows = 10;
        const cols = 10;

        //Create a new empty grid.
        let grid = createMultiDimensionalArray(rows, cols);
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                grid[i][j] = { letter: null, state: '' };
            }
        }

        this.maxWords = 20;
        this.animationArray = [];

        this.state = {
            characters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
            words: [
                {
                    word: "KUTLANKOCAMAN",
                    cells: new Set(),
                    state: ''
                },
                {
                    word: "algo",
                    cells: new Set(),
                    state: ''
                },
                {
                    word: 'algorithms',
                    cells: new Set(),
                    state: ''
                },
                {
                    word: 'algorithmic',
                    cells: new Set(),
                    state: ''
                }],
            wordsAndGridInSync: false,
            rowCount: rows,
            columnCount: cols,
            maxRows: 20,
            grid: grid,
            animationArray: [],
            animationIndex: 0,
            animationState: 'PLAY',
            animationCancellationToken: null,
            animationSpeed: 100
        }
    }

/***********************************************************
Add a search word.
***********************************************************/

    addWord = (text = '') => {
        let newWords = createDeepCopy(this.state.words);

        newWords.push({
            word: text || '',
            cells: new Set(),
            state: ''
        });

        this.setState({
            words: newWords,
            wordsAndGridInSync: false
        });
    }

/***********************************************************
Delete a search word.
***********************************************************/

    deleteWord = (wordIndex) => {
        let newWords = createDeepCopy(this.state.words);

        newWords.splice(wordIndex, 1);

        this.setState({
            words: newWords,
            wordsAndGridInSync: false
        });
    }

/***********************************************************
Update a search word.
***********************************************************/

    updateWord = (event, index) => {
        let newWords = createDeepCopy(this.state.words);

        //Set the word to equal the input element text.
        newWords[index].word = event.target.value;

        this.setState({
            words: newWords,
            wordsAndGridInSync: false
        });
    }

/***********************************************************
Highlight a search word and show it on the grid.
***********************************************************/

    showMeWord = (word) => {
        let grid = createDeepCopy(this.state.grid);
        let words = createDeepCopy(this.state.words);

        //Collect the grid cells for the word.
        let cellsToShow = new Set();
        for (let cellCoordinate of word.cells) {
            let coords = cellCoordinate.split(',');
            let row = coords[0];
            let col = coords[1];
            cellsToShow.add(grid[row][col]);
        }

        //Set the new state for the word:
        //If the word is not currently shown, then show it. Otherwise un-show it.
        let newState;
        if (word.state !== 'SHOW') {
            newState = 'SHOW';
        }
        else {
            if (word.cells.size > 0) {
                newState = 'FOUND';
            }
            else {
                newState = '';
            }
        }
        //Iterate through the words to set the state of each.
        for (let i = 0; i < words.length; i++) {
            //Set the new state for the clicked word.
            if (words[i].word === word.word) {
                words[i].state = newState;
            }
            //Un-show all other words.
            else {
                if (words[i].cells.size > 0) {
                    words[i].state = 'FOUND';
                }
                else {
                    words[i].state = '';
                }
            }
        }

        //Iterate through all the cells in the grid.
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[0].length; j++) {
                //If this is a cell for the clicked word, decide whether to show it or not.
                if (cellsToShow.has(grid[i][j])) {
                    grid[i][j].state = newState === 'SHOW' ? 'SHOW' : 'FOUND';
                }
                //Else if it is currently SHOWn, then un-SHOW it.
                else if (grid[i][j].state === 'SHOW') {
                    //It must be a found word, otherwise it couldn't be shown.
                    grid[i][j].state = 'FOUND';
                }
            }
        }

        this.setState({
            grid: grid,
            words: words
        });
    }

/***********************************************************
Populate the grid.
***********************************************************/

    populateGrid = (words) => {
        let grid = createDeepCopy(this.state.grid);

        //Empty the grid.
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[0].length; j++) {
                grid[i][j] = {
                    letter: null,
                    state: 0
                }
            }
        }

        //Iterate through each word and place them on the grid in randomly.
        for (let w = 0; w < words.length; w++) {
            let row, col;
            let wordPlaced = false; //True if the word has been successfully placed in the grid.
            let usedCells = new Set(); //All the cells which have been used to place this word.

            for (let i = 0; i < 1000; i++) { //Prevent infinite attempts to place the word in the grid.
                row = randomBetweenInclusive(0, grid.length - 1);
                col = randomBetweenInclusive(0, grid[0].length - 1);

                //Choose a random position for the first letter of the word.
                //The random cell must be empty or it must contain the same letter as we want to place.
                while (grid[row][col].letter !== null && grid[row][col].letter !== words[w].word.charAt(0)) {
                    row = randomBetweenInclusive(0, grid.length - 1);
                    col = randomBetweenInclusive(0, grid[0].length - 1);
                }

                //Save the cell's letter in case we need to reverse the change.
                let originalCellValue = grid[row][col].letter;

                //Place this letter on the grid.
                usedCells.add(this.getCellIdentifier(row, col));
                grid[row][col].letter = words[w].word.charAt(0);

                //Attempt to place the rest of the word on the grid.
                wordPlaced = this.placeNextLetter(grid, words[w].word, 1, row, col, usedCells);
                usedCells.delete(this.getCellIdentifier(row, col));
                //If we have succceeded then stop trying to place this word.
                if (wordPlaced === true) {
                    break;
                }
                //Else reset this cell on the grid and backtrack to try again.
                grid[row][col].letter = originalCellValue;
            }
        }

        //Fill the rest of the grid with random letters.
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[0].length; j++) {
                if (grid[i][j].letter === null) {
                    grid[i][j].letter = this.state.characters[randomBetweenInclusive(0, this.state.characters.length - 1)];
                }
            }
        }
        return grid;
    }

/***********************************************************
Attempt to place the next letter on the grid.
***********************************************************/

    placeNextLetter = (grid, word, curCharIndex, curRow, curCol, usedCells) => {
        //We have placed the entire word already so return true.
        if (curCharIndex >= word.length) {
            return true;
        }

        let neighbouringCells = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0]
        ];

        //Consider all neighbouring cells.
        while (neighbouringCells.length > 0) {
            //Pick a random neighbouring cell to place the next letter.
            let randomNeighbourIndex = randomBetweenInclusive(0, neighbouringCells.length - 1);
            let newRow = curRow + neighbouringCells[randomNeighbourIndex][0];
            let newCol = curCol + neighbouringCells[randomNeighbourIndex][1];

            //Remove the chosen neighbour in case it is not valid, so it cannot be chosen again.
            neighbouringCells.splice(randomNeighbourIndex, 1);

            //Check if the random neighbour is valid and not used already.
            if (newRow >= 0 && newRow < grid.length
                && newCol >= 0 && newCol < grid[0].length
                && !usedCells.has(this.getCellIdentifier(newRow, newCol))) {
                let originalCellValue = grid[newRow][newCol].letter;
                //The neighbouring cell has to be empty or contain the letter we want to place.
                if (grid[newRow][newCol].letter === null || grid[newRow][newCol].letter === word.charAt(curCharIndex)) {
                    usedCells.add(this.getCellIdentifier(newRow, newCol));
                    grid[newRow][newCol].letter = word.charAt(curCharIndex);
                    //If placing entire word was successful then return true.
                    if (this.placeNextLetter(grid, word, curCharIndex + 1, newRow, newCol, usedCells) === true) {
                        return true;
                    }
                    //Else backtrack and try another neighbour.
                    usedCells.delete(this.getCellIdentifier(newRow, newCol));
                    grid[newRow][newCol].letter = originalCellValue;
                }
            }
        }
        //If we went through all neighbouring cells unsuccessfully, then we've failed to place the word from here.
        return false;
    }

/***********************************************************
Find the words on the grid.
***********************************************************/

    wordSearch = (words, grid) => {
        let output = {
            grid: grid,
            words: words
        }

        //Create a prefix tree (trie) to hold all of the words to find on the grid.
        let trieRoot = new TrieNode(' ');
        for (let i = 0; i < words.length; i++) {
            let curNode = trieRoot;
            for (let j = 0; j < words[i].word.length; j++) {
                //If the current node doesn't have the current letter of this word as one of its children, add it.
                if (!(words[i].word.charAt(j) in curNode.Children)) {
                    curNode.Children[words[i].word.charAt(j)] = new TrieNode(words[i].word.charAt(j));
                }
                //Set the curNode to the child node representing the next letter.
                curNode = curNode.Children[words[i].word.charAt(j)];

                //If this is the end of a word, mark is as such.
                if (j == words[i].word.length - 1) {
                    curNode.Word = words[i].word;
                }
            }
        }

        let outputHash = new Set();
        let usedCells = new Set();

        //Iterate through the grid.
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[0].length; j++) {
                const originalCellState = grid[i][j].state;

                let result = false;
                //If the root contains the letter as a child.
                if (grid[i][j].letter in trieRoot.Children) {
                    let cellIndex = this.getCellIdentifier(i, j);
                    usedCells.add(cellIndex);

                    //Queue the animation to show we matched a letter.
                    this.animationArray.push({
                        type: 'grid',
                        row: i,
                        column: j,
                        state: 'PARTFOUND'
                    });

                    //Try to find the rest of the word.
                    result = this.wordSearchCellRecurse(grid, words, usedCells, outputHash, trieRoot.Children[grid[i][j].letter], i, j);

                    usedCells.delete(cellIndex);
                }
                else {
                    //Queue the animation to show we didn't match a letter.
                    this.animationArray.push({
                        type: 'grid',
                        row: i,
                        column: j,
                        state: 'MISMATCH'
                    });
                }

                //We found a word.
                if (result === true) {
                    grid[i][j].state = 'FOUND';

                    //Queue the animation.
                    this.animationArray.push({
                        type: 'grid',
                        row: i,
                        column: j,
                        state: 'FOUND'
                    });

                    //We found a word and the node has no children, so delete the node.
                    if (Object.keys(trieRoot.Children[grid[i][j].letter].Children).length === 0) {
                        delete trieRoot.Children[grid[i][j].letter];
                    }
                    //If the trie now has no words left in it, stop the search.
                    if (Object.keys(trieRoot.Children).length === 0) {
                        return output;
                    }
                }
                //We didn't find a word.
                else {
                    grid[i][j].state = originalCellState;

                    //Queue the animation.
                    this.animationArray.push({
                        type: 'grid',
                        row: i,
                        column: j,
                        state: originalCellState
                    });
                }
            }
        }
        return output;
    }

/***********************************************************
Recursion method to find the next letter in a word.
***********************************************************/

    wordSearchCellRecurse = (grid, words, usedCells, outputHash, curNode, row, col) => {
        let foundWord = false;

        //Check if we have found a word.
        if (curNode.Word !== '') {
            if (!outputHash.has(curNode.Word)) {
                outputHash.add(curNode.Word);
                foundWord = true;

                //Update the found word with the cells which match it.
                for (let i = 0; i < words.length; i++) {
                    if (words[i].word === curNode.Word) {
                        words[i].cells = createDeepCopy(usedCells);

                        //Queue the animation to visually show the word as FOUND.
                        this.animationArray.push({
                            type: 'words',
                            word: curNode.Word,
                            state: 'SHOW'
                        });
                        this.animationArray.push({
                            type: 'words',
                            word: curNode.Word,
                            state: 'FOUND'
                        });
                    }
                }
            }
        }

        //Clockwise order: up, right, down, left
        let neighbouringCells = [
            [-1, 0],
            [0, 1],
            [1, 0],
            [0, -1]
        ];

        //Iterate through neighbouring cells.
        for (let i = 0; i < neighbouringCells.length; i++) {
            let newRow = row + neighbouringCells[i][0];
            let newCol = col + neighbouringCells[i][1];
            let cellIndex = this.getCellIdentifier(newRow, newCol);

            //If the curNode has no children, stop iterating through neighbouring cells.
            if (curNode.Children.size === 0
                && Object.keys(curNode.Children).length === 0) { //Work around for Set.size not always returning the correct value.
                break;
            }

            //If the row and column indexes are valid on the grid
            //and the cell has not already been used to match this word.
            if (newRow >= 0 && newRow < grid.length
                && newCol >= 0 && newCol < grid[0].length
                && !usedCells.has(cellIndex)) {

                //Queue the animation to show that this cell is being examined.
                const originalCellState = grid[newRow][newCol].state;

                //If this cell's letter is one of the TrieNode's children.
                if ((grid[newRow][newCol].letter in curNode.Children)) {
                    //Add the cell to the set of cells that have been used to match this word.
                    usedCells.add(cellIndex);

                    //Queue the animation to show that we have matched a letter in this cell.
                    this.animationArray.push({
                        type: 'grid',
                        row: newRow,
                        column: newCol,
                        state: 'PARTFOUND'
                    });

                    //See if we can find a word using this neighbour
                    let result = this.wordSearchCellRecurse(grid, words, usedCells, outputHash, curNode.Children[grid[newRow][newCol].letter], newRow, newCol);

                    //Remove the cell from the set of cells which have already been used to match this word.
                    usedCells.delete(cellIndex);

                    //If we found a word further up the stack.
                    if (result === true) {
                        //Mark it as found.
                        grid[newRow][newCol].state = 'FOUND';
                        foundWord = true;

                        //Queue the animation.
                        this.animationArray.push({
                            type: 'grid',
                            row: newRow,
                            column: newCol,
                            state: 'FOUND'
                        });

                        //We found a word and the trie node for that word has no children, so delete the node.
                        if (Object.keys(curNode.Children[grid[newRow][newCol].letter].Children).length === 0) {
                            delete curNode.Children[grid[newRow][newCol].letter];
                        }
                    }
                    //We didn't find a word further up the stack.
                    else {
                        grid[newRow][newCol].state = originalCellState;

                        //Queue the animation to return the call back to its original state.
                        this.animationArray.push({
                            type: 'grid',
                            row: newRow,
                            column: newCol,
                            state: originalCellState
                        });
                    }

                }
                //The cell's letter does not match any of the TrieNode's children.
                else {
                    grid[newRow][newCol].state = originalCellState;

                    //Show the mismsatch...
                    this.animationArray.push({
                        type: 'grid',
                        row: newRow,
                        column: newCol,
                        state: 'MISMATCH'
                    });
                    //Then return the cell to its original state.
                    this.animationArray.push({
                        type: 'grid',
                        row: newRow,
                        column: newCol,
                        state: originalCellState
                    });
                }
            }
        }

        //If a word has been found.
        if (foundWord === true) {
            //Remove the word from the Trie.
            curNode.Word = '';
        }

        return foundWord;
    }

/***********************************************************
Get the unique identifier of a cell.
***********************************************************/

    getCellIdentifier = (row, col) => {
        return row + ',' + col;
    }

/***********************************************************
Start a new animation.
***********************************************************/

    startNewAnimation = (callback) => {
        this.animationArray = [];

        let words = this.resetAndCleanWords();

        let grid = this.populateGrid(words);

        //Find the words - fill this.animationArray. Pass a deep copy of grid, so that we don't change the state.
        //Only the animation should change the state.
        this.wordSearch(words, createDeepCopy(grid));

        //Set the animation array state to trigger a re-render.
        this.setState({
            animationArray: this.animationArray,
            animationIndex: 0,
            grid: grid,
            words: words,
            wordsAndGridInSync: true
        }, () => {
            //Do the callback if one is supplied.
            if (callback) {
                callback();
            }
        });
    }

/***********************************************************
Do the next animation in the array.
***********************************************************/

    doOneAnimation = () => {
        const animation = this.state.animationArray[this.state.animationIndex];

        if (animation.type === 'grid') {
            const newGrid = createDeepCopy(this.state.grid);

            //Change the state of the grid cell specified in the animation.
            newGrid[animation.row][animation.column].state = animation.state;

            this.setState({
                grid: newGrid
            });
        }
        else if (animation.type === 'words') {
            const newWords = createDeepCopy(this.state.words);

            //Find the word affected by the animation and change its state.
            for (let i = 0; i < newWords.length; i++) {
                if (newWords[i].word === animation.word) {
                    newWords[i].state = animation.state;
                }
            }

            this.setState({
                words: newWords
            });
        }
        
        //Increment the animation index.
        this.setState((state) => {
            return { animationIndex: state.animationIndex + 1 }
        });
    }

/***********************************************************
Do all the remaining animations in the array.
***********************************************************/

    doRemainingAnimations = () => {
        let newAnimationIndex = this.state.animationIndex;
        const newGrid = createDeepCopy(this.state.grid);
        const newWords = createDeepCopy(this.state.words);

        //Loop through the remaining animations
        while (newAnimationIndex < this.state.animationArray.length) {
            const animation = this.state.animationArray[newAnimationIndex];

            if (animation.type === 'grid') {
                //Change the state of the grid cell specified in the animation.
                newGrid[animation.row][animation.column].state = animation.state;
            }
            else if (animation.type === 'words') {
                //Find the word affected by the animation and change its state.
                for (let i = 0; i < newWords.length; i++) {
                    if (newWords[i].word === animation.word) {
                        newWords[i].state = animation.state;
                    }
                }
            };
            newAnimationIndex++;
        }

        this.setState({
            animationIndex: newAnimationIndex,
            grid: newGrid,
            words: newWords
        });
    }

/***********************************************************
Replay the animation from the start.
***********************************************************/

    replayAnimation = (callback) => {
        //Reset the states/colours on the grid.
        let newGrid = createDeepCopy(this.state.grid);
        for (let i = 0; i < newGrid.length; i++) {
            for (let j = 0; j < newGrid[i].length; j++) {
                newGrid[i][j].state = '';
            }
        }

        //Set all words to be not shown.
        let newWords = createDeepCopy(this.state.words);
        for (let i = 0; i < newWords.length; i++) {
            newWords[i].state = '';
        }

        this.setState({
            animationIndex: 0,
            grid: newGrid,
            words: newWords
        }, () => {
            //Do the callback if one is provided.
            if (callback) {
                callback();
            }
        });
    }

/***********************************************************
Check if the animation is still running.
***********************************************************/

    isAnimationRunning = () => {
        if (this.state.animationArray.length > 0
            && this.state.animationIndex < this.state.animationArray.length) {
            return true;
        }
        else {
            return false;
        }
    }

/***********************************************************
Reset the words list, and clean them ready for use.
***********************************************************/

    resetAndCleanWords = () => {
        //Reset words.
        let words = createDeepCopy(this.state.words);
        for (let i = 0; i < words.length; i++) {
            words[i].cells = new Set(); //Cells will be re-populated by the word search algorithm.
            words[i].state = ''; //No words are "show me"d yet.
        }

        //Clean words.
        let distinctWords = new Set();
        for (let i = words.length - 1; i >= 0; i--) {
            //Make all words upper case.
            words[i].word = words[i].word.toUpperCase();

            //Remove empty words.
            if (words[i].word.trim() === '') {
                words.splice(i, 1);
                continue;
            }

            //Remove duplicate words.
            if (distinctWords.has(words[i].word)) {
                words.splice(i, 1);
                continue;
            }
            distinctWords.add(words[i].word);
        }

        return words;
    }

/***********************************************************
Change the number of rows and columns in the grid.
***********************************************************/

    updateGridRowColumnCount = (event) => {
        //Set the new row and column count.
        let newRowColCount = parseInt(event.target.value);

        //If the value in the cell cannot be parsed as an integer then set to be blank.
        if (Number.isNaN(newRowColCount)) {
            newRowColCount = '';
        }
        //It is a valid number.
        else {
            //Prevent the grid from being too big.
            if (newRowColCount > this.state.maxRows) {
                newRowColCount = this.state.maxRows;
            }
            //Prevent the grid from being too small.
            else if (newRowColCount < 0) {
                newRowColCount = 0;
            }
        }

        //Create the new empty grid based on the new row and column counts.
        let newRowColCountInt = newRowColCount === '' ? 0 : newRowColCount;
        let grid = createMultiDimensionalArray(newRowColCountInt, newRowColCountInt);
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                grid[i][j] = { letter: null, state: 0 };
            }
        }

        this.setState({
            rowCount: newRowColCount,
            colCount: newRowColCount,
            grid: grid,
            wordsAndGridInSync: false
        });
    }

/***********************************************************
Returns the class for a given cell based on its state.
***********************************************************/

    getCellClass = (cell) => {
        switch (cell.state) {
            case 'PARTFOUND':
                return "grid-cell word-search-partfound";
            case 'FOUND':
                return "grid-cell word-search-found";
            case 'MISMATCH':
                return "grid-cell word-search-mismatch";
            case 'SHOW':
                return "grid-cell word-search-show";
            default:
                return "grid-cell";
        }
    }

/***********************************************************
Returns the class for a given word.
***********************************************************/

    getWordInputClass = (word) => {
        if (!this.state.wordsAndGridInSync) {
            return "form-control search-word";
        }

        switch (word.state) {
            case 'FOUND':
                return "form-control search-word word-search-found";
            case 'SHOW':
                return "form-control search-word word-search-show";
            default:
                return "form-control search-word";
        }
    }

/***********************************************************
Returns the class of a show me button.
***********************************************************/

    getShowMeButtonClass = (word) => {
        //If there is no animation yet (because the search hasn't been run),
        //or the animation is still playing,
        //or the words and grid are not in sync
        if (this.state.animationArray.length === 0
            || this.state.animationIndex < this.state.animationArray.length
            || this.state.wordsAndGridInSync !== true) {
            //Hide the Show Me buttons.
            return "hidden";
        }
        else {
            //If the "Show Me" button has been clicked for this word.
            if (word.state === 'SHOW') {
                return "btn btn-primary show-me-button word-search-show";
            }
            else {
                return "btn btn-primary show-me-button";
            }
        }
        return "";
    }

/***********************************************************
Decides whether the add word button should be disabled.
***********************************************************/

    shouldAddWordBeDisabled = () => {
        if (this.isAnimationRunning()
            || this.state.words.length >= this.maxWords) {
            return true;
        }
        else {
            return false;
        }
    }

/***********************************************************
Create and return the word list elements.
***********************************************************/

    createWordsList = () => {
        //Create the word list.
        const wordsList = this.state.words.map((word, index) => {
            return ([
                <div
                    key={index}>
                    <input
                        className={this.getWordInputClass(word)}
                        readOnly={this.isAnimationRunning()}
                        maxLength="13"
                        value={word.word}
                        onKeyDown={(event) => {
                            //Allow only letters to be entered into the words to be searched (or backspace or delete).
                            let key = event.key;
                            let regex = new RegExp(/[a-zA-Z]/);
                            if (!(regex.test(key) === true || key === 'backspace')) {
                                event.preventDefault();
                            }
                        }}
                        onChange={(event) => this.updateWord(event, index)}
                    />
                    <button
                        title="Remove this word"
                        className="btn btn-danger remove-word-button"
                        disabled={this.isAnimationRunning()}
                        onClick={() => this.deleteWord(index)}
                    >-</button>
                    <button
                        className={this.getShowMeButtonClass(word)}
                        onClick={() => this.showMeWord(word)}
                    >Show Me</button>
                </div>
            ])
        });

        return wordsList;
    }

/***********************************************************
Creates and returns a row of the grid.
***********************************************************/

    renderRow = (i) => {
        let cells = this.state.grid[i].map((cell, index) =>
            <td
                className={this.getCellClass(cell)}
                key={index.toString()}
            >{cell.letter}</td>
        );
        return cells;
    }

/***********************************************************
Creates and returns all grid rows.
***********************************************************/

    createGridRows = () => {
        //First create the cells for all rows.
        let rowCells = [];
        for (let i = 0; i < this.state.grid.length; i++) {
            rowCells.push(this.renderRow(i));
        }

        //Then create each row.
        const gridRows = rowCells.map((value, index) =>
            <tr
                className="grid-row"
                key={index.toString()}
            >{value}</tr>
        );

        return gridRows;
    }

/***********************************************************
React Render Method.
***********************************************************/

    render() {
        const wordsList = this.createWordsList();

        //Create the grid rows.
        const gridRows = this.createGridRows();

        //Build the Word Search.
        return (
            <Row>
                <DocumentTitle documentTitle="Word Search" />
                <Col lg='6'>
                    <h3>Word Search</h3>
                    <h5>Intructions:</h5>
                    <ol>
                        <li className="instructions-list-item">Enter up to {this.maxWords} words. No duplicates.</li>
                        <li className="instructions-list-item">Click "Start New Animation".</li>
                        <li className="instructions-list-item">Find the words before the algorithm does.</li>
                    </ol>
                    <h5>Rules:</h5>
                    <ul>
                        <li className="instructions-list-item">Words can move across the grid horizontally or vertically - not diagonally.</li>
                        <li className="instructions-list-item">The direction of a word can change mid-word.</li>
                        <li className="instructions-list-item">The same grid cell can only be used once per word.</li>
                    </ul>
                    <ModalInformational
                        buttonText="More Information"
                        modalTitle="More Information"
                        modalContents={
                            <div>
                            <p>
                                The algorithm is based
                                on the <a href="https://leetcode.com/problems/word-search-ii/" target="_blank">WordSearch II</a> algorithm
                                from <a href="https://leetcode.com/" target="_blank">LeetCode.com</a>. LeetCode have very good, detailed
                                break-down of how the algorithm works.
                            </p>
                            <p>
                                I've made a few changes to the LeetCode version.
                                Firstly, I've added the animations.
                                Secondly, I've made it stop searching through the grid when the trie is empty.
                                Thirdly, I've made it stop iterating through neighbouring cells if there are no more words that can be found
                                from the current position.
                                The last two modifications don't change the big-O time complexity of the algorithm, but they do make the
                                animation look better, because it doesn't keep looking for words when there aren't any to find.
                            </p>
                            <p>
                                The clever thing about the algorithm is the use of a trie, or prefix tree, data structure.
                                This prevents the time complexity of the algorithm increasing with the number of words to be searched.
                            </p>
                            </div>
                        }
                    />
                    <br />
                    <h5>Words to Go on the Grid:</h5>
                    {wordsList}
                    <button
                        className="btn btn-primary add-word-button"
                        disabled={this.shouldAddWordBeDisabled()}
                        onClick={() => this.addWord()}
                    >+</button>
                </Col>
                <Col lg='6'>
                    <AnimationControl
                        animationArray={this.state.animationArray}
                        animationIndex={this.state.animationIndex}
                        startNewAnimation={this.startNewAnimation}
                        doOneAnimation={this.doOneAnimation}
                        doRemainingAnimations={this.doRemainingAnimations}
                        replayAnimation={this.replayAnimation}
                        minTimeBetweenAnimationsMs={1}
                        maxTimeBetweenAnimationsMs={500}
                    />
                    <br />
                    <label>How Many Rows and Columns?</label>
                    <input
                        className="form-control row-count-input"
                        readOnly={this.isAnimationRunning()}
                        maxLength="2"
                        value={this.state.rowCount}
                        onKeyDown={(event) => {
                            //Allow only numbers to be entered into the row/col count input (or backspace or delete).
                            let key = event.key;
                            let regex = new RegExp(/[0-9]/);
                            let acceptableNonDigits = new Set();
                            acceptableNonDigits.add('Backspace');
                            acceptableNonDigits.add('Delete');
                            acceptableNonDigits.add('ArrowLeft');
                            acceptableNonDigits.add('ArrowRight');
                            if (!(regex.test(key) === true || acceptableNonDigits.has(key))) {
                                event.preventDefault();
                            }
                        }}
                        onChange={(event) => this.updateGridRowColumnCount(event)}
                    />
                    <br />
                    <table>
                        <tbody>
                            {gridRows}
                        </tbody>
                    </table >
                </Col>
            </Row>
        );
    }
}

export default WordSearch;