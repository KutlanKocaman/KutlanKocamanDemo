import React from "react";

import '../../css/graph-area.css';

export class GraphArea extends React.Component {
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