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
            maxWords: 20,
            wordsAndGridInSync: false,
            rowCount: rows,
            columnCount: cols,
            maxRows: 20,
            grid: grid,
            animationQueue: [],
            animationIndex: 0,
            animationState: 'PLAY',
            animationCancellationToken: null,
            animationSpeed: 100
        }
    }

    /***********************************************************
    Word Methods
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

    deleteWord = (wordIndex) => {
        let newWords = createDeepCopy(this.state.words);

        newWords.splice(wordIndex, 1);

        this.setState({
            words: newWords,
            wordsAndGridInSync: false
        });
    }

    updateWord = (event, index) => {
        let newWords = createDeepCopy(this.state.words);

        //Set the word to equal the input element text.
        newWords[index].word = event.target.value;

        this.setState({
            words: newWords,
            wordsAndGridInSync: false
        });
    }

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
    Grid Population Methods
    ***********************************************************/

    populateGrid = () => {
        let words = this.state.words;
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
                usedCells.add(this.getCellIndex(row, col));
                grid[row][col].letter = words[w].word.charAt(0);

                //Attempt to place the rest of the word on the grid.
                wordPlaced = this.placeNextLetter(grid, words[w].word, 1, row, col, usedCells);
                usedCells.delete(this.getCellIndex(row, col));
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
                && !usedCells.has(this.getCellIndex(newRow, newCol))) {
                let originalCellValue = grid[newRow][newCol].letter;
                //The neighbouring cell has to be empty or contain the letter we want to place.
                if (grid[newRow][newCol].letter === null || grid[newRow][newCol].letter === word.charAt(curCharIndex)) {
                    usedCells.add(this.getCellIndex(newRow, newCol));
                    grid[newRow][newCol].letter = word.charAt(curCharIndex);
                    //If placing entire word was successful then return true.
                    if (this.placeNextLetter(grid, word, curCharIndex + 1, newRow, newCol, usedCells) === true) {
                        return true;
                    }
                    //Else backtrack and try another neighbour.
                    usedCells.delete(this.getCellIndex(newRow, newCol));
                    grid[newRow][newCol].letter = originalCellValue;
                }
            }
        }
        //If we went through all neighbouring cells unsuccessfully, then we've failed to place the word from here.
        return false;
    }

    /***********************************************************
    Word Search Algorithm
    ***********************************************************/

    wordSearch = () => {
        let grid = createDeepCopy(this.state.grid);
        let words = createDeepCopy(this.state.words);
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
                let originalCellState = grid[i][j].state;

                let result = false;
                //If the root contains the letter as a child.
                if (grid[i][j].letter in trieRoot.Children) {
                    let cellIndex = this.getCellIndex(i, j);
                    usedCells.add(cellIndex);

                    //Queue the animation to show we matched a letter.
                    this.queueGridAnimation(i, j, 'PARTFOUND');

                    //Try to find the rest of the word.
                    result = this.wordSearchCellRecurse(grid, words, usedCells, outputHash, trieRoot.Children[grid[i][j].letter], i, j);

                    usedCells.delete(cellIndex);
                }
                else {

                    //Queue the animation to show we didn't match a letter.
                    this.queueGridAnimation(i, j, 'MISMATCH');
                }

                //We found a word.
                if (result === true) {
                    grid[i][j].state = 'FOUND';
                    this.queueGridAnimation(i, j, 'FOUND');

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
                    this.queueGridAnimation(i, j, originalCellState);
                }
            }
        }
        return output;
    }

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
                        this.queueWordAnimation(curNode.Word, 'SHOW', 6);
                        this.queueWordAnimation(curNode.Word, 'FOUND', 0);
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
            let cellIndex = this.getCellIndex(newRow, newCol);

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
                let originalCellState = grid[newRow][newCol].state;

                //If this cell's letter is one of the TrieNode's children.
                if ((grid[newRow][newCol].letter in curNode.Children)) {
                    //Add the cell to the set of cells that have been used to match this word.
                    usedCells.add(cellIndex);

                    //Queue the animation to show that we have matched a letter in this cell.
                    this.queueGridAnimation(newRow, newCol, 'PARTFOUND', 6);

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
                        this.queueGridAnimation(newRow, newCol, 'FOUND', 6);

                        //We found a word and the trie node for that word has no children, so delete the node.
                        if (Object.keys(curNode.Children[grid[newRow][newCol].letter].Children).length === 0) {
                            delete curNode.Children[grid[newRow][newCol].letter];
                        }
                    }
                    //We didn't find a word further up the stack.
                    else {
                        grid[newRow][newCol].state = originalCellState;
                        this.queueGridAnimation(newRow, newCol, originalCellState, 6);
                    }

                }
                //The cell's letter does not match any of the TrieNode's children.
                else {
                    grid[newRow][newCol].state = originalCellState;
                    //Show the mismsatch...
                    this.queueGridAnimation(newRow, newCol, 'MISMATCH', 6);
                    //Then return the cell to its original state.
                    this.queueGridAnimation(newRow, newCol, originalCellState, 6);
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

    getCellIndex = (row, col) => {
        return row + ',' + col;
    }

    /***********************************************************
    Animation Methods
    ***********************************************************/

    queueGridAnimation = (row, col, cellState, animationTime) => {
        this.state.animationQueue.push({
            type: 'GRID',
            row: row,
            col: col,
            cellState: cellState,
            time: animationTime
        });
    }

    queueWordAnimation = (wordString, wordState, animationTime) => {
        this.state.animationQueue.push({
            type: 'WORD',
            wordString: wordString,
            wordState: wordState,
            time: animationTime
        });
    }

    doAnimation = () => {
        let grid = createDeepCopy(this.state.grid);
        let words = createDeepCopy(this.state.words);
        let newAnimationState = this.state.animationState;
        let newAnimationIndex = this.state.animationIndex;
        let animationTime = 50 / (this.state.animationSpeed * 0.01);

        //If the words and grid are out of sync, then stop the animation.
        if (!this.state.wordsAndGridInSync) {
            return;
        }

        if (this.state.animationState === 'REPLAY') {
            newAnimationState = 'PLAY';
            newAnimationIndex = 0;

            //Reset all cell states.
            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < grid[i].length; j++) {
                    grid[i][j].state = '';
                }
            }

            //Reset all word states.
            for (let i = 0; i < words.length; i++) {
                words[i].state = '';
            }
        }
        else if (this.state.animationState === 'PLAY') {
            if (this.state.animationIndex < this.state.animationQueue.length) {
                let animation = this.state.animationQueue[this.state.animationIndex];
                if (animation.type === 'GRID') {
                    grid[animation.row][animation.col].state = animation.cellState;
                }
                else if (animation.type === 'WORD') {
                    //Iterate through the words and set the new state from the animation queue for the correct word.
                    for (let i = 0; i < words.length; i++) {
                        if (words[i].word === animation.wordString) {
                            words[i].state = animation.wordState;
                        }
                    }
                }
                animationTime = animationTime * (animation.time || 1);
                newAnimationIndex = this.state.animationIndex + 1;
            }
        }
        else if (this.state.animationState === 'SKIP') {
            let i = this.state.animationIndex;
            //Iterate through the remainder of the animation queue and apply all animations in one go.
            while (i < this.state.animationQueue.length) {
                let animation = this.state.animationQueue[i];
                if (animation.type === 'GRID') {
                    grid[animation.row][animation.col].state = animation.cellState;
                }
                else if (animation.type === 'WORD') {
                    //Iterate through the words and set the new state from the animation queue for the correct word.
                    for (let i = 0; i < words.length; i++) {
                        if (words[i].word === animation.wordString) {
                            words[i].state = animation.wordState;
                        }
                    }
                }
                i++;
            }
            newAnimationIndex = i;
        }

        //If we have reached the end of the animation queue then stop the polling.
        if (newAnimationIndex >= this.state.animationQueue.length) {
            newAnimationState = 'STOP'
        }

        //Set the state now that the latest animation has been applied.
        this.setState({
            grid: grid,
            words: words,
            animationState: newAnimationState,
            animationIndex: newAnimationIndex
        }, () => {
            //Set the timeout for the next queue poll if the animationState isn't stopped.
            if (this.state.animationState !== 'STOP') {
                this.animationCancellationToken = setTimeout(this.doAnimation, animationTime);
            }
        });
    }

    replayAnimation = () => {
        //Set all words to be not shown.
        let words = createDeepCopy(this.state.words);
        for (let i = 0; i < words.length; i++) {
            words[i].state = '';
        }
        
        this.setState({
            animationState: 'STOP',
            words: words
        }, () => {
            //Stop the current animation queue polling process if there is one running.
            if (this.animationCancellationToken !== null) {
                clearTimeout(this.animationCancellationToken);
            }
            this.setState({
                animationState: 'REPLAY'
            }, () => {
                this.doAnimation();
            });
        });
    }

    isAnimationRunning = () => {
        if (this.state.animationQueue.length > 0
            && this.state.animationIndex < this.state.animationQueue.length) {
            return true;
        }
        else {
            return false;
        }
    }

    changeAnimationSpeed = (event) => {
        let speed = event.target.value;

        this.setState({
            animationSpeed: speed
        });
    }

    /***********************************************************
    Word Search Preparation Methods
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

    doWordSearch = () => {
        //If the row/column count input is not a valid number, then return now.
        if (this.state.rowCount === '') {
            return;
        }

        let words = this.resetAndCleanWords();

        //Set words and animation queue in state.
        this.setState({
            words: words,
            //Reset the animation.
            animationQueue: [],
            animationIndex: 0,
            animationState: 'STOP'
        }, () => {
            //Stop the current animation queue polling process if it is running.
            if (this.animationCancellationToken !== null) {
                clearTimeout(this.animationCancellationToken);
            }

            //Ensure that the grid is only populated AFTER the words have been reset and cleaned.
            let grid = this.populateGrid();
            
            this.setState({
                grid: grid,
                animationState: 'PLAY'
            }, () => {
                //Ensure that the word search algorithm and the animation only start AFTER the grid state has been updated/populated.
                let wordSearchResult = this.wordSearch();

                //Reset the grid cells states ready for the animation to start.
                for (let i = 0; i < wordSearchResult.grid.length; i++) {
                    for (let j = 0; j < wordSearchResult.grid[i].length; j++) {
                        wordSearchResult.grid[i][j].state = '';
                    }
                }

                //Reset the word states ready for the animation to start.
                for (let i = 0; i < wordSearchResult.words.length; i++) {
                    wordSearchResult.words[i].state = '';
                }

                this.setState({
                    grid: wordSearchResult.grid,
                    words: wordSearchResult.words,
                    wordsAndGridInSync: true
                }, () => {
                    //The first animation should only happen AFTER the grid and words have been updated using the wordSearch algorithm
                    //and AFTER the grid and word states have been reset.
                    this.doAnimation();
                });
            });
        });
    }

    /***********************************************************
    UI Methods
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

    updateRowColumnCount = (event) => {
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

    getShowMeButtonClass = (word) => {
        //If there is no animation yet (because the search hasn't been run),
        //or the animation is still playing,
        //or the words and grid are not in sync
        if (this.state.animationQueue.length === 0
            || this.state.animationIndex < this.state.animationQueue.length
            || this.state.wordsAndGridInSync !== true) {
            //Hide the Show Me buttons.
            return "hidden";
        }
        else {
            //If the "Show Me" button has been clicked for this word.
            if (word.state === 'SHOW') {
                return "btn show-me-button word-search-show";
            }
            else {
                return "btn show-me-button";
            }
        }
        return "";
    }

    shouldAddWordBeDisabled = () => {
        if (this.isAnimationRunning()
            || this.state.words.length >= this.state.maxWords) {
            return true;
        }
        else {
            return false;
        }
    }

    /***********************************************************
    React Render Method
    ***********************************************************/

    render() {
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

        //Create the grid rows.
        let rowCells = [];
        for (let i = 0; i < this.state.grid.length; i++) {
            rowCells.push(this.renderRow(i));
        }
        const gridRows = rowCells.map((value, index) =>
            <tr
                className="grid-row"
                key={index.toString()}
            >{value}</tr>
        );

        //Build the Word Search.
        return (
            <div>
                <h3>Word Search</h3>
                {wordsList}
                <button
                    className="btn btn-default add-word-button"
                    disabled={this.shouldAddWordBeDisabled()}
                    onClick={() => this.addWord()}
                >+</button>
                <label>How Many Rows and Columns?</label>
                <input
                    className="form-control row-count-input"
                    disabled={this.isAnimationRunning()}
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
                    onChange={(event) => this.updateRowColumnCount(event)}
                />
                <br />
                <button
                    className="btn btn-success start-search-button"
                    onClick={() => this.doWordSearch()}
                >Start New Search</button>
                <button
                    title="Play/Pause"
                    className="btn btn-default grid-control-button"
                    disabled={!this.state.wordsAndGridInSync}
                    onClick={() => {
                        this.setState({
                            animationState: this.state.animationState === 'PLAY' ? 'Pause' : 'PLAY'
                        });
                    }}
                >{this.state.animationState === 'PLAY' ? '⏸️' : '▶️'}</button>
                <button
                    title="Skip to the end"
                    className="btn btn-default grid-control-button"
                    disabled={!this.state.wordsAndGridInSync}
                    onClick={() => {
                        this.setState({
                            animationState: this.animationState === 'STOP' ? 'STOP' : 'SKIP'
                        });
                    }}
                >⏭️</button>
                <button 
                    title="Replay"
                    className="btn btn-default grid-control-button"
                    disabled={!this.state.wordsAndGridInSync}
                    onClick={this.replayAnimation}
                >🔄️</button>
                <br />
                <label
                    htmlFor="animationSpeedRange"
                    className="word-search-speed-label"
                >Animation Speed:</label>
                <input
                    id="animationSpeedRange"
                    type="range"
                    min="25"
                    max="300"
                    className="custom-range word-search-speed-range"
                    disabled={!this.state.wordsAndGridInSync}
                    value={this.state.animationSpeed}
                    onChange={(event) => this.changeAnimationSpeed(event)}
                />
                <table>
                    <tbody>
                        {gridRows}
                    </tbody>
                </table >
            </div>
        );
    }
}

ReactDOM.render(<WordSearch />, document.getElementById('content'));
/**********************************************************
Classes
**********************************************************/

class TrieNode {
    constructor(val) {
        this.Val = val;
        this.Children = new Set();
        this.Word = '';
    }
}

/**********************************************************
Functions
**********************************************************/

function createMultiDimensionalArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while (i--) arr[length - 1 - i] = createMultiDimensionalArray.apply(this, args);
    }

    return arr;
}

function createDeepCopy(input) {
    let output, value, key

    //Return the value if object is not an object
    if (typeof input !== "object" || input === null) {
        return input;
    }

    //If the object is a Set then copy the Set and return it.
    if (input.constructor.name === 'Set') {
        output = new Set();
        for (let item of input) {
            output.add(createDeepCopy(item));
        }
    }
    //If the input is another kind of object or an array, copy it and return it.
    else {
        output = Array.isArray(input) ? [] : {};
        for (key in input) {
            value = input[key];

            //Recursively deep copy nested objects.
            let result = createDeepCopy(value);
            output[key] = result;
        }
    }
    return output;
}

function randomBetweenInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
