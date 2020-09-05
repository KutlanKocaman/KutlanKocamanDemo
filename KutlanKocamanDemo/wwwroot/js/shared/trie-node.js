class TrieNode {
    constructor(val) {
        this.Val = val;
        this.Children = new Set();
        this.Word = '';
    }
}

export default TrieNode;