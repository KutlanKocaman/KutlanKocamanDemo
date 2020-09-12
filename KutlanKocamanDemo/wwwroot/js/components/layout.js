import React, { Component } from 'react';
import { NavMenu } from './nav-menu';

export class Layout extends Component {
    static displayName = Layout.name;

    render() {
        return (
            <div>
                <NavMenu />
                <hr />
                {this.props.children}
            </div>
        );
    }
}
