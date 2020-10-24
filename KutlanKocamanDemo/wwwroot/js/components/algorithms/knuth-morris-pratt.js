import React from "react";
import { Row, Col, Input, FormGroup, Label, Button } from "reactstrap";
import { DocumentTitle } from '../document-title';
import { AnimationControl } from '../animation-control';
import { LinkedList } from "../../shared/linked-list";
import { createDeepCopy, setQueryStringParameter, getQueryStringParameter } from "../../shared/functions";
import { ModalInformational } from "../modal-info";
import { ShareButton } from "../share-button";

import '../../../css/knuth-morris-pratt.css';

export class KnuthMorrisPratt extends React.Component {
    constructor(props) {
        super(props);

        this.animationList = new LinkedList();

        this.maxNeedleLength = 18;
        this.maxHaystackLength = 200;

        let needle = (getQueryStringParameter('n') ?? 'coconut').substring(0, this.maxNeedleLength - 1);
        let haystack = (getQueryStringParameter('h') ?? 'I like cocoa and coconut flavours').substring(0, this.maxHaystackLength - 1);
        let caseSensitive = (parseInt(getQueryStringParameter('c')) ?? 0) === 1;
        
        this.state = {
            needle: needle,
            haystack: haystack,
            caseSensitive: caseSensitive,
            kmpTable: null,
            foundIndexes: [],
            needleRangeToHighlight: {start: 0, end: 0, type: 'NONE'},
            haystackRangesToHighlight: [],
            showRange: null,
            animationList: null,
            animationCurrent: null,
            isAnimationInSync: false
        }
    }

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

    startNewAnimation = (callback) => {
        this.animationList = new LinkedList();
        let needle = createDeepCopy(this.state.needle);
        let haystack = createDeepCopy(this.state.haystack);

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

    doOneAnimation = () => {
        this.doRemainingAnimations(1);
    }

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

    onNeedleChange = (event) => {
        const newNeedle = event.target.value.substring(0, this.maxNeedleLength - 1);
        setQueryStringParameter('n', newNeedle);

        this.setState({
            needle: newNeedle,
            foundIndexes: [],
            haystackRangesToHighlight: [],
            isAnimationInSync: false
        });
    }

    onCaseSensitiveChange = () => {
        setQueryStringParameter('c', !this.state.caseSensitive === true ? 1 : 0);

        this.setState({
            caseSensitive: !this.state.caseSensitive,
            foundIndexes: [],
            haystackRangesToHighlight: [],
            isAnimationInSync: false
        });
    }

    onHaystackChange = (event) => {
        const newHaystack = event.target.value.substring(0, this.maxHaystackLength - 1);
        setQueryStringParameter('h', newHaystack);

        this.setState({
            haystack: newHaystack,
            foundIndexes: [],
            haystackRangesToHighlight: [],
            isAnimationInSync: false
        });
    }

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

    getFoundIndexClass = (foundIndexValue) => {
        if (this.state.showRange !== null && this.state.showRange.start == foundIndexValue) {
            return 'kmp-found-index-button kmp-text-show';
        }
        return 'kmp-found-index-button';
    }

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

        //Move throught the haystack highlighting the appropriate ranges.
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
            <div>{haystackWithHighlighting}</div>
        );
    }
    
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

    render() {
        return (
            <Row>
                <DocumentTitle documentTitle='Knuth-Morris-Pratt' />
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
                                buttonText="More Information"
                                modalTitle="More Information"
                                modalContents={
                                    <div>
                                        <p>
                                            The Knuth-Morris-Pratt is a notable algorithm because it can locate a string (sometimes called the "needle") within
                                            another string (sometimes called the "haystack") in O(needle length + haystack length) time, in the worst case.
                                            The algorithm never has to return to an earlier position in the haystack - it only moves forward in the haystack, or
                                            potentially re-examines the same character in the haystack, comparing it to a character further back in the needle.
                                            It manages to avoid re-examining letters to the left in the haystack by doing some pre-analysis on the needle: looking
                                            for substrings which match the leftmost characters of the needle.
                                        </p>
                                        <p>
                                            The bottom row of the pre-processing table shows the result of this pre-analysis. The numbers refer to the index that
                                            should be checked for a match next, if the current needle character does not match the current haystack character. For
                                            example, if your needle is coconut, and you have already matched "coco" in the haystack, but the next letter in the haystack
                                            is not "n", you do not need to start from the first letter of the needle again. You have matched coco, and found a mimatch,
                                            so you know that the previous two characters in both the needle and the haystack are "co", so you can try matching the 3rd
                                            letter in the needle next, instead of the first.
                                        </p>
                                        <p>
                                            The same pre-processing can help avoid unnecessarily revisiting previous letters in the haystack in the standard
                                            "difficult case" for a naive string search algorithm: when you have a needle like "aaaaaa" and a haystack like "aaaaaba...".
                                            Having matched the first 5 characters in the needle and haystack and then found a mismatch, we know that there is no
                                            reason to go back and start matching again from the second character in the haystack, because we have analysed the needle
                                            and know that there is no substring to the left of the current position within the needle which has a chance of matching.
                                            Therefore, the next chance of a match is to move to the next character in the haystack and to start again from the beginning
                                            of the needle.
                                        </p>
                                        <p>
                                            The last column in the pre-processing table will not contain any character - its function is to hold the index to match
                                            next, once the entire needle has been matched in the haystack. For example, for the needle "aaaaaa", the last index
                                            will be 5, because if we have matched 6 "a"s in a row, we know the previous 5 letters are "a", therefore we only need to match
                                            one more "a"!
                                        </p>
                                    </div>
                                }
                            />
                            <ShareButton />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
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
                                defaultChecked={this.state.caseSensitive}
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
        )
    }
}