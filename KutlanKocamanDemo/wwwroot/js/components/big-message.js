import React from 'react';
import { Alert } from 'reactstrap';

import '../../css/big-message.css';

export const BigMessage = (props) => {
    const {
        messageText = '',
        color = 'primary',
        show = false
    } = props;

    return (
        <Alert className='big-message'
            isOpen={show}
            color={color}
        >{messageText}</Alert>
    );
}