import { LinkedListNode } from './linked-list-node'

export class LinkedList {
    constructor() {
        this.firstNode = null;
        this.lastNode = null;
        this.length = 0;
    }

    first = () => {
        if (this.firstNode === null) {
            return null;
        }
        return this.firstNode.val;
    }

    last = () => {
        if (this.lastNode === null) {
            return null;
        }
        return this.lastNode.val;
    }

    addFirst = (val) => {
        if (this.length === 0) {
            //Add the first and only node.
            this.firstNode = new LinkedListNode(val);
            this.lastNode = this.firstNode;
        }
        else {
            //Add a new node to the start of the list.
            this.firstNode.prev = new LinkedListNode(val);
            //Set next of the new first node to point to the old first node.
            this.firstNode.prev.next = this.firstNode;
            //Set firstNode to the new firstNode.
            this.firstNode = this.firstNode.prev;
        }
        this.length++;
    }

    addLast = (val) => {
        if (this.length === 0) {
            //Add the first and only node.
            this.firstNode = new LinkedListNode(val);
            this.lastNode = this.firstNode;
        }
        else {
            //Add a new node to the end of the list.
            this.lastNode.next = new LinkedListNode(val);
            //Set prev of the new last node to point to the old last node.
            this.lastNode.next.prev = this.lastNode;
            //Set lastNode to the new lastNode.
            this.lastNode = this.lastNode.next;
        }
        this.length++;
    }

    removeFirst = () => {
        if (this.length === 0) {
            throw new Error('Cannot removeFirst from am empty linked list');
        }

        //Save the first node value for returning after the node is removed.
        let output = this.firstNode.val;

        //If there is a next node, make it forget the first node and make it the new first node.
        if (this.length > 1) {
            this.firstNode.next.prev = null;
            this.firstNode = this.firstNode.next;
        }
        else {
            this.firstNode = null;
        }
        this.length--;

        return output;
    }

    removeLast = () => {
        if (this.length === 0) {
            throw new Error('Cannot removeLast from am empty linked list');
        }

        //Save the last node value for returning after the node is removed.
        let output = this.lastNode.val;

        //If there is a prev node, make it forget the last node and make it the new last node.
        if (this.length > 1) {
            this.lastNode.prev.next = null;
            this.lastNode = this.lastNode.prev;
        }
        else {
            this.firstNode = null;
        }
        this.length--;

        return output;
    }
}