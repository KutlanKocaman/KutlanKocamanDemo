import React, { Component } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Link } from 'react-router-dom';

export class NavMenu extends Component {
    static displayName = NavMenu.name;

    constructor(props) {
        super(props);

        this.state = {
            open: false
        };
    }

    toggleNavMenu = () => {
        this.setState((state) => ({
            open: !state.open
        }));
    }

    render() {
        return (
            <Dropdown isOpen={this.state.open} toggle={this.toggleNavMenu}>
                <DropdownToggle caret tag="button" type="button" className="btn btn-primary">
                    Single Page App Menu
                </DropdownToggle>
                <DropdownMenu>
                    <DropdownItem tag={Link} to="/KnuthMorrisPratt">
                        Knuth-Morris-Pratt String Search Animation
                    </DropdownItem>
                    <DropdownItem tag={Link} to="/TopologicalSort">
                        Topological Sort Animation
                    </DropdownItem>
                    <DropdownItem tag={Link} to="/WordSearch">
                        Word Search Animation
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        );
    }
}
