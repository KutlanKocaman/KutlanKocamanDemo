import React from 'react';
import { Button, PopoverBody, Popover, UncontrolledTooltip } from 'reactstrap';
import { copyTextToClipboard } from "../shared/functions";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';

import '../../css/share-button.css';

export class ShareButton extends React.Component {
    constructor(props) {
        super(props);

        this.popoverOpenCancellationToken = null;

        this.state = {
            open: false
        }
    }

    componentWillUnmount() {
        //Cancel the created node popover close timeout.
        clearTimeout(this.popoverOpenCancellationToken);
    }

    onClickHandler = () => {
        copyTextToClipboard(window.location.href);

        this.popoverOpenCancellationToken = setTimeout(() => {
            this.setState({ open: false });
        }, 3000);

        this.setState({
            open: !this.state.open
        });
    }

    render() {
        return (
            <div>
                <UncontrolledTooltip
                    placement='top'
                    target='shareButton'
                >
                    Share this page with others!
                </UncontrolledTooltip>
                <Button
                    id='shareButton'
                    color='primary'
                    onClick={this.onClickHandler}
                >
                    Share &nbsp;
                    <FontAwesomeIcon icon={faShare} />
                </Button>
                <Popover
                    placement='bottom'
                    target='shareButton'
                    isOpen={this.state.open}>
                    <PopoverBody>A link has been copied<br />to your clipboard.</PopoverBody>
                </Popover>
            </div>
        );
    }
}
