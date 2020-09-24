import React from "react";
import { Row, Col, Button } from "reactstrap";
import { DocumentTitle } from '../document-title';
import { GraphArea } from '../graph-area';
import { GraphNode } from '../graph-node';
import { GraphEdge } from '../graph-edge';
import { createDeepCopy } from "../../shared/functions";
import { AnimationControl } from '../animation-control';

export class TopologicalSort extends React.Component {
    constructor(props) {
        super(props);

        this.animationArray = [];

        //Set up the example graph.
        this.state = {
            nodes: {
                0: {
                    x: 50,
                    y: 50
                },
                1: {
                    x: 150,
                    y: 50
                },
                2: {
                    x: 250,
                    y: 50
                },
                3: {
                    x: 50,
                    y: 150
                },
                4: {
                    x: 150,
                    y: 150
                },
                5: {
                    x: 250,
                    y: 150
                },
                6: {
                    x: 50,
                    y: 250
                },
                7: {
                    x: 150,
                    y: 250
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
                '6,7': {},
                '7,4': {}
            },
            animationArray: [],
            animationIndex: 0
        }
    }

/***********************************************************
Does the topological sort and fills the animationArray field.
***********************************************************/

    topologicalSort = () => {
        let nodes = createDeepCopy(this.state.nodes);
        let edges = createDeepCopy(this.state.edges);
        let adjacencyList = {};
        let indegrees = Array(Object.keys(nodes).length).fill(0);

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
        for (let i = 0; i < indegrees.length; i++) {
            if (indegrees[i] === 0) {
                indegreeZeroNodes.add(i);
            }
        }

        //Build an output list by taking nodes with no more dependencies from the set.
        let output = [];
        let zeroIndegreeIterator = indegreeZeroNodes.values();
        while (indegreeZeroNodes.size > 0) { //Consider Object.keys(indegreeZeroNodes).length if this is buggy
            //Get the next node with no incoming edges from the set.
            let removedNodeValue = zeroIndegreeIterator.next().value;
            indegreeZeroNodes.delete(removedNodeValue);

            //Add the node to the output.
            output.push(removedNodeValue);

            //Push the animation to show the node being removed.
            this.animationArray.push(() => {
                let newNodes = createDeepCopy(this.state.nodes);
                newNodes[removedNodeValue].faded = true;
                this.setState({
                    nodes: newNodes
                });
            });

            //If there are no edges originating from this node, continue on to the next node with no incoming edges.
            if (adjacencyList[removedNodeValue] === undefined) {
                continue;
            }

            //Push the animation to show the edges coming from the removed node also being removed.
            this.animationArray.push(() => {
                let newEdges = createDeepCopy(this.state.edges);

                //Iterate through the edges hiding each edge which originates from the removed node.
                for (let i = 0; i < Object.keys(newEdges).length; i++) {
                    const edgeKey = Object.keys(newEdges)[i];
                    if (parseInt(edgeKey.split(',')[0]) === removedNodeValue) {
                        newEdges[edgeKey].faded = true;
                    }
                }

                this.setState({
                    edges: newEdges
                });
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
        console.log(output);
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
Does the topological sort and fills the animationArray field
***********************************************************/

    createNodes = () => {
        let nodeElements = Object.entries(this.state.nodes).map(([key, value]) =>
            <GraphNode
                key={key}
                nodeId={key}
                xCoord={value.x}
                yCoord={value.y}
                updateCoords={this.updateCoords}
                className={this.setNodeClass(value)}
            />
        );

        return nodeElements;
    }

/***********************************************************
Creates edges using the coordinates of the nodes being connected.
***********************************************************/

    createEdges = () => {
        let edgeElements = Object.entries(this.state.edges).map(([key, value]) => {
            let edgeNodes = key.split(',');

            return (
                <GraphEdge
                    key={key}
                    x1={this.state.nodes[edgeNodes[0]].x}
                    y1={this.state.nodes[edgeNodes[0]].y}
                    x2={this.state.nodes[edgeNodes[1]].x}
                    y2={this.state.nodes[edgeNodes[1]].y}
                    className={this.setEdgeClass(value)}
                />
            );
        });

        return edgeElements;
    }

/***********************************************************
Set node class.
***********************************************************/

    setNodeClass = (node) => {
        if (node.hasOwnProperty('faded') && node.faded === true) {
            return 'graph-node-faded';
        }
        return '';
    }

/***********************************************************
Set edge class.
***********************************************************/

    setEdgeClass = (edge) => {
        if (edge.hasOwnProperty('faded') && edge.faded === true) {
            return 'graph-node-faded';
        }
        return '';
    }

/***********************************************************
Start a new animation
***********************************************************/

    startNewAnimation = (callback) => {
        //Clear the animation array.
        this.animationArray = [];

        //Fill the animation array.
        this.topologicalSort();

        //Set the animation array state to trigger a re-render.
        this.setState({
            animationArray: this.animationArray
        }, () => {
            //Do the callback if one is supplied.
            if(callback) {
                callback();
            }
        });
    }

/***********************************************************
Reset the animation by setting all nodes and edges to not faded.
***********************************************************/

    resetAnimation = (callback) => {
        let newNodes = createDeepCopy(this.state.nodes);
        let newEdges = createDeepCopy(this.state.edges);

        //Set all nodes to not be faded.
        let nodeKeys = Object.keys(newNodes);
        for (let i = 0; i < nodeKeys.length; i++) {
            newNodes[nodeKeys[i]].faded = false;
        }

        //Set all nodes to not be faded.
        let edgeKeys = Object.keys(newEdges);
        for (let i = 0; i < edgeKeys.length; i++) {
            newEdges[edgeKeys[i]].faded = false;
        }

        this.setState({
            nodes: newNodes,
            edges: newEdges
        }, () => {
            //Do the callback if one is provided.
            if (callback) {
                callback();
            }
        });
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
                </Col>
                <Col lg='6'>
                    <AnimationControl
                        animationArray={this.state.animationArray}
                        animationIndex={this.state.animationIndex}
                        startNewAnimation={this.startNewAnimation}
                        resetAnimation={this.resetAnimation}
                    />
                    <br />
                    <GraphArea>
                        {this.createNodes()}
                        {this.createEdges()}
                    </GraphArea>
                </Col>
            </Row>
        );
    }
}
