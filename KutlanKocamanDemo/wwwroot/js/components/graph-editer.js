﻿import React from 'react';
import { Container, Row, Col, Button, Popover, PopoverBody } from "reactstrap";
import { GraphEdge } from './graph-edge';

import '../../css/graph-editer.css'

export class GraphEditer extends React.Component {
    constructor(props) {
        super(props);

        this.createdNodeTimeoutToken;

        this.state = {
            createdNode: false,
            createEdge: false
        };
    }

    createNodeClickHandler = () => {
        //Clear any existing timeout for the created node popover, then create a new timeout.
        clearTimeout(this.createdNodeTimeoutToken);
        this.createdNodeTimeoutToken = setTimeout(() => {
            this.setState({
                createdNode: false
            });
        }, 3000);

        //Set createdNode so that the popover appears.
        this.setState({
            createdNode: true
        });

        //Call the function passed in to create a node.
        this.props.createNode();
    }

    getAddConnectorClass = () => {
        if (this.props.isEdgeBeingCreated) {
            return 'graph-editer-creating';
        }
        return '';
    }

    render() {
        return (
            <Container>
                <Row>
                    <Col xs='2' lg='1'>
                        <div className='graph-node'> </div>
                    </Col>
                    <Col className='graph-editer-text'>
                        <Button
                            id='addNodeButton'
                            color='success'
                            onClick={() => this.createNodeClickHandler()}
                        >+ Add</Button>
                        <Popover
                            placement='top'
                            isOpen={this.state.createdNode}
                            target='addNodeButton'
                        >
                            <PopoverBody>
                                Added a node to the top left of the chart.
                            </PopoverBody>
                        </Popover>
                        &nbsp;
                        <Button
                            id='removeNodeButton'
                            color='danger'
                            onClick={() => this.props.clickRemoveNode()}
                        >- Remove</Button>
                        <Popover
                            placement='top'
                            isOpen={this.props.isNodeBeingDeleted}
                            target='removeNodeButton'
                        >
                            <PopoverBody>
                                Click on a node to remove it.
                            </PopoverBody>
                        </Popover>
                    </Col>
                </Row>
                <Row>
                    <Col xs='2' lg='1'>
                        <GraphEdge
                            x1={-25}
                            y1={0}
                            x2={55}
                            y2={0}
                        />
                    </Col>
                    <Col className='graph-editer-text'>
                        <Button
                            id='addConnectorButton'
                            color='success'
                            className={this.getAddConnectorClass()}
                            onClick={() => this.props.createEdge()}
                        >+ Add</Button>
                        <Popover
                            placement='top'
                            isOpen={this.props.isEdgeBeingCreated}
                            target='addConnectorButton'
                        >
                            <PopoverBody>
                                Click on two nodes to create a connection between them.
                            </PopoverBody>
                        </Popover>
                    </Col>
                </Row >
            </Container>
        );
    }

}