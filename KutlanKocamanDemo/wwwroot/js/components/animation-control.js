import React from 'react';
import { Col, Button, Input, Label } from 'reactstrap';

import '../../css/animation-control.css'

export class AnimationControl extends React.Component {
    constructor(props) {
        super(props);

        //From props (optional).
        this.minTimeBetweenAnimationsMs = this.props.minTimeBetweenAnimationsMs || 1;
        this.maxTimeBetweenAnimationsMs = this.props.maxTimeBetweenAnimationsMs || 2000;

        this._animationCancellationToken = null;

        this.state = {
            animationIndex: 0,
            animationState: this.props.animationState || 'PLAY',
            animationSpeed: 50
        }
    }

    componentWillUnmount() {
        //Cancel any running animation when the animation control is unmounted.
        clearTimeout(this._animationCancellationToken);
    }

    doAnimation = () => {
        let newAnimationState = this.state.animationState;
        let newAnimationIndex = this.state.animationIndex;
        let timeBetweenAnimationsMs = this.minTimeBetweenAnimationsMs
            + (this.maxTimeBetweenAnimationsMs - this.minTimeBetweenAnimationsMs) * (100 - this.state.animationSpeed) * 0.01;

        if (this.state.animationState === 'REPLAY') {
            newAnimationState = 'PLAY';
            newAnimationIndex = 0;
        }
        else if (this.state.animationState === 'PLAY') {
            if (newAnimationIndex < this.props.animationArray.length) {
                //Call the function passed in to do one animation.
                this.props.doOneAnimation();
                newAnimationIndex++;
            }
        }
        else if (this.state.animationState === 'SKIP') {
            //Call the function passed in to do all remaining animations.
            this.props.doRemainingAnimations();
            newAnimationIndex = this.props.animationArray.length;
        }

        //If we have reached the end of the animation queue then stop the polling.
        if (newAnimationIndex >= this.props.animationArray.length) {
            newAnimationState = 'STOP'
        }

        //Set the state now that the latest animation has been applied.
        this.setState({
            animationState: newAnimationState,
            animationIndex: newAnimationIndex
        }, () => {
            //Set the timeout for the next queue poll if the animationState isn't stopped.
            if (this.state.animationState !== 'STOP') {
                this._animationCancellationToken = setTimeout(this.doAnimation, timeBetweenAnimationsMs);
            }
        });
    }

    startNewAnimation = () => {
        //Stop the current animation queue polling process if there is one running.
        if (this._animationCancellationToken !== null) {
            clearTimeout(this._animationCancellationToken);
        }

        //Then do the function passed in to start a new animation.
        this.props.startNewAnimation(() => {
            //Then set the animation index to 0 and PLAY.
            this.setState({
                animationIndex: 0,
                animationState: 'PLAY'
            }, () => {
                //Finally start the animation process.
                this.doAnimation();
            });
        });
    }

    playPauseAnimation = () => {
        this.setState((state) => {
            return { animationState: state.animationState === 'PLAY' ? 'STOP' : 'PLAY' }
        }, () => {
            if (this.state.animationState === 'PLAY') {
                this.doAnimation();
            }
        });
    }

    skipAnimation = () => {
        //Stop the current animation queue polling process if there is one running.
        if (this._animationCancellationToken !== null) {
            clearTimeout(this._animationCancellationToken);
        }
        //Set the new animation state.
        this.setState({
            animationState: 'SKIP'
        }, () => {
            this.doAnimation();
        });
    }

    replayAnimation = () => {
        //Stop the current animation queue polling process if there is one running.
        if (this._animationCancellationToken !== null) {
            clearTimeout(this._animationCancellationToken);
        }

        //Do the replayAnimation call back, then replay.
        this.props.replayAnimation(() => {
            this.setState({
                animationState: 'REPLAY'
            }, () => {
                this.doAnimation();
            });
        });
    }

    isAnimationRunning = () => {
        if (this.props.animationArray.length > 0
            && this.state.animationIndex < this.props.animationArray.length) {
            return true;
        }
        else {
            return false;
        }
    }

    changeAnimationSpeed = (event) => {
        let speed = event.target.value;

        this.setState({
            animationSpeed: speed
        });
    }

    render() {
        return (
            <Col className='animation-control'>
                <Button
                    color='success'
                    className='animation-control-start'
                    onClick={this.startNewAnimation}
                >Start New Animation</Button>
                <Button
                    title='Play/Pause'
                    color='primary'
                    className='animation-control-button'
                    disabled={this.props.buttonsDisabled}
                    onClick={this.playPauseAnimation}
                >{this.state.animationState === 'PLAY' ? '⏸️' : '▶️'}</Button>
                <Button
                    title='Skip to the end'
                    color='primary'
                    className='animation-control-button'
                    disabled={this.props.buttonsDisabled}
                    onClick={this.skipAnimation}
                >⏭️</Button>
                <Button
                    title='Replay'
                    color='primary'
                    className='animation-control-button'
                    disabled={this.props.buttonsDisabled}
                    onClick={this.replayAnimation}
                >🔄️</Button>
                <br />
                <Label
                    for='animationSpeedRange'
                    className='animation-control-speed-label'
                >Animation Speed:</Label>
                <Input
                    id='animationSpeedRange'
                    type='range'
                    min='1'
                    max='100'
                    className='animation-control-speed-range custom-range'
                    disabled={this.props.buttonsDisabled}
                    value={this.state.animationSpeed}
                    onChange={(event) => this.changeAnimationSpeed(event)}
                />
            </Col>
        );
    }
}