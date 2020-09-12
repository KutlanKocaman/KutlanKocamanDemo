import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

export const ModalInformational = (props) => {
    const {
        buttonText,
        modalTitle,
        modalContents
    } = props;

    const [modal, setModal] = useState(false);

    const toggle = () => setModal(!modal);

    return (
        <div>
            <Button color="primary" onClick={toggle}>{buttonText}</Button>
            <Modal isOpen={modal} toggle={toggle}>
                <ModalHeader toggle={toggle}>{modalTitle}</ModalHeader>
                <ModalBody>{modalContents}</ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={toggle}>Close</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}