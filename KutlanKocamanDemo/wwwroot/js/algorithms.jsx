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
                    show: false
                },
                {
                    word: "algo",
                    cells: new Set(),
                    show: false
                },
                {
                    word: 'algorithms',
                    cells: new Set(),
                    show: false
                },
                {
                    word: 'algorithmic',
                    cells: new Set(),
                    show: false
                }],
            maxWords: 20,
            wordsAndGridInSync: false,
            rowCount: rows,
            columnCount: cols,
            maxRows: 40,
            grid: grid,
            animationQueue: [],
            animationIndex: 0,
            animationState: 'PLAY',
            animationCancellationToken: null
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
            show: false
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

        //Set the new "show" state for the word:
        //If the word is not currently shown, then show it. Otherwise un-show it.
        let newShow = word.show === false ? true : false;
        for (let i = 0; i < words.length; i++) {
            //Set the new state for the clicked word.
            if (words[i].word === word.word) {
                words[i].show = newShow;
            }
            //Un-show all other words.
            else {
                words[i].show = false;
            }
        }

        //Iterate through all the cells in the grid.
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[0].length; j++) {
                //If this is a cell for the clicked word, decide whether to show it or not.
                if (cellsToShow.has(grid[i][j])) {
                    grid[i][j].state = newShow === true ? 'SHOW' : 'FOUND';
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
                grid[i][j].state = 'VISITING';
                //Queue the animation to show that this cell is being examined.
                this.queueAnimation(i, j, 'VISITING');

                let result = false;
                //If the root contains the letter as a child.
                if (grid[i][j].letter in trieRoot.Children) {
                    let cellIndex = this.getCellIndex(i, j);
                    usedCells.add(cellIndex);

                    //Queue the animation to show we matched a letter.
                    this.queueAnimation(i, j, 'PARTFOUND');

                    //Try to find the rest of the word.
                    result = this.wordSearchCellRecurse(grid, words, usedCells, outputHash, trieRoot.Children[grid[i][j].letter], i, j);

                    usedCells.delete(cellIndex);
                }

                //We found a word.
                if (result === true) {
                    grid[i][j].state = 'FOUND';
                    this.queueAnimation(i, j, 'FOUND');

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
                    this.queueAnimation(i, j, originalCellState);
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

                //Update the words with the cells which match it.
                for (let i = 0; i < words.length; i++) {
                    if (words[i].word === curNode.Word) {
                        words[i].cells = createDeepCopy(usedCells);
                    }
                }
            }
        }

        let neighbouringCells = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0]
        ];

        //Iterate through neighbouring cells.
        for (let i = 0; i < neighbouringCells.length; i++) {
            let newRow = row + neighbouringCells[i][0];
            let newCol = col + neighbouringCells[i][1];
            let cellIndex = this.getCellIndex(newRow, newCol);

            //If the row and column indexes are valid on the grid
            //and the cell has not already been used to match this word.
            if (newRow >= 0 && newRow < grid.length
                && newCol >= 0 && newCol < grid[0].length
                && !usedCells.has(cellIndex)) {

                //Queue the animation to show that this cell is being examined.
                let originalCellState = grid[newRow][newCol].state;
                this.queueAnimation(newRow, newCol, 'VISITING', 4);

                //If this cell's letter is one of the TrieNode's children.
                if ((grid[newRow][newCol].letter in curNode.Children)) {
                    //Add the cell to the set of cells that have been used to match this word.
                    usedCells.add(cellIndex);

                    //Queue the animation to show that we have matched a letter in this cell.
                    this.queueAnimation(newRow, newCol, 'PARTFOUND', 6);

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
                        this.queueAnimation(newRow, newCol, 'FOUND', 6);

                        //We found a word and the trie node for that word has no children, so delete the node.
                        if (Object.keys(curNode.Children[grid[newRow][newCol].letter].Children).length === 0) {
                            delete curNode.Children[grid[newRow][newCol].letter];
                        }
                    }
                    //We didn't find a word further up the stack.
                    else {
                        grid[newRow][newCol].state = originalCellState;
                        this.queueAnimation(newRow, newCol, originalCellState, 6);
                    }

                }
                //The cell's letter does not match any of the TrieNode's children.
                else {
                    grid[newRow][newCol].state = originalCellState;
                    //Show the mismsatch...
                    this.queueAnimation(newRow, newCol, 'MISMATCH', 6);
                    //Then return the cell to its original state.
                    this.queueAnimation(newRow, newCol, originalCellState, 6);
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

    queueAnimation = (row, col, cellState, time) => {
        this.state.animationQueue.push({
            row: row,
            col: col,
            cellState: cellState,
            time: time
        });
    }

    doAnimation = () => {
        let grid = createDeepCopy(this.state.grid);
        let newAnimationState = this.state.animationState;
        let newAnimationIndex = this.state.animationIndex;
        let animationTime = 100;

        if (this.state.animationState === 'REPLAY') {
            newAnimationState = 'PLAY';
            newAnimationIndex = 0;

            //Reset cell states to 0.
            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < grid[i].length; j++) {
                    grid[i][j].state = 0;
                }
            }
        }
        else if (this.state.animationState === 'PLAY') {
            if (this.state.animationIndex < this.state.animationQueue.length) {
                let animation = this.state.animationQueue[this.state.animationIndex];
                grid[animation.row][animation.col].state = animation.cellState;
                animationTime = 50 * (animation.time || 1);
                newAnimationIndex = this.state.animationIndex + 1;
            }
        }
        else if (this.state.animationState === 'SKIP') {
            let i = this.state.animationIndex;
            while (i < this.state.animationQueue.length) {
                let animation = this.state.animationQueue[i];
                grid[animation.row][animation.col].state = animation.cellState;
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
            words[i].show = false;
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

    /***********************************************************
    Word Search Preparation Methods
    ***********************************************************/

    resetAndCleanWords = () => {
        //Reset words.
        let words = createDeepCopy(this.state.words);
        for (let i = 0; i < words.length; i++) {
            words[i].cells = new Set(); //Cells will be re-populated by the word search algorithm.
            words[i].show = false; //No words are "show me"d yet.
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
                this.setState({
                    grid: wordSearchResult.grid,
                    words: wordSearchResult.words,
                    wordsAndGridInSync: true
                });
                this.doAnimation();
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
        let newRowCount = parseInt(event.target.value);
        let newColCount = parseInt(event.target.value);

        //If the value in the cell cannot be parsed as an integer then set a valid integer.
        if (Number.isNaN(newRowCount)) {
            newRowCount = 0;
            newColCount = 0;
        }

        //Prevent the grid from being too big.
        if (newRowCount > this.state.maxRows) {
            newRowCount = this.state.maxRows;
            newColCount = this.state.maxRows;
        }
        //Prevent the grid from being too small.
        else if (newRowCount < 0) {
            newRowCount = 0;
            newColCount = 0;
        }

        //Create the new empty grid based on the new row and column counts.
        let grid = createMultiDimensionalArray(newRowCount, newColCount);
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                grid[i][j] = { letter: null, state: 0 };
            }
        }

        this.setState({
            rowCount: newRowCount,
            colCount: newColCount,
            grid: grid
        });
    }

    getCellClass = (cell) => {
        switch (cell.state) {
            case 'VISITING':
                return "grid-cell grid-cell-visiting";
            case 'PARTFOUND':
                return "grid-cell grid-cell-partfound";
            case 'FOUND':
                return "grid-cell grid-cell-found";
            case 'MISMATCH':
                return "grid-cell grid-cell-mismatch";
            case 'SHOW':
                return "grid-cell grid-cell-show";
            default:
                return "grid-cell";
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
            if (word.show === true) {
                return "show-me-button"
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

    getAnimationControlButtonClass = () => {
        if (this.state.wordsAndGridInSync !== true) {
            return "grid-control-button hidden";
        }
        else {
            return "grid-control-button";
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
                        className="search-word"
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
                    className="add-word-button"
                    disabled={this.shouldAddWordBeDisabled()}
                    onClick={() => this.addWord()}
                >Add a Word</button>
                <label>How Many Rows and Columns?</label>
                <input
                    className="row-count-input"
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
                    className="grid-control-button"
                    onClick={() => this.doWordSearch()}
                >Start New Search</button>

                <button
                    title="Play/Pause"
                    className={this.getAnimationControlButtonClass()}
                    onClick={() => {
                        this.setState({
                            animationState: this.state.animationState === 'PLAY' ? 'Pause' : 'PLAY'
                        });
                    }}
                >{this.state.animationState === 'PLAY' ? '⏸️' : '▶️'}</button>
                <button
                    title="Skip to the end"
                    className={this.getAnimationControlButtonClass()}
                    onClick={() => {
                        this.setState({
                            animationState: this.animationState === 'STOP' ? 'STOP' : 'SKIP'
                        });
                    }}
                >⏭️</button>
                <button 
                    title="Replay"
                    className={this.getAnimationControlButtonClass()}
                    onClick={this.replayAnimation}
                >🔄️</button>
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
