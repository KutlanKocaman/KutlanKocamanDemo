import React from "react";

import '../../css/graph-node.css'

export class GraphNode extends React.Component {
    constructor(props) {
        super(props);

        this.xDiff = 0;
        this.yDiff = 0;
        this.nodeRadius = 40;

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
        const rightPad = this.nodeRadius;
        const bottomPad = this.nodeRadius;
        if (newXCoord < 0) {
            newXCoord = 0;
        }
        else if (newXCoord > this.props.getAreaWidth() - rightPad) {
            newXCoord = this.props.getAreaWidth() - rightPad;
        }
        if (newYCoord < 0) {
            newYCoord = 0;
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
            elementStyle.zIndex = '100'; //Make the node appear in front of everything else.
            elementStyle.backgroundColor = 'yellow';
            elementStyle.color = 'black';
        }

        return elementStyle;
    }

    setClass = () => {
        let className = 'graph-node';
        if (this.props.className) {
            className += ' ' + this.props.className;
        }
        return className;
    }

    render() {
        return (
            <div
                className={this.setClass()}
                style={this.setStyle()}
                onMouseDown={(event) => this.dragStart(event)}
                onTouchStart={(event) => this.dragStart(event)}
            >
                {this.props.nodeId}
            </div>
        );
    }
}