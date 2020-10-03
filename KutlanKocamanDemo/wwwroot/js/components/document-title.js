import { Component } from 'react';

export class DocumentTitle extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        document.title = "Kutlan Coder - " + this.props.documentTitle;
    }

    render() {
        return null;
    }
}
