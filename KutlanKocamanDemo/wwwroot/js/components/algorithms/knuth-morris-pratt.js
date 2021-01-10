import React from "react";
import { Row, Col, Input, FormGroup, Label, Button, UncontrolledDropdown, DropdownMenu, DropdownItem, DropdownToggle } from "reactstrap";
import { DocumentTitle } from '../document-title';
import { AnimationControl } from '../animation-control';
import { LinkedList } from "../../shared/linked-list";
import { createDeepCopy, getUriWithoutQueryString, getQueryStringParameter, copyTextToClipboard, getRequestVerificationTokenValue } from "../../shared/functions";
import { ModalInformational } from "../modal-informational";
import { ModalSave } from '../modal-save'
import { ShareButton } from "../share-button";
import { BigMessage } from "../big-message";
import { UserContext } from '../../components/user-context';

import '../../../css/knuth-morris-pratt.css';

export class KnuthMorrisPratt extends React.Component {
    constructor(props) {
        super(props);

        this.animationList = new LinkedList();

        this.maxNeedleLength = 18;
        this.maxHaystackLength = 200;

        //Check for parameters in the query string on first load.
        let needle = (getQueryStringParameter('n') ?? 'coconut').substring(0, this.maxNeedleLength);
        let haystack = (getQueryStringParameter('h') ?? 'I like cocoa and coconut flavours').substring(0, this.maxHaystackLength);
        let caseSensitive = getQueryStringParameter('c') === '1' ? true : false;
        
        this.state = {
            needle: needle,
            haystack: haystack,
            caseSensitive: caseSensitive,
            kmpInputSets: [],
            kmpInputSetSelected: null,
            saveName: '',
            kmpTable: null,
            foundIndexes: [],
            needleRangeToHighlight: {start: 0, end: 0, type: 'NONE'},
            haystackRangesToHighlight: [],
            showRange: null,
            animationList: null,
            animationCurrent: null,
            isAnimationInSync: false,
            isUserLoggedIn: false,
            tempBigMessage: '',
            tempBigMessageShow: false,
            tempBigMessageCancel: null
        }
    }

    componentDidMount() {
        //If there is a needle and haystack in the query string, populate the animation with these values.
        if (getQueryStringParameter('n') !== null && getQueryStringParameter('h') !== null) {
            this.getKmpInputSets();
        }
        else {
            this.getKmpInputSets(this.selectInputSetByName);
        }

        //Now we have got all the information we need from the query string, remove all params to clean up.
        window.history.replaceState({}, "", `${getUriWithoutQueryString()}`);
    }

    componentWillUnmount() {
        if (this.state.tempBigMessageCancel !== null) {
            clearTimeout(this.state.tempBigMessageCancel);
        }
    }

/***********************************************************
Create the pre-processing table.
************************************************************/

    createKMPTable = (needle) => {
        const kmpTable = [];
        const needleChars = [...needle];

        const kmpValues = Array(needleChars.length + 1).fill(0);

        let pos = 1;
        let cnd = 0;

        kmpValues[0] = -1;
        while (pos < needleChars.length) {
            if (needleChars[pos] === needleChars[cnd])
                kmpValues[pos] = kmpValues[cnd];
            else {
                kmpValues[pos] = cnd;
                cnd = kmpValues[cnd];
                while (cnd >= 0 && needleChars[pos] !== needleChars[cnd])
                    cnd = kmpValues[cnd];
            }
            pos++;
            cnd++;
        }
        kmpValues[pos] = cnd;

        needleChars.push(null);

        kmpTable.push(needleChars);
        kmpTable.push(kmpValues);
        
        return kmpTable;
    }

/***********************************************************
Do the string search.
************************************************************/

    kmpStringSearch = (needle, haystack) => {
        const kmpTable = this.createKMPTable(needle);
        const foundIndexes = [];
        
        let j = 0;
        let k = 0;
        while (j < haystack.length) {
            if (haystack.charAt(j) === needle.charAt(k)) {
                j++;
                k++;

                this.animationList.addLast({
                    type: 'SEARCH',
                    haystackPosition: j,
                    needlePosition: k,
                    state: 'PARTFOUND'
                });

                if (k === needle.length) {
                    this.animationList.addLast({
                        type: 'SEARCH',
                        haystackPosition: j,
                        needlePosition: k,
                        state: 'FOUND'
                    });

                    foundIndexes.push(j - k);
                    k = kmpTable[1][k];
                }
            }
            else {
                this.animationList.addLast({
                    type: 'SEARCH',
                    haystackPosition: j,
                    needlePosition: k,
                    state: 'MISMATCH'
                });

                k = kmpTable[1][k];
                if (k < 0) {
                    j++;
                    k++;
                }
            }
        }

        this.animationList.addLast({
            type: 'SEARCH',
            state: 'END'
        });

        return {
            foundIndexes: foundIndexes,
            kmpTable: kmpTable
        };
    }

/***********************************************************
Start a new animation.
************************************************************/

    startNewAnimation = (callback) => {
        this.animationList = new LinkedList();
        let needle = createDeepCopy(this.state.needle);
        let haystack = createDeepCopy(this.state.haystack);

        if (haystack.length === 0 || needle.length === 0) {
            return;
        }

        //Replace new lines in the haystack with spaces.
        haystack = haystack.replace(/[\r\n]+/g, " ");

        if (!this.state.caseSensitive) {
            needle = needle.toUpperCase();
            haystack = haystack.toUpperCase();
        }

        const kmpSearchResult = this.kmpStringSearch(needle, haystack);

        const resetAnimationStates = this.resetAnimationStates();

        this.setState({
            kmpTable: kmpSearchResult.kmpTable,
            haystackRangesToHighlight: resetAnimationStates.haystackRangesToHighlight,
            needleRangeToHighlight: resetAnimationStates.needleRangeToHighlight,
            foundIndexes: resetAnimationStates.foundIndexes,
            showRange: null,
            animationList: this.animationList,
            animationCurrent: this.animationList.firstNode,
            isAnimationInSync: true
        }, () => {
            //Do the callback if one is supplied.
            if (callback) {
                callback();
            }
        });
    }

/***********************************************************
Do a single step in the animation.
************************************************************/

    doOneAnimation = () => {
        this.doRemainingAnimations(1);
    }

/***********************************************************
Do all remaining steps in the animation.
************************************************************/

    doRemainingAnimations = (howMany = Infinity) => {
        const haystackRangesToHighlight = createDeepCopy(this.state.haystackRangesToHighlight);
        const needleRangeToHighlight = createDeepCopy(this.state.needleRangeToHighlight);
        const foundIndexes = createDeepCopy(this.state.foundIndexes);

        let newAnimationCurrent = this.state.animationCurrent;
        while (newAnimationCurrent !== null) {
            const animation = newAnimationCurrent.val;

            //If the last highlight was a mismatch, clear it away before doing the next animation.
            if (haystackRangesToHighlight[haystackRangesToHighlight.length - 1].type === 'MISMATCH') {
                const nextPosition = haystackRangesToHighlight[haystackRangesToHighlight.length - 1].end;
                haystackRangesToHighlight.pop();

                haystackRangesToHighlight.push({
                    start: nextPosition,
                    end: nextPosition,
                    type: 'NONE'
                });

                needleRangeToHighlight.start = 0;
                needleRangeToHighlight.type = 'NONE';
            }

            if (animation.state === 'PARTFOUND') {
                //Highlight from the saved start index to the animation position.
                haystackRangesToHighlight[haystackRangesToHighlight.length - 1].start = animation.haystackPosition - animation.needlePosition
                haystackRangesToHighlight[haystackRangesToHighlight.length - 1].end = animation.haystackPosition;
                haystackRangesToHighlight[haystackRangesToHighlight.length - 1].type = 'PARTFOUND';

                if (haystackRangesToHighlight.length > 1
                    && haystackRangesToHighlight[haystackRangesToHighlight.length - 1].start < haystackRangesToHighlight[haystackRangesToHighlight.length - 2].end) {
                    haystackRangesToHighlight[haystackRangesToHighlight.length - 1].start = haystackRangesToHighlight[haystackRangesToHighlight.length - 2].end;
                }

                //Highlight the relevant part of the needle as part found.
                needleRangeToHighlight.end = animation.needlePosition;
                needleRangeToHighlight.type = 'PARTFOUND';
            }
            else if (animation.state === 'FOUND') {
                //If the previous highlight range is FOUND, and this FOUND index is equal to the end of that range then merge the two.
                if (haystackRangesToHighlight.length > 1
                    && haystackRangesToHighlight[haystackRangesToHighlight.length - 2].type === 'FOUND'
                    && haystackRangesToHighlight[haystackRangesToHighlight.length - 2].end === haystackRangesToHighlight[haystackRangesToHighlight.length - 1].start) {
                    //Amend the previous FOUND highlight range with the new end position.
                    haystackRangesToHighlight[haystackRangesToHighlight.length - 2].end = animation.haystackPosition;

                    //Amend the start of the latest highlight range.
                    haystackRangesToHighlight[haystackRangesToHighlight.length - 1].start = animation.haystackPosition;
                    haystackRangesToHighlight[haystackRangesToHighlight.length - 1].type = 'NONE';
                }
                else {
                    haystackRangesToHighlight[haystackRangesToHighlight.length - 1].end = animation.haystackPosition;
                    haystackRangesToHighlight[haystackRangesToHighlight.length - 1].type = 'FOUND';

                    //Push this found highlight to the array so that the found string stays highlighted in the haystack output.
                    haystackRangesToHighlight.push({
                        start: animation.haystackPosition,
                        type: 'NONE'
                    });
                }

                //Add an index to the found indexes
                foundIndexes.push({
                    index: animation.haystackPosition - animation.needlePosition
                });

                //Highlight the needle as found.
                needleRangeToHighlight.end = animation.needlePosition;
                needleRangeToHighlight.type = 'FOUND';
            }
            else if (animation.state === 'MISMATCH') {
                haystackRangesToHighlight.pop();

                haystackRangesToHighlight.push({
                    start: animation.haystackPosition,
                    end: animation.haystackPosition + 1,
                    type: 'MISMATCH'
                });
                needleRangeToHighlight.start = animation.needlePosition;
                needleRangeToHighlight.end = animation.needlePosition + 1;
                needleRangeToHighlight.type = 'MISMATCH';
            }
            else if (animation.state === 'END') {
                //If the last haystack highlight in the array is PARTFOUND, then clear it from the array now that the animation is done.
                if (haystackRangesToHighlight[haystackRangesToHighlight.length - 1].type === 'PARTFOUND') {
                    haystackRangesToHighlight.pop();
                }

                //Un-highlight everything in the KMP table when the animation is done.
                needleRangeToHighlight.start = 0;
                needleRangeToHighlight.end = 0
                needleRangeToHighlight.type = 'NONE';
            }
            newAnimationCurrent = newAnimationCurrent.next;

            if (--howMany === 0) {
                break;
            }
        }

        //Move to the next animation.
        this.setState({
            animationCurrent: newAnimationCurrent,
            haystackRangesToHighlight: haystackRangesToHighlight,
            needleRangeToHighlight: needleRangeToHighlight,
            foundIndexes: foundIndexes
        });
    }

/***********************************************************
Restart the animation from the beginning.
************************************************************/

    replayAnimation = (callback) => {
        const resetAnimationStates = this.resetAnimationStates();

        this.setState({
            animationCurrent: this.state.animationList.firstNode,
            haystackRangesToHighlight: resetAnimationStates.haystackRangesToHighlight,
            needleRangeToHighlight: resetAnimationStates.needleRangeToHighlight,
            foundIndexes: resetAnimationStates.foundIndexes,
            showRange: null
        }, () => {
            //Do the callback if one is provided.
            if (callback) {
                callback();
            }
        });
    }

/***********************************************************
Reset the animation state properties ready for another run.
************************************************************/

    resetAnimationStates = () => {
        const haystackRangesToHighlight = [{
            start: 0,
            end: 0,
            type: 'NONE'
        }];

        const needleRangeToHighlight = {
            start: 0,
            end: 0,
            type: 'NONE'
        };

        return {
            haystackRangesToHighlight: haystackRangesToHighlight,
            needleRangeToHighlight: needleRangeToHighlight,
            foundIndexes: []
        }
    }

/***********************************************************
Check if the animation is running.
************************************************************/

    isAnimationRunning() {
        return this.state.animationCurrent !== null;
    }

/***********************************************************
Handle the event where a user types in the needle input.
************************************************************/

    onNeedleChange = (event) => {
        const newNeedle = event.target.value.substring(0, this.maxNeedleLength - 1);

        this.setState({
            needle: newNeedle,
            foundIndexes: [],
            haystackRangesToHighlight: [],
            isAnimationInSync: false
        });
    }

/***********************************************************
Handle the event where the user checks or unchecks the case-sensitive box.
************************************************************/

    onCaseSensitiveChange = () => {
        this.setState({
            caseSensitive: !this.state.caseSensitive,
            foundIndexes: [],
            haystackRangesToHighlight: [],
            isAnimationInSync: false
        });
    }

/***********************************************************
Handle the event where the user types in the haystack input.
************************************************************/

    onHaystackChange = (event) => {
        const newHaystack = event.target.value.substring(0, this.maxHaystackLength - 1);

        this.setState({
            haystack: newHaystack,
            foundIndexes: [],
            haystackRangesToHighlight: [],
            isAnimationInSync: false
        });
    }

/***********************************************************
Render the Knuth-Morris-Pratt pre-processing table.
************************************************************/

    renderKMPTable = () => {
        const needleChars = this.state.needle.split('');
        needleChars.push(null);

        const indexRow = needleChars.map((value, index) => 
            <td
                key={index.toString()}
                className={this.getNeedleClass(index)}
            >{index.toString()}</td>
        );
        
        const charRow = needleChars.map((value, index) => 
            <td
                key={index.toString()}
                className={this.getNeedleClass(index)}
            >{value === null ? '' : value.toString()}</td>
        );

        let kmpValueRow;
        //If state.kmpTable is not up to date, make the 3rd row blank.
        if (this.state.kmpTable === null || !this.state.isAnimationInSync) {
            kmpValueRow = needleChars.map((value, index) =>
                <td
                    key={index.toString()}
                    className={this.getNeedleClass(index)}
                ></td>
            );
        }
        else {
            kmpValueRow = this.state.kmpTable[1].map((value, index) =>
                <td
                    key={index.toString()}
                    className={this.getNeedleClass(index)}
                >{value === null ? '' : value.toString()}</td>
            );
        }

        return (
            <table>
                <tbody>
                    <tr>{indexRow}</tr>
                    <tr>{charRow}</tr>
                    <tr>{kmpValueRow}</tr>
                </tbody>
            </table>
        );
    }

/***********************************************************
Decide which letters of the needle should be highlighted.
************************************************************/

    getNeedleClass = (index) => {
        const needleRangeToHighlight = this.state.needleRangeToHighlight;
        let classString = 'kmp-grid-cell';

        if (needleRangeToHighlight !== null
            && needleRangeToHighlight.start <= index
            && index < needleRangeToHighlight.end) {
            switch (needleRangeToHighlight.type) {
                case 'PARTFOUND':
                    classString += ' kmp-text-partfound';
                    break;
                case 'FOUND':
                    classString += ' kmp-text-found';
                    break;
                case 'MISMATCH':
                    classString += ' kmp-text-mismatch';
                    break;
            }
        }
        return classString;
    }

/***********************************************************
Render the buttons which show indexes of the needle in the haystack.
************************************************************/

    renderFoundIndexes = () => {
        const foundIndexes = this.state.foundIndexes;

        const indexButtons = foundIndexes.map((value, index) =>
            <Button
                color='primary'
                key={index.toString()}
                className={this.getFoundIndexClass(value.index)}
                onClick={() => this.onFoundIndexClick(event)}
            >{value.index}</Button>
        );

        return (
            <div className='kmp-found-indexes-container'>
                {!this.state.isAnimationInSync ? 'Click "Start New Animation"' : indexButtons.length === 0 ? 'String not found' : indexButtons}
            </div>
        )
    }

/***********************************************************
Decide the class of a found index button.
************************************************************/

    getFoundIndexClass = (foundIndexValue) => {
        if (this.state.showRange !== null && this.state.showRange.start == foundIndexValue) {
            return 'kmp-found-index-button kmp-text-show';
        }
        return 'kmp-found-index-button';
    }

/***********************************************************
Highlight/un-highlight instances of the needle in the haystack.
************************************************************/

    onFoundIndexClick = (event) => {
        let showRange = createDeepCopy(this.state.showRange);
        const index = parseInt(event.target.innerText);

        //Set showRange to start at this index, if it is not already at this index.
        if (showRange === null || showRange.start !== index) {
            showRange = {
                start: index,
                end: index + this.state.needle.length
            };
        }
        //If showRange is already at this index, then unset it and therefore remove the FOUND highlighting.
        else {
            showRange = null;
        }

        this.setState({
            showRange: showRange
        });
    }

/***********************************************************
Render the haystack with animation highlighting.
************************************************************/

    renderHaystack = () => {
        let haystack = this.state.haystack;

        const haystackRangesToHighlight = createDeepCopy(this.state.haystackRangesToHighlight);
        const showRange = this.state.showRange;
        let highlightsIndex = 0;
        
        //If there is a range to SHOW, then merge this into the ranges to highlight, giving SHOW priority.
        if (showRange !== null) {
            //Find the range which the SHOW range sits within - it must sit within a FOUND range.
            for (let i = 0; i < haystackRangesToHighlight.length; i++) {
                if (showRange.start >= haystackRangesToHighlight[i].start
                    && showRange.end <= haystackRangesToHighlight[i].end) {
                    //Add the SHOW range into the existing range.
                    if (showRange.start === haystackRangesToHighlight[i].start) {
                        if (showRange.end === haystackRangesToHighlight[i].end) {
                            haystackRangesToHighlight[i].type = 'SHOW';
                        }
                        //showRange.end < haystackRangesToHighlight[i].end
                        else {
                            haystackRangesToHighlight.splice(i + 1, 0, {
                                type: haystackRangesToHighlight[i].type,
                                start: showRange.end,
                                end: haystackRangesToHighlight[i].end
                            });
                            haystackRangesToHighlight[i].type = 'SHOW';
                            haystackRangesToHighlight[i].end = showRange.end;
                        }
                    }
                    //showRange.start > haystackRangesToHighlight[i].start
                    else {
                        if (showRange.end === haystackRangesToHighlight[i].end) {
                            haystackRangesToHighlight[i].end = showRange.start;
                            haystackRangesToHighlight.splice(i + 1, 0, {
                                type: 'SHOW',
                                start: showRange.start,
                                end: showRange.end
                            });
                        }
                        //showRange.end < haystackRangesToHighlight[i].end
                        else {
                            const end = haystackRangesToHighlight[i].end;
                            haystackRangesToHighlight[i].end = showRange.start;

                            haystackRangesToHighlight.splice(i + 1, 0, {
                                type: 'SHOW',
                                start: showRange.start,
                                end: showRange.end
                            }, {
                                type: haystackRangesToHighlight[i].type,
                                start: showRange.end,
                                end: end
                            });
                        }
                    }
                    break;
                }
            }
        }

        //Move through the haystack highlighting the appropriate ranges.
        const haystackWithHighlighting = [];
        let haystackPosition = 0;
        while (haystackPosition < haystack.length) {
            //We have reached the end of the ranges to highlight, so add the remaining string to the output.
            if (highlightsIndex >= haystackRangesToHighlight.length) {
                haystackWithHighlighting.push(haystack.substring(haystackPosition));

                haystackPosition = haystack.length;
            }
            //We have some unhighlighted string to add to the output, before the next range to highlight.
            else if (haystackPosition < haystackRangesToHighlight[highlightsIndex].start) {
                haystackWithHighlighting.push(haystack.substring(haystackPosition, haystackRangesToHighlight[highlightsIndex].start));

                haystackPosition = haystackRangesToHighlight[highlightsIndex].start;
            }
            //We have reached the start of a range to be highlighted, so us a span to highlight it and add it to the output.
            else if (haystackPosition === haystackRangesToHighlight[highlightsIndex].start) {
                haystackWithHighlighting.push(
                    <span
                        key={highlightsIndex.toString()}
                        className={this.getHaystackHighglightClass(haystackRangesToHighlight[highlightsIndex].type)}>
                        {haystack.substring(haystackRangesToHighlight[highlightsIndex].start, haystackRangesToHighlight[highlightsIndex].end)}
                    </span>
                );

                haystackPosition = haystackRangesToHighlight[highlightsIndex].end;
                highlightsIndex++;
            }
        }

        return (
            <div className='kmp-haystack'>{haystackWithHighlighting}</div>
        );
    }

/***********************************************************
Higlight the section of the haystack with the correct colour.
************************************************************/

    getHaystackHighglightClass = (highlightType) => {
        if (highlightType === 'PARTFOUND') {
            return 'kmp-text-partfound';
        }
        else if (highlightType === 'FOUND') {
            return 'kmp-text-found';
        }
        else if (highlightType === 'MISMATCH') {
            return 'kmp-text-mismatch';
        }
        else if (highlightType === 'SHOW') {
            return 'kmp-text-show';
        }
    }

/***********************************************************
Render the KMP input set drop-down list.
************************************************************/

    renderKMPDropDown = () => {
        const kmpInputSets = this.state.kmpInputSets;

        //Split the input sets into those which are shared and those which are owned by the user.
        let exampleInputSets = [];
        let userOwnedInputSets = [];
        for (let i = 0; i < kmpInputSets.length; i++) {
            if (kmpInputSets[i].isOwnedByUser === false) {
                exampleInputSets.push(kmpInputSets[i]);
            }
            else {
                userOwnedInputSets.push(kmpInputSets[i]);
            }
        }

        //Sort examples and user owned input sets by name.
        exampleInputSets.sort(this.compareObjectsByName);
        userOwnedInputSets.sort(this.compareObjectsByName);

        //Build the example input set DropDownItems.
        const dropdownItems = [];
        dropdownItems.push(<DropdownItem key='exampleInputSets' header>Example Input Sets</DropdownItem>);
        for (let i = 0; i < exampleInputSets.length; i++) {
            dropdownItems.push(
                <DropdownItem
                    key={exampleInputSets[i].id.toString()}
                    onClick={() => this.populateInputs(exampleInputSets[i].id)}
                >{exampleInputSets[i].name}
                </DropdownItem>
            );
        }

        //If there are any user owned input sets, then add these.
        if (userOwnedInputSets.length > 0) {
            dropdownItems.push(<DropdownItem key='divider' divider />)
            dropdownItems.push(<DropdownItem key='myInputSets' header>My Input Sets</DropdownItem>);

            for (let i = 0; i < userOwnedInputSets.length; i++) {
                dropdownItems.push(
                    <DropdownItem
                        key={userOwnedInputSets[i].id.toString()}
                        onClick={() => this.populateInputs(userOwnedInputSets[i].id)}
                    >{userOwnedInputSets[i].name}
                    </DropdownItem>
                );
            }
        }

        return dropdownItems;
    }

    compareObjectsByName = (object1, object2) => {
        if (object1.name < object2.name) {
            return -1;
        }
        if (object1.name > object2.name) {
            return 1;
        }
        return 0;
    }

/***********************************************************
Select an input set by a given name and whether or not the user owns it.
************************************************************/

    selectInputSetByName = (name, isOwnedByUser) => {
        const kmpInputSets = this.state.kmpInputSets;
        let coconutDemoIndex = null;
        
        for (let i = 0; i < kmpInputSets.length; i++) {
            //Get the index of the Coconut Demo, just in case we can't find the given name.
            if (kmpInputSets[i].isOwnedByUser === false && kmpInputSets[i].name === 'Coconut Demo') {
                coconutDemoIndex = i;
            }

            if (kmpInputSets[i].isOwnedByUser === isOwnedByUser && kmpInputSets[i].name === name) {
                this.setState({
                    kmpInputSetSelected: i
                }, () => {
                    this.populateInputs(kmpInputSets[i].id);
                });
                return;
            }
        }

        this.setState({
            kmpInputSetSelected: coconutDemoIndex
        }, () => {
            this.populateInputs(kmpInputSets[coconutDemoIndex].id);
        });
    }

/***********************************************************
Populate needle and haystack values for the given input set.
************************************************************/

    populateInputs = (id) => {
        const kmpInputSets = this.state.kmpInputSets;
        const reset = this.resetAnimationStates();

        //Finish the currently running animation.
        this.doRemainingAnimations();

        //Find the input set with the specified id and apply it.
        for (let i = 0; i < kmpInputSets.length; i++) {
            if (kmpInputSets[i].id === id) {
                this.updateSaveName(kmpInputSets[i].name);

                this.setState({
                    needle: kmpInputSets[i].needle,
                    haystack: kmpInputSets[i].haystack,
                    caseSensitive: kmpInputSets[i].caseSensitive,
                    kmpInputSetSelected: i,
                    needleRangeToHighlight: reset.needleRangeToHighlight,
                    haystackRangesToHighlight: reset.haystackRangesToHighlight,
                    foundIndexes: reset.foundIndexes,
                    isAnimationInSync: false,
                });
                return;
            }
        }
    }

/***********************************************************
Get a list of KMP input sets from the server.
************************************************************/

    getKmpInputSets = (callback = null) => {
        let request = new Request('/api/KnuthMorrisPratt');
        request.headers.append("RequestVerificationToken", getRequestVerificationTokenValue());
        fetch(request)
            .then((response) => {
                const responseJSON = response.json();
                responseJSON.then(data => {
                    this.setState({
                        kmpInputSets: data
                    }, () => {
                        if (callback !== null) {
                            callback();
                        }
                    });
                });
            });
    }

/***********************************************************
Save the input set using the given name.
************************************************************/

    saveInputSet = (saveName) => {
        const kmpInputSets = this.state.kmpInputSets;
        saveName = saveName.trim();
        
        let existingKmpId = null;
        let userInputSetCount = 0;
        for (let i = 0; i < kmpInputSets.length; i++) {
            if (kmpInputSets[i].isOwnedByUser === true) {
                userInputSetCount++;

                if (kmpInputSets[i].name === saveName) {
                    existingKmpId = kmpInputSets[i].id;
                }
            }
        }

        if (existingKmpId === null && userInputSetCount >= 10) {
            alert('You cannot have more than 10 saved input sets. Delete an input set to be able to create a new one');
            return;
        }

        if (existingKmpId !== null) {
            let confirmResult = confirm('An input set with this name already exists. Do you want to overwrite it?');
            if (confirmResult !== true) {
                return;
            }
        }

        const requestUri = '/api/KnuthMorrisPratt' + (existingKmpId !== null ? `/${existingKmpId}` : '');
        const requestMethod = existingKmpId !== null ? 'PUT' : 'POST';
        const requestJson = {
            'Id': existingKmpId,
            'Name': saveName,
            'Needle': this.state.needle,
            'Haystack': this.state.haystack,
            'CaseSensitive': this.state.caseSensitive,
        };
        const requestBody = new Blob([JSON.stringify(requestJson, null, 2)], { type: 'application/json' });
        const request = new Request(requestUri, { method: requestMethod, body: requestBody });
        request.headers.append("RequestVerificationToken", getRequestVerificationTokenValue());
        fetch(request)
            .then((response) => {
                if ([200, 201].includes(response.status)) {
                    this.getKmpInputSets(() => { this.selectInputSetByName(saveName, true); });
                    this.setState({
                        tempBigMessage: 'Saved',
                        tempBigMessageShow: true
                    });

                    this.state.tempBigMessageCancel = setTimeout(() => {
                        this.setState({
                            tempBigMessageShow: false,
                        });
                    }, 2000);
                }
                else {
                    alert('Something went wrong! Maybe you have been logged out due to inactivity.');
                }
            });
    }

/***********************************************************
Delete the current input set.
************************************************************/

    deleteInputSet = () => {
        if (confirm(`Are you sure you want to delete "${this.state.kmpInputSets[this.state.kmpInputSetSelected].name}"?`) !== true) {
            return;
        }

        const requestUri = `/api/KnuthMorrisPratt/${this.state.kmpInputSets[this.state.kmpInputSetSelected].id}`;
        const request = new Request(requestUri, { method: 'DELETE' });
        request.headers.append("RequestVerificationToken", getRequestVerificationTokenValue());
        fetch(request)
            .then((response) => {
                if (response.status === 200) {
                    this.getKmpInputSets(this.selectInputSetByName());
                    this.setState({
                        tempBigMessage: 'Deleted',
                        tempBigMessageShow: true
                    }, () => {
                        this.state.tempBigMessageCancel = setTimeout(() => {
                            this.setState({
                                tempBigMessageShow: false
                            });
                        }, 2000);
                    });
                }
                else {
                    alert('Something went wrong! Maybe you have been logged out due to inactivity.');
                }
            });
    }

/***********************************************************
Get the current input set name.
************************************************************/

    getSelectedInputSetName() {
        try {
            return this.state.kmpInputSets[this.state.kmpInputSetSelected].name;
        }
        catch {
            return null;
        }
    }

/***********************************************************
Decide whether the delete button should be shown.
************************************************************/

    getDeleteButtonClassName = () => {
        try {
            if (this.state.kmpInputSets[this.state.kmpInputSetSelected].isOwnedByUser === true) {
                return 'kmp-delete-button';
            }
        }
        catch {}
        return 'kmp-delete-button hidden';
    }

/***********************************************************
Update the name used to save the input set.
************************************************************/

    updateSaveName = (newSaveName) => {
        this.setState({
            saveName: newSaveName ?? ''
        });
    }

/***********************************************************
Get a link to the current inputs which the user can share.
************************************************************/

    getShareLink = () => {
        const params = new URLSearchParams();
        params.append('n', this.state.needle);
        params.append('h', this.state.haystack);
        params.append('c', this.state.caseSensitive === true ? 1 : 0);

        const uriWithoutParams = `${getUriWithoutQueryString()}?${params}`;

        copyTextToClipboard(uriWithoutParams);
    }

/***********************************************************
React render.
************************************************************/

    render() {
        return (
            <UserContext.Consumer>
                {({ authenticated, updateAuthenticated }) => (
                    <Row>
                        <DocumentTitle documentTitle='Knuth-Morris-Pratt' />
                        <BigMessage
                            messageText={this.state.tempBigMessage}
                            color='success'
                            show={this.state.tempBigMessageShow}
                        />
                        <Col lg='6'>
                            <h3>Knuth-Morris-Pratt</h3>
                            <h5>Instructions:</h5>
                            <ol>
                                <li className='instructions-list-item'>Enter a string to search for.</li>
                                <li className='instructions-list-item'>Enter a string to search within.</li>
                                <li className='instructions-list-item'>Click "Start New Animation".</li>
                            </ol>
                            <Row>
                                <Col className='kmp-button-col'>
                                    <ModalInformational
                                        className='modal-save'
                                        buttonText="More Information"
                                        modalTitle="More Information"
                                        modalContents={
                                            <div>
                                                <p>
                                                    The Knuth-Morris-Pratt string search algorithm is a notable algorithm because it is able to locate a string
                                                    (sometimes called a needle) within another string (sometimes called a haystack) without ever returning to an
                                                    earlier position in the haystack. This allows it to have a time complexity, in the worst case of
                                                    O(needle length + haystack length) – at least as good or better than any other string search algorithm.
                                            </p>
                                                <p>
                                                    To make this a bit more concrete, let’s take the example of a needle of "aaaaaab" and a haystack of "aaaaaaaaaaaa…".
                                                    A naive string search algorithm might compare the first letter of the needle with the haystack, find a match, then
                                                    compare the second letter of both, find a match, and so on, until the final letter of the needle, "b", is reached,
                                                    where a mismatch would be found. At this point we know that there is no match at the first character of the haystack,
                                                    so we move the needle forward by one character and attempt to match the second character of the haystack with the
                                                    first letter of the needle. This will have a time complexity of O(needle length * haystack length).
                                            </p>
                                                <p>
                                                    How does Knuth-Morris-Pratt improve upon this, to achieve a time complexity of O(needle length + haystack length)?
                                                    It does some pre-processing on the needle. The aim of the pre-processing is to discover any substring within the
                                                    needle which matches the leftmost characters in the needle. In this case, take the middle characters of the needle
                                                    as an example: "aaaaa". These middle 5 characters match the first 5 characters of the needle, so if we find 6 "a"s
                                                    in a row in the haystack, then a character which is not a "b", we don’t need to re-compare the most recent "a"s
                                                    again, we can simply shift the needle forward by 1, with the knowledge that we will still have 5 matching "a"s in
                                                    the needle and the haystack. This looks like the below:
                                            </p>
                                                <p>
                                                    <b>6 "a"s are matched but the "b" is not...</b>
                                                    <img className='img-fluid' src='/images/Knuth-Morris-Pratt_pre-processing_index_1.PNG' />
                                                </p>
                                                <p>
                                                    <b>... but we still have 5 remaining "a"s which we know will match, so we don't need to recompare.</b>
                                                    <img className='img-fluid' src='/images/Knuth-Morris-Pratt_pre-processing_index_2.PNG' />
                                                </p>
                                                <p>
                                                    This is what the last row in the pre-processing table tells us: which index in the needle to compare next if we find
                                                    a mismatch. A "-1" tells us to move our position in the haystack forward by 1, and start from 0 in the needle. The final
                                                    character in the pre-processing table is not a space character, but a null, or no character. This is there to tell us
                                                    where to return to in the needle if we have successfully matched the entire needle in the string, if we are looking to
                                                    find not just the first needle in the haystack, but every occurrence of the needle in the haystack.
                                            </p>
                                                <p>
                                                    This pre-processing work saves us from having to ever return to an earlier position in the haystack, and hence
                                                    allows us to have a time complexity of O(needle length + haystack length) rather than O(needle length * haystack length).
                                            </p>
                                            </div>
                                        }
                                    />
                                    <ShareButton shareFunction={this.getShareLink} />
                                </Col>
                            </Row>
                            <Row>
                                <Col className='kmp-button-col'>
                                    <UncontrolledDropdown className='kmp-input-set-dropdown'>
                                        <DropdownToggle
                                            caret
                                            color='primary'
                                        >{this.getSelectedInputSetName() ?? 'Select an input set'}</DropdownToggle>
                                        <DropdownMenu>
                                            {this.renderKMPDropDown()}
                                        </DropdownMenu>
                                    </UncontrolledDropdown>
                                    <ModalSave
                                        disabled={!authenticated}
                                        disabledTitle='You must be logged in to save your own input sets'
                                        defaultSaveName={this.getSelectedInputSetName()}
                                        saveName={this.state.saveName}
                                        saveFunction={this.saveInputSet}
                                        updateSaveName={this.updateSaveName}
                                    />
                                    <Button
                                        color='danger'
                                        className={this.getDeleteButtonClassName()}
                                        disabled={!authenticated}
                                        onClick={this.deleteInputSet}
                                    >Delete</Button>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <br />
                                    <Label for='needle' className='kmp-header-label'>The string to search for:</Label>
                                    <Input
                                        id='needle'
                                        maxLength={this.maxNeedleLength}
                                        value={this.state.needle}
                                        disabled={this.state.animationCurrent !== null}
                                        onChange={() => this.onNeedleChange(event)}
                                    />
                                </Col>
                            </Row>
                            <FormGroup check>
                                <Label>
                                    <Input
                                        type='checkbox'
                                        checked={this.state.caseSensitive}
                                        disabled={this.state.animationCurrent !== null}
                                        onChange={() => this.onCaseSensitiveChange()}
                                    />
                                Case sensitive
                            </Label>
                            </FormGroup>
                            <FormGroup>
                                <Label for='haystack' className='kmp-header-label'>The string to search within:</Label>
                                <Input
                                    id='haystack'
                                    type='textarea'
                                    rows='3'
                                    maxLength={this.maxHaystackLength}
                                    value={this.state.haystack}
                                    disabled={this.state.animationCurrent !== null}
                                    onChange={() => this.onHaystackChange(event)}
                                />
                            </FormGroup>
                        </Col>
                        <Col>
                            <AnimationControl
                                animationList={this.state.animationList}
                                animationCurrent={this.state.animationCurrent}
                                startNewAnimation={this.startNewAnimation}
                                doOneAnimation={this.doOneAnimation}
                                doRemainingAnimations={this.doRemainingAnimations}
                                replayAnimation={this.replayAnimation}
                                buttonsDisabled={!this.state.isAnimationInSync}
                                maxTimeBetweenAnimationsMs={1000}
                            />
                            <br />
                            <Label className='kmp-header-label'>Pre-processing table:</Label>
                            {this.renderKMPTable()}
                            <br />
                            <Label className='kmp-header-label'>Search string found at positions:</Label>
                            {this.renderFoundIndexes()}
                            <br />
                            <Label className='kmp-header-label'>The string to search within:</Label>
                            {this.renderHaystack()}
                        </Col>
                    </Row>
                )}
            </UserContext.Consumer>
        )
    }
}