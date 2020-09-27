import React from "react";

import '../../css/graph-edge.css';

export class GraphEdge extends React.Component {
    constructor(props) {
        super(props);
    }

    clickHandler = (event) => {
        //If an edge is being deleted, pass the id of the clicked object to the deleteEdge function.
        if (this.props.isEdgeBeingDeleted) {
            //Get the edge id from the end of the clicked element's id.
            const clickedElementId = event.target.id;
            const edgeId = clickedElementId.split('_')[1];

            //Call the deleteEdge function which was passed in.
            this.props.deleteEdge(edgeId);
        }
    }

    setStyle = () => {
        //Get the coordinates from props.
        //Add some extra on so that we draw the line to the circumference of the node, not the centre.
        let x1 = this.props.x1 + 20;
        let x2 = this.props.x2 + 20;
        let y1 = this.props.y1 + 20;
        let y2 = this.props.y2 + 20;

        //Calculate the length of the edge line.
        let length = Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2))) - 2;

        //Calculate the mid points of the x and y coordinates.
        let xMid = (x1 + x2) / 2;
        let yMid = (y1 + y2) / 2;

        //Calculate the slope.
        let slopeRadians = Math.atan2(y1 - y2, x1 - x2);
        let slopeDegrees = (slopeRadians * 180) / Math.PI;

        //Translate the arrows to get them to tocuh the edge of the nodes properly.
        const adjust = 1.8 + Math.sin((slopeDegrees + 180) * Math.PI / 180) * 2;

        //Use the calculated values to style the line.
        let positionStyles = {
            width: length - 40,
            left: xMid - (length / 2) + 20,
            top: yMid,
            transform: 'rotate(' + slopeDegrees + 'deg) translate(' + adjust + 'px, 0px)'
        }

        return positionStyles;
    }

    setClass = () => {
        let className = 'graph-edge';
        if (this.props.className) {
            className += ' ' + this.props.className;
        }
        return className;
    }

    render() {
        return (
            <div
                id={'graph-edge-line_' + this.props.id}
                className={this.setClass()}
                style={this.setStyle()}
                onClick={() => this.clickHandler(event)}
            >
                <div
                    id={'graph-edge-pointer_' + this.props.id}
                    className="graph-edge-pointer"
                />
            </div>
        );
    }
}