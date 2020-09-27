﻿import React from "react";
import { Row, Col, Button } from "reactstrap";
import { DocumentTitle } from '../document-title';
import { GraphArea } from '../graph-area';
import { GraphNode } from '../graph-node';
import { GraphEdge } from '../graph-edge';
import { createDeepCopy } from "../../shared/functions";
import { AnimationControl } from '../animation-control';
import { GraphEditer } from '../graph-editer';

export class TopologicalSort extends React.Component {
    constructor(props) {
        super(props);

        this.animationArray = [];
        this.maxNodes = 100;

        //Set up the example graph.
        this.state = {
            nodes: {
                0: {
                    x: 40,
                    y: 50
                },
                1: {
                    x: 140,
                    y: 50
                },
                2: {
                    x: 240,
                    y: 50
                },
                3: {
                    x: 40,
                    y: 140
                },
                4: {
                    x: 140,
                    y: 140
                },
                5: {
                    x: 240,
                    y: 140
                },
                6: {
                    x: 40,
                    y: 240
                },
                7: {
                    x: 140,
                    y: 240
                },
                8: {
                    x: 240,
                    y: 240
                },
                9: {
                    x: 40,
                    y: 340
                },
                10: {
                    x: 140,
                    y: 340
                },
                11: {
                    x: 240,
                    y: 340
                }
            },
            edges: {
                '0,1': {},
                '0,3': {},
                '1,4': {},
                '1,5': {},
                '4,3': {},
                '4,6': {},
                '5,4': {},
                '5,7': {},
                '6,3': {},
                '7,4': {},
                '7,6': {},
                '7,10': {},
                '9,6': {},
                '10,9': {},
                '11,8': {},
            },
            isNodeBeingDeleted: false,
            isEdgeBeingCreated: false,
            isEdgeBeingDeleted: false,
            newEdgeNodes: [],
            animationArray: [],
            animationIndex: 0,
            isAnimationInSync: false,
            algorithmResult: 'Result: '
        }
    }

/***********************************************************
Do the topological sort and fill the animationArray field (not state).
***********************************************************/

    topologicalSort = () => {
        let nodes = createDeepCopy(this.state.nodes);
        let edges = createDeepCopy(this.state.edges);
        let adjacencyList = {};
        let indegrees = {};

        //Create a dictionary to hold indegrees.
        const nodeKeys = Object.keys(nodes);
        for (let i = 0; i < nodeKeys.length; i++) {
            indegrees[nodeKeys[i]] = 0;
        }

        //Iterate through the edges and build the adjacency list and indegree counts.
        for (let i = 0; i < Object.keys(edges).length; i++) {
            let edgeNodes = Object.keys(edges)[i].split(',');

            //Increment indegree count for second node in the edge.
            indegrees[edgeNodes[1]]++;

            if (!adjacencyList.hasOwnProperty(edgeNodes[0])) {
                adjacencyList[edgeNodes[0]] = new Set();
            }
            adjacencyList[edgeNodes[0]].add(edgeNodes[1]);
        }

        //Set of nodes with no incoming edge.
        let indegreeZeroNodes = new Set();
        const indegreeKeys = Object.keys(indegrees);
        for (let i = 0; i < indegreeKeys.length; i++) {
            if (indegrees[indegreeKeys[i]] === 0) {
                indegreeZeroNodes.add(parseInt(indegreeKeys[i]));
            }
        }
        
        //Build an output list by taking nodes with no more dependencies from the set.
        let output = [];
        let zeroIndegreeIterator = indegreeZeroNodes.values();
        while (indegreeZeroNodes.size > 0) { //Consider Object.keys(indegreeZeroNodes).length if this is buggy
            //Get the next node with no incoming edges from the set.
            const removedNodeValue = zeroIndegreeIterator.next().value;
            indegreeZeroNodes.delete(removedNodeValue);

            //Add the node to the output.
            output.push(removedNodeValue);

            //Push the animation to show the node being removed.
            this.animationArray.push({
                type: 'nodes',
                nodeValue: removedNodeValue,
                state: 'FADED'
            });

            //If there are no edges originating from this node, continue on to the next node with no incoming edges.
            if (adjacencyList[removedNodeValue] === undefined) {
                continue;
            }

            //Push the animation to show the edges coming from the removed node also being removed.
            this.animationArray.push({
                type: 'edges',
                nodeValue: removedNodeValue,
                state: 'FADED'
            });

            //Remove all edges which go from the removed node to another node.
            adjacencyList[removedNodeValue].forEach((value) => {
                //Decrement the indegree for this node, which had an incoming edge from the removed node.
                indegrees[value]--;

                //If the indegree count is now 0 for this node, add it to the set of nodes with 0 indegree.
                if (indegrees[value] === 0) {
                    indegreeZeroNodes.add(parseInt(value));
                }
            });
        }
        if (output.length !== nodeKeys.length) {
            //There is a cycle
            this.animationArray.push({
                type: 'nodes',
                nodeValue: 'can\'t complete - there is a cycle!'
            });
        }
    }

/***********************************************************
Method to pass to nodes to allow them to update their coordinates.
***********************************************************/

    updateCoords = (updateProps) => {
        let newNodes = createDeepCopy(this.state.nodes);
        newNodes[updateProps.name].x = updateProps.xCoord;
        newNodes[updateProps.name].y = updateProps.yCoord;

        this.setState({
            nodes: newNodes
        });
    }

/***********************************************************
Create the nodes.
***********************************************************/

    renderNodes = () => {
        let nodeElements = Object.entries(this.state.nodes).map(([key, value]) =>
            <GraphNode
                key={key}
                nodeId={key}
                xCoord={value.x}
                yCoord={value.y}
                updateCoords={this.updateCoords}
                className={this.setNodeClass(value)}
                isNodeBeingDeleted={this.state.isNodeBeingDeleted}
                deleteNode={this.deleteNode}
                isEdgeBeingCreated={this.state.isEdgeBeingCreated}
                addNodeToNewEdge={this.addNodeToNewEdge}
            />
        );

        return nodeElements;
    }

/***********************************************************
Create edges using the coordinates of the nodes being connected.
***********************************************************/

    renderEdges = () => {
        let edgeElements = Object.entries(this.state.edges).map(([key, value]) => {
            let edgeNodes = key.split(',');

            return (
                <GraphEdge
                    id={key}
                    key={key}
                    x1={this.state.nodes[edgeNodes[0]].x}
                    y1={this.state.nodes[edgeNodes[0]].y}
                    x2={this.state.nodes[edgeNodes[1]].x}
                    y2={this.state.nodes[edgeNodes[1]].y}
                    className={this.setEdgeClass(value)}
                    isEdgeBeingDeleted={this.state.isEdgeBeingDeleted}
                    deleteEdge={this.deleteEdge}
                />
            );
        });

        return edgeElements;
    }

/***********************************************************
Process to allow the user to create a new node.
***********************************************************/

    createNode = () => {
        const newNodes = createDeepCopy(this.state.nodes);

        //Find the lowest available node id.
        let newNodeId = 0;
        while (newNodeId < this.maxNodes) {
            if (!newNodes.hasOwnProperty(newNodeId)) {
                break;
            }
            newNodeId++;
        }

        //Create the new node.
        newNodes[newNodeId] = {
            x: 0,
            y: 0
        }

        this.setState({
            nodes: newNodes,
            isAnimationInSync: false
        });
    }

/***********************************************************
Click handler to allow a user to delete a node.
***********************************************************/

    clickRemoveNode = () => {
        //Deactivate the other graph object creation/deletion actions.
        if (!this.state.isNodeBeingDeleted) {
            this.setState({
                isEdgeBeingCreated: false,
                isEdgeBeingDeleted: false,
            });
        }

        this.setState((state) => {
            return { isNodeBeingDeleted: !state.isNodeBeingDeleted }
        });
    }

/***********************************************************
Delete a node by value.
***********************************************************/

    deleteNode = (nodeValue) => {
        const newNodes = createDeepCopy(this.state.nodes);
        const newEdges = createDeepCopy(this.state.edges);
        delete newNodes[nodeValue];

        //Delete all the edges connected to the node.
        let edgeKeys = Object.keys(newEdges);
        for (let i = 0; i < edgeKeys.length; i++) {
            const edgeNodes = edgeKeys[i].split(',');

            if (edgeNodes[0] === nodeValue || edgeNodes[1] === nodeValue) {
                delete newEdges[edgeKeys[i]];
            }
        }
        
        this.setState({
            nodes: newNodes,
            edges: newEdges,
            isNodeBeingDeleted: false,
            isAnimationInSync: false
        });
    }

/***********************************************************
Process to allow the user to create a new edge.
***********************************************************/

    clickCreateEdge = () => {
        //Deactivate the other graph object creation/deletion actions.
        if (!this.state.isEdgeBeingCreated) {
            this.setState({
                isNodeBeingDeleted: false,
                isEdgeBeingDeleted: false,
            });
        }

        //Empty the newEdgeNodes array.
        this.newEdgeNodes = [];

        //If the user has clicked the "Add a connector" button again before creating an edge, un-select all nodes.
        if (this.state.isEdgeBeingCreated) {
            const newNodes = createDeepCopy(this.state.nodes);

            let nodeKeys = Object.keys(newNodes);
            for (let i = 0; i < nodeKeys.length; i++) {
                if (newNodes[nodeKeys[i]].state === 'SELECTED') {
                    newNodes[nodeKeys[i]].state = '';
                }
            }

            this.setState({
                nodes: newNodes
            });
        }

        this.setState((state) => {
            return { isEdgeBeingCreated: !state.isEdgeBeingCreated }
        });
    }

/***********************************************************
Add a node to the new edge being created.
***********************************************************/

    addNodeToNewEdge = (nodeValue) => {
        //Add the node to the new edge.
        if (this.newEdgeNodes.length < 2) {
            this.newEdgeNodes.push(nodeValue);
        }

        //Highlight the selected node to let the user know it has been registered.
        const newNodes = createDeepCopy(this.state.nodes);
        newNodes[nodeValue].state = 'SELECTED';
        this.setState({
            nodes: newNodes
        });

        //If the new edge now has 2 nodes, then create the edge.
        if (this.newEdgeNodes.length === 2) {
            const newEdges = createDeepCopy(this.state.edges);

            //Create a new edge using the two selected nodes.
            const newEdgeKey = this.newEdgeNodes[0] + ',' + this.newEdgeNodes[1];
            if (!newEdges.hasOwnProperty(newEdgeKey)) {
                newEdges[newEdgeKey] = {};
            }

            //Un-select all nodes.
            let nodeKeys = Object.keys(newNodes);
            for (let i = 0; i < nodeKeys.length; i++) {
                if (newNodes[nodeKeys[i]].state === 'SELECTED') {
                    newNodes[nodeKeys[i]].state = '';
                }
            }
            
            this.setState({
                nodes: newNodes,
                edges: newEdges,
                isEdgeBeingCreated: false,
                isAnimationInSync: false
            });
        }
    }

/***********************************************************
Click handler to allow a user to delete an edge.
***********************************************************/

    clickRemoveEdge = () => {
        //Deactivate the other graph object creation/deletion actions.
        if (!this.state.isEdgeBeingDeleted) {
            this.setState({
                isNodeBeingDeleted: false,
                isEdgeBeingCreated: false,
            });
        }

        this.setState((state) => {
            return { isEdgeBeingDeleted: !state.isEdgeBeingDeleted }
        });
    }

/***********************************************************
Delete an edge by value.
***********************************************************/

    deleteEdge = (edgeKey) => {
        const newEdges = createDeepCopy(this.state.edges);
        
        delete newEdges[edgeKey];

        this.setState({
            edges: newEdges,
            isEdgeBeingDeleted: false,
            isAnimationInSync: false
        });
    }

/***********************************************************
Set node class.
***********************************************************/

    setNodeClass = (node) => {
        if (node.hasOwnProperty('state')) {
            if (node.state === 'FADED') {
                return 'graph-node-faded';
            }
            else if (node.state === 'SELECTED') {
                return 'graph-node-selected';
            }
        }

        return '';
    }

/***********************************************************
Set edge class.
***********************************************************/

    setEdgeClass = (edge) => {
        if (edge.hasOwnProperty('state') && edge.state === 'FADED') {
            return 'graph-node-faded';
        }
        return '';
    }

/***********************************************************
Start a new animation.
************************************************************/

    startNewAnimation = (callback) => {
        this.animationArray = [];

        const resetResult = this.resetAnimationStates();

        //Fill this.animation array.
        this.topologicalSort();
        
        //Set the animation array state to trigger a re-render.
        this.setState({
            animationArray: this.animationArray,
            animationIndex: 0,
            nodes: resetResult.nodes,
            edges: resetResult.edges,
            algorithmResult: resetResult.algorithmResult,
            isNodeBeingDeleted: false,
            isEdgeBeingCreated: false,
            isEdgeBeingDeleted: false,
            isAnimationInSync: true
        }, () => {
            //Do the callback if one is supplied.
            if(callback) {
                callback();
            }
        });
    }

/***********************************************************
Do the next animation in the array.
***********************************************************/

    doOneAnimation = () => {
        const animation = this.state.animationArray[this.state.animationIndex];
        
        if (animation.type === 'nodes') {
            const newNodes = createDeepCopy(this.state.nodes);
            let newResult = createDeepCopy(this.state.algorithmResult);

            //Change the node state to that given in the animation.
            if (newNodes.hasOwnProperty(animation.nodeValue)) {
                newNodes[animation.nodeValue].state = animation.state;
            }

            //Add this node value to the result.
            if (newResult !== 'Result: ') {
                newResult = newResult.concat(', ');
            }
            newResult = newResult.concat(animation.nodeValue);

            this.setState({
                nodes: newNodes,
                algorithmResult: newResult
            });
        }
        else if (animation.type === 'edges') {
            let newEdges = createDeepCopy(this.state.edges);

            //Iterate through the edges setting the given animation state for each edge which originates from the removed node.
            for (let i = 0; i < Object.keys(newEdges).length; i++) {
                const edgeKey = Object.keys(newEdges)[i];
                if (parseInt(edgeKey.split(',')[0]) === animation.nodeValue) {
                    newEdges[edgeKey].state = animation.state;
                }
            }

            this.setState({
                edges: newEdges
            });
        }
        else if (animation.type === 'result') {
            let newResult = createDeepCopy(this.state.algorithmResult);

            newResult.concat(', ');
            newResult.concat(animation.nodeValue);
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
        const newNodes = createDeepCopy(this.state.nodes);
        let newResult = createDeepCopy(this.state.algorithmResult);
        let newEdges = createDeepCopy(this.state.edges);

        //Loop through the remaining animations
        while (newAnimationIndex < this.state.animationArray.length) {
            const animation = this.state.animationArray[newAnimationIndex];
            if (animation.type === 'nodes') {
                //Change the node state to that given in the animation.
                if (newNodes.hasOwnProperty(animation.nodeValue)) {
                    newNodes[animation.nodeValue].state = animation.state;
                }

                //Add this node value to the result.
                if (newResult !== 'Result: ') {
                    newResult = newResult.concat(', ');
                }
                newResult = newResult.concat(animation.nodeValue);

                this.setState({
                    nodes: newNodes,
                    algorithmResult: newResult
                });
            }
            else if (animation.type === 'edges') {
                //Iterate through the edges setting the given animation state for each edge which originates from the removed node.
                for (let i = 0; i < Object.keys(newEdges).length; i++) {
                    const edgeKey = Object.keys(newEdges)[i];
                    if (parseInt(edgeKey.split(',')[0]) === animation.nodeValue) {
                        newEdges[edgeKey].state = animation.state;
                    }
                }
            }
            newAnimationIndex++;
        }

        this.setState({
            animationIndex: newAnimationIndex,
            nodes: newNodes,
            edges: newEdges
        });
    }

/***********************************************************
Replay the animation from the start.
***********************************************************/

    replayAnimation = (callback) => {
        const resetResult = this.resetAnimationStates();

        this.setState({
            animationIndex: 0,
            nodes: resetResult.nodes,
            edges: resetResult.edges,
            algorithmResult: resetResult.algorithmResult
        }, () => {
            //Do the callback if one is provided.
            if (callback) {
                callback();
            }
        });
    }

/***********************************************************
Reset the animation states ready for a new animation to start.
***********************************************************/

    resetAnimationStates = () => {
        let newNodes = createDeepCopy(this.state.nodes);
        let newEdges = createDeepCopy(this.state.edges);

        //Reset node states.
        let nodeKeys = Object.keys(newNodes);
        for (let i = 0; i < nodeKeys.length; i++) {
            newNodes[nodeKeys[i]].state = '';
        }

        //Reset edge states.
        let edgeKeys = Object.keys(newEdges);
        for (let i = 0; i < edgeKeys.length; i++) {
            newEdges[edgeKeys[i]].state = '';
        }

        return {
            nodes: newNodes,
            edges: newEdges,
            algorithmResult: 'Result: '
        }
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
React Render Method
***********************************************************/

    render() {
        return (
            <Row>
                <DocumentTitle documentTitle='Topological Sort' />
                <Col lg='6'>
                    <h3>Topological Sort</h3>
                    <h5>Instructions:</h5>
                    <ol>
                        <li className="instructions-list-item">Create some nodes.</li>
                        <li className="instructions-list-item">Join the nodes together however you like.</li>
                        <li className="instructions-list-item">Click "Start New Animation".</li>
                    </ol>
                    <h5>Explanation:</h5>
                    <ul>
                        <li className="instructions-list-item">A topological sort puts the nodes in order of the arrows.</li>
                        <li className="instructions-list-item">A node can't be added to the output until there are no incoming arrows.</li>
                        <li className="instructions-list-item">If there is a cycle (e.g. 0->1->0) the sort cannot complete.</li>
                    </ul>
                    <AnimationControl
                        animationArray={this.state.animationArray}
                        animationIndex={this.state.animationIndex}
                        startNewAnimation={this.startNewAnimation}
                        doOneAnimation={this.doOneAnimation}
                        doRemainingAnimations={this.doRemainingAnimations}
                        replayAnimation={this.replayAnimation}
                        buttonsDisabled={!this.state.isAnimationInSync}
                    />
                    <br />
                    <GraphEditer
                        clickRemoveNode={this.clickRemoveNode}
                        isNodeBeingDeleted={this.state.isNodeBeingDeleted}
                        isEdgeBeingCreated={this.state.isEdgeBeingCreated}
                        clickRemoveEdge={this.clickRemoveEdge}
                        isEdgeBeingDeleted={this.state.isEdgeBeingDeleted}
                        createNode={this.createNode}
                        clickCreateEdge={this.clickCreateEdge}
                        isAnimationRunning={this.isAnimationRunning()}
                    />
                    <br />
                </Col>
                <Col lg='6'>
                    <Row>
                        <Col>
                            {this.state.algorithmResult}
                        </Col>
                    </Row>
                    <GraphArea>
                        {this.renderNodes()}
                        {this.renderEdges()}
                    </GraphArea>
                </Col>
            </Row>
        );
    }
}
