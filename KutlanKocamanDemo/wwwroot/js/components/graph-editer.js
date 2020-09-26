import React from 'react';
import { Container, Row, Col, Button, Popover, PopoverBody } from "reactstrap";
import { GraphEdge } from './graph-edge';

import '../../css/graph-editer.css'

export class GraphEditer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            createEdge: false
        };
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
                        <div className='graph-node'>+</div>
                    </Col>
                    <Col className='graph-editer-text'>
                        <Button
                            color='primary'
                            onClick={() => this.props.createNode()}
                        >Add a node</Button>
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
                            color='primary'
                            className={this.getAddConnectorClass()}
                            onClick={() => this.props.createEdge()}
                        >Add a connector</Button>
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