import React from "react";
import { Row, Col, Input, FormGroup, Label, Button } from "reactstrap";
import { DocumentTitle } from '../document-title';
import { AnimationControl } from '../animation-control';
import { LinkedList } from "../../shared/linked-list";
import { createDeepCopy } from "../../shared/functions";

import '../../../css/knuth-morris-pratt.css';

export class KnuthMorrisPratt extends React.Component {
    constructor(props) {
        super(props);

        this.animationList = new LinkedList();

        this.state = {
            needle: 'coconut',
            haystack: 'I like cocoa and coconut flavours',
            caseSensitive: false,
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
                    state: 'MISMATCH-ON'
                });
                this.animationList.addLast({
                    type: 'SEARCH',
                    haystackPosition: j,
                    needlePosition: k,
                    state: 'MISMATCH-OFF'
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
        const animation = this.state.animationCurrent.val;

        if (animation.type === 'SEARCH') {
            const haystackRangesToHighlight = createDeepCopy(this.state.haystackRangesToHighlight);
            const needleRangeToHighlight = createDeepCopy(this.state.needleRangeToHighlight);
            const foundIndexes = createDeepCopy(this.state.foundIndexes);

            if (animation.state === 'PARTFOUND') {
                //Highlight from the saved start index to the animation position.
                haystackRangesToHighlight[haystackRangesToHighlight.length - 1].end = animation.haystackPosition;
                haystackRangesToHighlight[haystackRangesToHighlight.length - 1].type = 'PARTFOUND';

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
            else if (animation.state === 'MISMATCH-ON') {
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
            else if (animation.state === 'MISMATCH-OFF') {
                const nextPosition = haystackRangesToHighlight[haystackRangesToHighlight.length - 1].end;
                haystackRangesToHighlight.pop();
                haystackRangesToHighlight.push({
                    start: nextPosition,
                    end: nextPosition,
                    type: 'NONE'
                });
                needleRangeToHighlight.start = 0;
                needleRangeToHighlight.end = animation.needlePosition;
                needleRangeToHighlight.type = 'NONE';
            }
            else if (animation.state === 'END') {
                //Un-highlight everything in the KMP table when the animation is done.
                needleRangeToHighlight.start = 0;
                needleRangeToHighlight.end = 0
                needleRangeToHighlight.type = 'NONE';
            }

            this.setState({
                haystackRangesToHighlight: haystackRangesToHighlight,
                needleRangeToHighlight: needleRangeToHighlight,
                foundIndexes: foundIndexes
            });
        }

        //Move to the next animation.
        this.setState((state) => {
            return { animationCurrent: state.animationCurrent.next }
        });
    }

    doRemainingAnimations = () => {
        
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
        this.setState({
            needle: event.target.value,
            foundIndexes: [],
            haystackRangesToHighlight: [],
            isAnimationInSync: false
        });
    }

    onCaseSensitiveChange = () => {
        this.setState({
            caseSensitive: !this.state.caseSensitive,
            foundIndexes: [],
            haystackRangesToHighlight: [],
            isAnimationInSync: false
        });
    }

    onHaystackChange = (event) => {
        this.setState({
            haystack: event.target.value,
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
                    <div>
                        <Label for='needle' className='kmp-header-label'>The string to search for:</Label>
                        <Input
                            id='needle'
                            value={this.state.needle}
                            disabled={this.state.animationCurrent !== null}
                            onChange={() => this.onNeedleChange(event)}
                        />
                    </div>
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