import React from "react";
import { Row, Col, Button } from "reactstrap";
import { DocumentTitle } from '../document-title';
import { createDeepCopy } from "../../shared/functions";

export class TopologicalSort extends React.Component {
    constructor(props) {
        super(props);

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
                '6,7': {}
            }
        }
    }

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
            let removedNode = zeroIndegreeIterator.next().value;
            indegreeZeroNodes.delete(removedNode);

            //Add the node to the output.
            output.push(removedNode);

            //If there are no edges originating from this node, continue on to the next node with no incoming edges.
            if (adjacencyList[removedNode] === undefined) {
                continue;
            }

            //Remove all edges which go from the removed node to another node.
            adjacencyList[removedNode].forEach((value) => {
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

    updateCoords = (updateProps) => {
        let newNodes = createDeepCopy(this.state.nodes);
        newNodes[updateProps.name].x = updateProps.xCoord;
        newNodes[updateProps.name].y = updateProps.yCoord;

        this.setState({
            nodes: newNodes
        });
    }

    createNodes = () => {
        let nodeElements = Object.entries(this.state.nodes).map(([key, value]) =>
            <GraphNode
                key={key}
                nodeId={key}
                xCoord={value.x}
                yCoord={value.y}
                updateCoords={this.updateCoords}
            />
        );

        return nodeElements;
    }

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
                />
            );
        });

        return edgeElements;
    }

    render() {
        return (
            <Row>
                <DocumentTitle documentTitle='Topological Sort' />
                <Col>
                    <Button
                        color='primary'
                        onClick={() => this.topologicalSort()}
                    >
                        Sort!
                    </Button>
                    <GraphArea>
                        {this.createNodes()}
                        {this.createEdges()}
                    </GraphArea>
                </Col>
            </Row>
        );
    }
}

class GraphArea extends React.Component {
    constructor(props) {
        super(props);

        //Create a React ref to self.
        this.gridRef = React.createRef();
    }

    getGraphAreaWidth = () => {
        return this.gridRef.current.offsetWidth;
    }

    getGraphHeightWidth = () => {
        return this.gridRef.current.offsetHeight;
    }

    addPropsToChildren = () => {
        //Pass methods to children to allow them to get the graph area dimensions, so that they don't go outside it.
        let childrenWithExtraProps = React.Children.map(this.props.children, child => {
            const props = {
                getAreaWidth: this.getGraphAreaWidth,
                getAreaHeight: this.getGraphHeightWidth
            }
            if (React.isValidElement(child)) {
                return React.cloneElement(child, props);
            }
            return child;
        });

        return childrenWithExtraProps
    }

    render() {
        return (
            <div
                className="graph-area"
                ref={this.gridRef}
            >
                {this.addPropsToChildren()}
            </div>
        );
    }
}

class GraphNode extends React.Component {
    constructor(props) {
        super(props);

        this.xDiff = 0;
        this.yDiff = 0;

        this.state = {
            dragging: false
        }
    }

    dragStart = (event) => {
        //Clicking the node should drag, not highlight the text in it, or do anything else.
        event.preventDefault();

        //Figure out whether this is a click (desktop) or touch (mobile) and get clicked x and y coordinates.
        let isClickEvent = event.type === 'mousedown';
        let clientX = isClickEvent ? event.clientX : event.touches[0].clientX;
        let clientY = isClickEvent ? event.clientY : event.touches[0].clientY;

        //Save the original position so that we can calculate the new position based on it.
        this.xDiff = this.props.xCoord - clientX;
        this.yDiff = this.props.yCoord - clientY;

        //Set the event listeners to drag and end dragging.
        if (isClickEvent) {
            document.onmouseup = this.dragEnd;
            document.onmousemove = this.dragMove;
        }
        else {
            document.ontouchend = this.dragEnd;
            document.ontouchmove = this.dragMove;
        }

        this.setState({
            dragging: true
        });
    }

    dragMove = (event) => {
        //Figure out whether this is a click (desktop) or touch (mobile) and get clientX and clientY.
        let isClickEvent = event.type === 'mousemove';
        let clientX = isClickEvent ? event.clientX : event.touches[0].clientX;
        let clientY = isClickEvent ? event.clientY : event.touches[0].clientY;

        //Calculate the new x and y coordinates.
        let newXCoord = clientX + this.xDiff;
        let newYCoord = clientY + this.yDiff;

        //Prevent the node from moving outside of the graph area.
        const leftPad = 15;
        const rightPad = 20;
        const topPad = 20;
        const bottomPad = 15;
        if (newXCoord < leftPad) {
            newXCoord = leftPad;
        }
        else if (newXCoord > this.props.getAreaWidth() - rightPad) {
            newXCoord = this.props.getAreaWidth() - rightPad;
        }
        if (newYCoord < topPad) {
            newYCoord = topPad;
        }
        else if (newYCoord > this.props.getAreaHeight() - bottomPad) {
            newYCoord = this.props.getAreaHeight() - bottomPad;
        }

        //Let the topological sort component know to update this node's coordinates.
        this.props.updateCoords({
            name: this.props.nodeId,
            xCoord: newXCoord,
            yCoord: newYCoord
        });
    }

    dragEnd = () => {
        //Release the event listeners.
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;

        this.setState({
            dragging: false
        });
    }

    setStyle = () => {
        let elementStyle = {
            left: this.props.xCoord,
            top: this.props.yCoord
        }
        if (this.state.dragging) {
            elementStyle.cursor = 'grabbing'
            elementStyle.zIndex = '100';
            elementStyle.backgroundColor = 'yellow';
        }

        return elementStyle;
    }

    render() {
        return (
            <div
                className="graph-node"
                style={this.setStyle()}
                onMouseDown={(event) => this.dragStart(event)}
                onTouchStart={(event) => this.dragStart(event)}
            >
                {this.props.nodeId}
            </div>
        );
    }
}

class GraphEdge extends React.Component {
    constructor(props) {
        super(props);
    }

    setStyle = () => {
        //Get the coordinates from props.
        //Add some extra on so that we draw the line to the circumference of the node, not the centre.
        let x1 = this.props.x1 + 20;
        let x2 = this.props.x2 + 20;
        let y1 = this.props.y1 + 20;
        let y2 = this.props.y2 + 20;

        //Calculate the length of the edge line.
        let length = Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));

        //Calculate the mid points of the x and y coordinates.
        let xMid = (x1 + x2) / 2;
        let yMid = (y1 + y2) / 2;

        //Calculate the slope.
        let slopeRadians = Math.atan2(y1 - y2, x1 - x2);
        let slopeDegrees = (slopeRadians * 180) / Math.PI;

        //Use the calculated values to style the line.
        let positionStyles = {
            width: length - 40,
            left: xMid - (length / 2) + 20,
            top: yMid,
            transform: 'rotate(' + slopeDegrees + 'deg)'
        }

        return positionStyles;
    }

    render() {
        return (
            <div
                className="graph-edge"
                style={this.setStyle()}
            >
                <div className="graph-edge-pointer" />
            </div>
        );
    }
}