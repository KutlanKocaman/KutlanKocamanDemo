import React, { useState, useRef } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Input } from 'reactstrap';

import '../../css/modal-save.css'

export const ModalSave = (props) => {
    const {
        disabled,
        disabledTitle,
        saveName,
        updateSaveName,
        saveFunction
    } = props;

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const toggle = () => setModalIsOpen(!modalIsOpen);

    const inputRef = useRef(null);

    const onOpen = () => {
        inputRef.current.focus();
        inputRef.current.select();
    }

    const save = () => {
        if (saveName.trim().length < 1) {
            alert('The save name must be at least 1 character');
            return;
        }
        saveFunction(saveName);
        setModalIsOpen(false);
    }

    const onInputKeyPress = (event) => {
        if (event.key === 'Enter') {
            save();
        }
    }

    return (
        <div className='modal-save'>
            <Button
                color='primary'
                title={disabled === true ? disabledTitle : null}
                disabled={disabled}
                onClick={() => { setModalIsOpen(true); }}
            >Save</Button>
            <Modal isOpen={modalIsOpen} toggle={toggle} onOpened={onOpen}>
                <ModalHeader toggle={toggle}>Save</ModalHeader>
                <ModalBody>
                    Name:
                    <Input
                        innerRef={inputRef}
                        name='saveName'
                        value={saveName}
                        maxLength={30}
                        onChange={event => updateSaveName(event.target.value)}
                        onKeyPress={event => onInputKeyPress(event)}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button
                        color='primary'
                        onClick={save}
                    >Save</Button>
                    <Button color='primary' onClick={toggle}>Close</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}