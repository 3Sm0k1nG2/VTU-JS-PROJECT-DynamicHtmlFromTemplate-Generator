/**
 * @typedef {{ 
 * tagOpen: '<',
 * tagClose: '>',
 * tagCloseSpan: '<',
 * argQuotes: '"',
 * argWhitespace: ' ',
 * argEquals: '=',
 * placeholderOpen: '{',
 * placeholderClose: '}'
 * }} TriggerChars
 */
/** @type {TriggerChars} */
const TRIGGER_CHARS = {
    tagOpen: '<',
    tagClose: '>',
    tagCloseSpan: '/',
    argQuotes: '"',
    argWhitespace: ' ',
    argEquals: '=',
    placeholderOpen: '{',
    placeholderClose: '}'
}

let mode;

const modes = {

}

let chars = [];

let tagName = '';
let args = {};

let isWritingToTagName = false;
let isWritingToTagArgs = false;
let isWritingToQuotes = false;
let isWritingToPlaceholder = false;
let isWritingToTextContent = false;


let hasSinglePlaceHolder = false;

let hasStateChanged = false;

let key;
let values = [];

/** @type {HTMLElement} */
let element;

// export function htmlToElements(html = '<div className="red-color container"><div><button onclick="{{onClick}}" onclick="{{onClick}}">Click me</button><button onclick="{{onClick}}" onclick="{{onClick}}">{{click_me}}</button></div></div>') {
//     for (let char of html) {
//         switch (char) {
//             case TRIGGER_CHARS.tag.open: {
//                 if (isWritingToTagArgs) {
//                     throwInvalidHTMLError();
//                 }

//                 isWritingToTagName = true;
//                 isWritingToTagArgs = true;
//                 isWritingToQuotes = false;
//                 isWritingToPlaceholder = false;
//                 isWritingToTextContent = false;

//                 hasStateChanged = true;

//                 break;
//             }
//             case TRIGGER_CHARS.tag.close: {
//                 isWritingToTagName = false;
//                 isWritingToTagArgs = false;
//                 isWritingToQuotes = false;
//                 isWritingToPlaceholder = false;
//                 isWritingToTextContent = true;

//                 hasStateChanged = true;

//                 break;
//             }
//             case TRIGGER_CHARS.arg.whitespace: {
//                 if (!isWritingToTagArgs) {
//                     break;
//                 }

//                 if (isWritingToTagName) {
//                     isWritingToTagName = false;

//                     element = createHTMLElement();
//                 } else {
//                     if (isWritingToQuotes) {
//                         values.push(chars.join(''));
//                     }
//                 }

//                 hasStateChanged = true;

//                 break;
//             }
//             case TRIGGER_CHARS.arg.equals: {
//                 key = chars.join('');
//                 clearChars();

//                 hasStateChanged = true;

//                 break;
//             }
//             case TRIGGER_CHARS.arg.quotes: {
//                 if (!isWritingToTagArgs) {
//                     break;
//                 }

//                 isWritingToQuotes = !isWritingToQuotes;

//                 if (!isWritingToQuotes) {
//                     values.push(chars.join(''));
//                     element[key.trim()] = values.join(' ');
//                     clearChars();
//                     console.log({ key, value: values.join(' ') })
//                     values = [];
//                 }

//                 hasStateChanged = true;

//                 break;
//             }
//             case TRIGGER_CHARS.placeholder.open: {
//                 if (hasSinglePlaceHolder) {
//                     isWritingToPlaceholder = true;
//                     hasSinglePlaceHolder = false;
//                 } else {
//                     hasSinglePlaceHolder = true;
//                 }

//                 hasStateChanged = true;

//                 break;
//             }
//             case TRIGGER_CHARS.placeholder.close: {
//                 if (hasSinglePlaceHolder) {
//                     isWritingToPlaceholder = false;
//                     hasSinglePlaceHolder = false;
//                 } else {
//                     hasSinglePlaceHolder = true;
//                 }

//                 hasStateChanged = true;

//                 break;
//             }
//             default: {
//                 chars.push(char);

//                 break;
//             }
//         }

//         if (hasStateChanged) {
//             console.log({
//                 chars: chars.join(''), states: {
//                     isWritingToTagName,
//                     isWritingToTagArgs,
//                     isWritingToQuotes,
//                     isWritingToPlaceholder,
//                     isWritingToTextContent,
//                 }
//             });
//             console.dir(element);
//             hasStateChanged = false;
//             clearChars();
//         }

//     }

//     return element;
// }

export function htmlToElement_states_old(html = '<div className="red-color container" onclick="{{onClick}}">hello, {{addToMessage}}</div>') {
    /** 
     * @typedef {{ 
    * isWritingToTagName: boolean,
    * isWritingToTagArgs: boolean,
    * isWritingToQuotes: boolean,
    * isWritingToPlaceholder: boolean,
    * isWritingToTextContent: boolean,
    * }} States
    * */
    /** @type {States} */
    const states = {
        isWritingToTagName: false,
        isWritingToTagArgs: false,
        isWritingToQuotes: false,
        isWritingToPlaceholder: false,
        isWritingToTextContent: false
    }

    /** @type {{key: string, values: [any] }} */
    const arg = {
        key: undefined,
        values: []
    }

    let hasJustPlacedHolder = false;
    let hasSinglePlaceHolder = false;
    let hasStateChanged = false;

    let key;
    let values = [];

    let placeholder = '';
    let data = {
        onClick: () => { alert('hello') }
    }

    /** @type {HTMLElement} */
    let element;

    for (let char of html) {
        switch (char) {
            case TRIGGER_CHARS.tag.open: {
                if (states.isWritingToTagArgs) {
                    throwInvalidHTMLError();
                }

                changeState('isWritingToTagName', true);
                changeState('isWritingToTagArgs', true);

                break;
            }
            case TRIGGER_CHARS.tag.close: {
                changeState('isWritingToTagName', false);
                changeState('isWritingToTagArgs', false);
                changeState('isWritingToTextContent', true);

                break;
            }
            case TRIGGER_CHARS.arg.whitespace: {
                if (!states.isWritingToTagArgs) {
                    break;
                }

                if (states.isWritingToTagName) {
                    changeState('isWritingToTagName', false);

                    element = createHTMLElement();
                } else {
                    if (states.isWritingToQuotes) {
                        addValue(getWord());
                        clearChars();
                    }
                }

                break;
            }
            case TRIGGER_CHARS.arg.equals: {
                changeKey(getWord().trim());
                clearChars();

                break;
            }
            case TRIGGER_CHARS.arg.quotes: {
                if (!states.isWritingToTagArgs) {
                    break;
                }

                changeState('isWritingToQuotes', !states.isWritingToQuotes);

                if (!states.isWritingToQuotes) {
                    if (hasJustPlacedHolder) {
                        hasJustPlacedHolder = false;
                        element[arg.key] = arg.values[0];
                    } else {
                        addValue(getWord());
                        element[arg.key] = arg.values.join(' ');
                    }

                    clearChars();
                    console.log({ key: arg.key, value: arg.values.join(' ') })
                    clearValues();
                }

                break;
            }
            case TRIGGER_CHARS.placeholder.open: {
                if (hasSinglePlaceHolder) {
                    changeState('isWritingToPlaceholder', true);
                }

                hasSinglePlaceHolder = !hasSinglePlaceHolder;

                break;
            }
            case TRIGGER_CHARS.placeholder.close: {
                if (hasSinglePlaceHolder) {
                    changeState('isWritingToPlaceholder', false);
                    if (states.isWritingToTagArgs) {
                        placeholder = getWord();
                        addValue(data[placeholder]);
                        hasJustPlacedHolder = true;
                    } else {
                        placeholder = getWord();

                        addValue(data[placeholder]);
                    }
                }

                hasSinglePlaceHolder = !hasSinglePlaceHolder;

                break;
            }
            default: {
                chars.push(char);

                break;
            }
        }

        if (hasStateChanged) {
            console.log({
                chars: getWord(), states
            });
            console.dir(element);
            hasStateChanged = false;
            clearChars();
        }

    }

    return element;

    /** 
     * @param {keyof States} key 
     * @param {boolean} state
     */
    function changeState(key, state) {
        states[key] = state;
        hasStateChanged = true;
    }

    function clearChars() {
        chars = [];
    }

    function getWord() {
        return chars.join('');
    }

    /** @param {string} key */
    function changeKey(key) {
        arg.key = key;
    }

    /** @param {any} value */
    function addValue(value) {
        if (!value || value === '') {
            return
        }
        arg.values.push(value);
    }

    function clearValues() {
        arg.values = [];
    }
}

// try html that has '\' inside of it.
export function htmlToElement_modes_old(html = '<div className="red-color container" onclick="{{onClick}}">hello, {{onClick}}</div>') {
    /**
     * @typedef {{ 
     * initial: 'initial',
     * .
     * startReadingPlaceholder: 'startReadingPlaceholder',
     * readingPlaceHolder: 'readingPlaceHolder',
     * endReadingPlaceholder: 'endReadingPlaceholder',
     * .
     * startReadingOpenTag: 'startReadingTag',
     * readingTagName: 'readingTagName',
     * readingTagArgs: 'readingTagArgs',
     * readingTagArgKey: 'readingTagArgKey',
     * readingTagArgAssign: 'readingTagArgAssign',
     * startReadingTagArgValue: 'startReadingTagArgValue',
     * readingTagArgValue: 'readingTagArgValue',
     * endReadingTagArgValue: 'endReadingTagArgValue',
     * endReadingOpenTag: 'endReadingTag',
     * .
     * readingTextContent: 'readingTextContent',
     * .
     * startReadingCloseTag: 'startReadingCloseTag',
     * endReadingCloseTag: 'endReadingCloseTag'
     * }} Modes
     */
    /** @type {Modes} */
    const MODES = {
        initial: 'initial',

        startReadingPlaceholder: 'startReadingPlaceholder',
        readingPlaceHolder: 'readingPlaceHolder',
        endReadingPlaceholder: 'endReadingPlaceholder',

        startReadingOpenTag: 'startReadingOpenTag', // at some point it was 'startReadingTag'
        readingTagName: 'readingTagName',
        readingTagArgs: 'readingTagArgs',
        readingTagArgKey: 'readingTagArgKey',
        readingTagArgAssign: 'readingTagArgAssign',
        startReadingTagArgValue: 'startReadingTagArgValue',
        readingTagArgValue: 'readingTagArgValue',
        endReadingTagArgValue: 'endReadingTagArgValue',
        endReadingOpenTag: 'endReadingOpenTag', // at some point it was 'endReadingTag'

        readingTextContent: 'readingTextContent',

        startReadingCloseTag: 'startReadingCloseTag',
        endReadingCloseTag: 'endReadingCloseTag'
    }

    /**
     * @typedef {{ 
     * isInBeginTag: 'isInBeginTag',
     * isClosingTag: 'isClosingTag',
     * isInPlaceholder: 'isInPlaceHolder',,
     * isClosingPlaceholder: 'isClosingPlaceholder'
     * }} States
     */
    /** @type {{[key in keyof States]: boolean}} */
    const states = {
        isInBeginTag: false,
        isClosingTag: false,
        isInPlaceholder: false,
        isClosingPlaceholder: false
    }

    /** @type {keyof Modes} */
    let currentMode = MODES.initial;

    let data = [];

    for (let char of html) {
        switchMode(char);
        executeMode(currentMode);
    }

    /** @param {string[0]} char*/
    function switchMode(char) {
        switch (char) {
            case TRIGGER_CHARS.TAG.OPEN: {
                if (isStateActive(states.isInBeginTag)) {
                    throwInvalidHTMLError();
                }

                changeMode(MODES.startReadingOpenTag);
                //
                sendData();
                //
                break;
            }
            case TRIGGER_CHARS.TAG.CLOSE_SPAN: {
                if (isModeActive(MODES.startReadingOpenTag)) {
                    changeMode(MODES.startReadingCloseTag);
                    sendData();
                }

                break;
            }
            case TRIGGER_CHARS.TAG.CLOSE: {
                if (isModeActive(MODES.readingTagName) || isModeActive(MODES.endReadingTagArgValue)) {
                    changeMode(
                        isStateActive(states.isClosingTag)
                            ? MODES.endReadingCloseTag
                            : MODES.endReadingOpenTag
                    );
                    sendData();
                }

                break;
            }
            case TRIGGER_CHARS.ARG.WHITESPACE: {
                if (isModeActive(MODES.readingTagName) || isModeActive(MODES.endReadingTagArgValue)) {
                    changeMode(MODES.readingTagArgs);
                    sendData();
                }

                break;
            }
            case TRIGGER_CHARS.ARG.EQUALS: {
                if (isModeActive(MODES.readingTagArgKey)) {
                    changeMode(MODES.readingTagArgAssign);
                    sendData();
                }

                break;
            }
            case TRIGGER_CHARS.ARG.QUOTES: {
                if (isModeActive(MODES.readingTextContent)) {
                    break;
                }

                if (isModeActive(MODES.readingTagArgValue)) {
                    changeMode(MODES.endReadingTagArgValue);
                }

                if (isModeActive(MODES.readingTagArgAssign)) {
                    changeMode(MODES.readingTagArgValue);
                }

                sendData();

                break;
            }
            case TRIGGER_CHARS.PLACEHOLDER.OPEN: {
                if (isModeActive(MODES.startReadingPlaceholder)) {
                    changeMode(MODES.readingPlaceHolder);
                    sendData();
                    break;
                }

                changeMode(MODES.startReadingPlaceholder);

                break;
            }
            case TRIGGER_CHARS.PLACEHOLDER.CLOSE: {
                if (isStateActive(states.isClosingPlaceholder)) {
                    changeMode(MODES.endReadingPlaceholder);
                    sendData();
                    break;
                }

                if (isStateActive(states.isInPlaceholder)) {
                    changeState(states.isClosingPlaceholder, true);
                    changeMode(MODES.endReadingPlaceholder);
                    sendData();
                    break;
                }

                break;
            }
            default: {
                if (isModeActive(MODES.endReadingOpenTag)) {
                    changeMode(MODES.readingTextContent);
                    sendData();

                    break;
                }

                if (isModeActive(MODES.readingTagArgs)) {
                    changeMode(MODES.readingTagArgKey);
                    sendData();
                    break;
                }

                if (isModeActive(MODES.startReadingOpenTag)) {
                    changeMode(MODES.readingTagName);
                    sendData();
                    break;
                }

                break;
            }
        }
        data.push(char)
    }

    /** @param {keyof Modes} mode */
    function executeMode(mode, char) {
        changeState(STATES.isReading, false);
        // To be implemented, TBI, extract mode execution data from 'modeSwitcher' to 'modeExecuter' (here)
        // Maybe move states here (with closure) or just change states here.
        switch (mode) {
            case MODES.initial: {
                changeMode(MODES.startReadingOpenTag);

                break;
            }

            case MODES.startReadingOpenTag: {
                if (isStateActive(STATES.isInBeginTag)) {
                    throwInvalidHTMLError("Invalid html. Tag already open.");
                }

                changeState(STATES.isInBeginTag, true);

                changeMode(MODES.readingTagName);

                break;
            }
            case MODES.readingTagName: {
                // FIND ME, FIX ME, TBI - to be implemented
                // add new states to already existing ones
                // maybe change from 'executeMode' to 'triggerMode' and execute immediately

                // changeState(STATES.isReading, true);
                break;
            }
            case MODES.startReadingCloseTag: {
                if (!isStateActive(STATES.isInBeginTag)) {
                    break;
                }

                changeState(STATES.isClosingTag, true);

                changeMode(MODES.readingTagName);

                break;
            }
            case MODES.endReadingTag: {
                if (!isStateActive(STATES.isInBeginTag)) {
                    break;
                }

                changeState(STATES.isInBeginTag, false);
                if (isStateActive(STATES.isClosingTag)) {
                    changeState(STATES.isInBeginTag, false);
                }


                changeMode(MODES.readingTextContent);

                break;
            }

            case MODES.readingWhitespace: {
                if (!isStateActive(STATES.isInBeginTag) || isStateActive(STATES.isInPlaceholder)) {
                    break;
                }

                changeMode(MODES.readingTagArgs);

                break;
            }
            case MODES.readingTagArgs: {
                changeMode(MODES.readingTagArgKey);

                break;
            }
            case MODES.readingTagArgKey: {
                break;
            }
            case MODES.readingEquals: {
                if (!isStateActive(STATES.isInBeginTag)) {
                    break;
                }

                changeMode(MODES.readingTagArgValue);

                changeState(STATES.isInTagArgValue, true);

                break;
            }
            case MODES.readingTagArgValue: {
                changeState(STATES.isInTagArgValue, true);

                break;
            }
            case MODES.readingQuotes: {
                if (!isStateActive(STATES.isInTagArgValue)) {
                    break;
                }

                changeState(STATES.isInQuotes, !isStateActive(STATES.isInQuotes));

                break;
            }

            case MODES.readingTextContent: {
                break;
            }

            case MODES.startReadingPlaceholder: {
                if (isStateActive(STATES.isInPlaceholder)) {
                    prevMode = currentMode;
                    changeMode(MODES.readingPlaceHolder);
                } else {
                    changeState(STATES.isInPlaceholder, true);
                }

                break;
            }
            case MODES.readingPlaceHolder: {
                break;
            }
            case MODES.endReadingPlaceholder: {
                if (!isStateActive(STATES.isInPlaceholder)) {
                    break;
                }

                if (isStateActive(STATES.isClosingPlaceholder)) {
                    changeMode(prevMode);
                } else {
                    changeState(STATES.isClosingPlaceholder, true);
                }

                break;
            }
            case MODES.readingChar: {
                if (!isStateActive(STATES.isReading)) {
                    changeState(STATES.isReading, true);
                }
                data.push(char);
                break;
            }
        }

        if (!isStateActive(STATES.isReading)) {
            sendData();
        }
    }


    function sendData() {
        console.log(data.join(''));
        data = [];
    }

    /** @param {keyof States} state */
    function isStateActive(state) {
        return states[/** @type {keyof States} */ (state)];
    }

    /** 
     * @param {keyof States} state
     * @param {boolean} value
     *  */
    function changeState(state, value) {
        states[/** @type {keyof States} */ (state)] = (value);
    }

    function getCurrentMode() {
        return currentMode;
    }

    /** @param {keyof Modes} mode */
    function changeMode(mode) {
        currentMode = /** @type {keyof Modes} */ (mode);
    }

    /** @param {keyof Modes} mode */
    function isModeActive(mode) {
        return currentMode === mode;
    }
}

export function htmlToElement_keyValue_firstPart(html = '<div className="red-color container" onclick="{{onClick}}">hello, {{onClick}}</div>') {
    /**
     * @typedef {{ 
     * initial: 'initial',
     * .
     * startReadingPlaceholder: 'startReadingPlaceholder',
     * readingPlaceHolder: 'readingPlaceHolder',
     * endReadingPlaceholder: 'endReadingPlaceholder',
     * .
     * startReadingOpenTag: 'startReadingOpenTag',
     * startReadingCloseTag: 'startReadingCloseTag',
     * endReadingTag: 'endReadingTag',
     * .
     * readingTagName: 'readingTagName',
     * readingTagArgs: 'readingTagArgs',
     * readingTagArgKey: 'readingTagArgKey',
     * readingTagArgAssign: 'readingTagArgAssign',
     * startReadingTagArgValue: 'startReadingTagArgValue',
     * readingTagArgValue: 'readingTagArgValue',
     * endReadingTagArgValue: 'endReadingTagArgValue',
     * .
     * readingTextContent: 'readingTextContent',
     * .
     * readingWhitespace: 'readingWhitespace',
     * readingEquals: 'readingEquals',
     * readingQuotes: 'readingQuotes',
     * .
     * readingChar: 'readingChar',
     * }} Modes
     */
    /** @type {Modes} */
    const MODES = {
        initial: 'initial',

        startReadingPlaceholder: 'startReadingPlaceholder',
        readingPlaceHolder: 'readingPlaceHolder',
        endReadingPlaceholder: 'endReadingPlaceholder',

        startReadingOpenTag: 'startReadingOpenTag',
        startReadingCloseTag: 'startReadingCloseTag',
        endReadingTag: 'endReadingTag',

        readingTagName: 'readingTagName',
        readingTagArgs: 'readingTagArgs',
        readingTagArgKey: 'readingTagArgKey',
        readingTagArgAssign: 'readingTagArgAssign',
        startReadingTagArgValue: 'startReadingTagArgValue',
        readingTagArgValue: 'readingTagArgValue',
        endReadingTagArgValue: 'endReadingTagArgValue',

        readingTextContent: 'readingTextContent',

        readingWhitespace: 'readingWhitespace',
        readingEquals: 'readingEquals',
        readingQuotes: 'readingQuotes',

        readingChar: 'readingChar',
    }

    /**
     * @typedef {{ 
     * isInBeginTag: 'isInBeginTag',
     * isInTagArgValue: 'isInTagArgValue',
     * isClosingTag: 'isClosingTag',
     * isInQuotes: 'isInQuotes',
     * isInPlaceholder: 'isInPlaceHolder',
     * isClosingPlaceholder: 'isClosingPlaceholder',
     * isReading: 'isReading',
     * }} States
     */
    /** @type {States} */
    const STATES = {
        isInBeginTag: 'isInBeginTag',
        isInTagArgValue: 'isInTagArgValue',
        isClosingTag: 'isClosingTag',
        isInQuotes: 'isInQuotes',
        isInPlaceholder: 'isInPlaceHolder',
        isClosingPlaceholder: 'isClosingPlaceholder',
        isReading: 'isReading',
    }
    /** @type {{[key in keyof States]: boolean}} */
    const states = {
        isInBeginTag: false,
        isInTagArgValue: false,
        isClosingTag: false,
        isInQuotes: false,
        isInPlaceholder: false,
        isClosingPlaceholder: false,
        isReading: false,
    }

    /**
     * @typedef {{[key in TriggerChars[keyof TriggerChars]]: keyof Modes }} ModeTriggers
     */
    /** @type {ModeTriggers} */
    const MODE_TRIGGERS = {
        [TRIGGER_CHARS.tagOpen]: MODES.startReadingOpenTag,
        [TRIGGER_CHARS.tagCloseSpan]: MODES.startReadingCloseTag,
        [TRIGGER_CHARS.tagClose]: MODES.endReadingTag,
        [TRIGGER_CHARS.argEquals]: MODES.readingEquals,
        [TRIGGER_CHARS.argQuotes]: MODES.readingQuotes,
        [TRIGGER_CHARS.argWhitespace]: MODES.readingWhitespace,
        [TRIGGER_CHARS.placeholderOpen]: MODES.startReadingPlaceholder,
        [TRIGGER_CHARS.placeholderClose]: MODES.endReadingPlaceholder
    }

    /** @type {{[key in keyof Modes]: Function}} */
    const modeActions = {
        [MODES.initial]: () => {
            clearData();
        },
        [MODES.startReadingOpenTag]: () => {
            if (isStateActive(STATES.isInBeginTag)) {
                throwInvalidHTMLError("Invalid html. Tag already open.");
            }

            clearData();

            changeState(STATES.isInBeginTag, true);

            changeMode(MODES.readingTagName);
        },
        [MODES.readingTagName]: () => {
            changeMode(MODES.readingChar);
        },
        [MODES.startReadingCloseTag]: () => {
            if (!isStateActive(STATES.isInBeginTag)) {
                return;
            }

            clearData();

            changeState(STATES.isClosingTag, true);

            changeMode(MODES.readingTagName);
        },
        [MODES.endReadingTag]: () => {
            if (!isStateActive(STATES.isInBeginTag)) {
                return;
            }

            logData();

            changeState(STATES.isInBeginTag, false);
            if (!isStateActive(STATES.isClosingTag)) {
                changeMode(MODES.readingTextContent);
            }
        },
        [MODES.readingWhitespace]: () => {
            if (!isStateActive(STATES.isInBeginTag) || isStateActive(STATES.isInPlaceholder)) {
                return;
            }

            if (!isStateActive(STATES.isInQuotes)) {
                logData();
                clearData();
            } else {
                addToData(char);
            }

            changeMode(MODES.readingTagArgs);
        },
        [MODES.readingTagArgs]: () => {
            clearData();

            changeMode(MODES.readingTagArgKey);
        },
        [MODES.readingTagArgKey]: () => {
            changeMode(MODES.readingChar);
        },
        [MODES.readingEquals]: () => {
            if (!isStateActive(STATES.isInBeginTag)) {
                return;
            }

            logData();
            clearData();

            changeState(STATES.isInTagArgValue, true);
            changeMode(MODES.readingTagArgValue);
        },
        [MODES.readingTagArgValue]: () => {
            changeMode(MODES.readingChar);
        },
        [MODES.readingQuotes]: () => {
            if (!isStateActive(STATES.isInTagArgValue)) {
                return;
            }

            let isInQuotes = isStateActive(STATES.isInQuotes);

            changeState(STATES.isInQuotes, !isInQuotes);
            if (isInQuotes) {
                logData();
            } else {
                clearData();
            }
        },
        [MODES.readingTextContent]: () => {
            changeMode(MODES.readingChar);
        },
        [MODES.startReadingPlaceholder]: () => {
            if (isStateActive(STATES.isInPlaceholder)) {
                prevMode = currentMode;
                clearData();
                changeMode(MODES.readingPlaceHolder);
            } else {
                changeState(STATES.isInPlaceholder, true);
            }
        },
        [MODES.readingPlaceHolder]: () => {
            changeMode(MODES.readingChar);
        },
        [MODES.endReadingPlaceholder]: () => {
            if (!isStateActive(STATES.isInPlaceholder)) {
                return;
            }

            if (isStateActive(STATES.isClosingPlaceholder)) {
                logData()
                changeMode(prevMode);
            } else {
                changeState(STATES.isClosingPlaceholder, true);
            }
        },
        [MODES.readingChar]: () => {
            addToData(char);
        },
    }

    /** @type {keyof Modes} */
    let currentMode = MODES.initial;
    /** @type {keyof Modes} */
    let prevMode = currentMode;

    let data = '';
    let shouldHandleData = false;
    let char = '';

    for (char of html) {
        console.log(JSON.stringify({ char, mode: MODE_TRIGGERS[char] }));
        changeMode(MODE_TRIGGERS[char] || MODES.readingChar);
        triggerMode();
        // if(shouldHandleData){
        //     handleData();
        // }
    }

    function triggerMode() {
        return modeActions[currentMode]();
    }

    /** @param {string[0]} char */
    function addToData(char) {
        data.push(char[0]);
    }

    function clearData() {
        data = [];
    }

    function getData() {
        return data.join('');
    }

    function logData() {
        console.log(getData());
    }

    // /** @param {boolean} shouldClearData */
    // function setShouldHandleDataTrue(shouldClearData) {
    //     shouldHandleData = true;
    //     if(shouldClearData){
    //         clearData();
    //     }
    // }

    // function handleData(){

    // }

    /** @param {keyof States} state */
    function isStateActive(state) {
        return states[/** @type {keyof States} */ (state)];
    }

    /** 
     * @param {keyof States} state
     * @param {boolean} value
     *  */
    function changeState(state, value) {
        states[/** @type {keyof States} */ (state)] = (value);
    }

    function getCurrentMode() {
        return currentMode;
    }

    /** @param {keyof Modes} mode */
    function changeMode(mode) {
        currentMode = /** @type {keyof Modes} */ (mode);
    }

    /** @param {keyof Modes} mode */
    function isModeActive(mode) {
        return currentMode === mode;
    }
}

export function htmlToElement_statesHandler(html = '<div className="red-color container" onclick="{{onClick}}">hello, {{onClick}}</div>') {
    /**
     * @typedef {{ 
     * isInBeginTag: boolean,
     * isInEndTag: boolean,
     * .
     * isTagName: boolean,
     * isWhitespace: boolean,
     * isInTagAttrs: boolean,
     * .
     * isTagAttrKey: boolean,
     * isTagArgAssign: boolean,
     * isInTagAttrValue: boolean,
     * .
     * isOpenPlaceholderTag: boolean,
     * isInPlaceholder: boolean,
     * isClosePlaceholderTag: boolean,
     * .
     * skipCharRead: boolean,
     * }} States
     */
    const states = {
        isInBeginTag: false,
        isInEndTag: false,

        isTagName: false,
        isWhitespace: false,
        isInTagAttrs: false,

        isTagAttrKey: false,
        isTagArgAssign: false,
        isInTagAttrValue: false,

        isOpenPlaceholderTag: false,
        isInPlaceholder: false,
        isClosePlaceholderTag: false,

        skipCharRead: false,
    };

    const datas = {
        tagName: undefined,
        tagAttrKey: undefined,
        tagAttrValue: undefined,
        placeholder: undefined,
        textContent: undefined
    }

    const actions = {
        '<': () => {
            if (isStateActive("isInBeginTag")) {
                throwInvalidHTMLError("Cannot open another tag before closing previous one.");
            }

            activateState("isInBeginTag");
            activateState("skipCharRead");
        },
        '/': () => {
            if (isStateActive("isInBeginTag")) {
                activateState("isInEndTag");
                activateState("skipCharRead");
            }
        },
        '>': () => {
            if (isStateActive("isInBeginTag")) {
                deactivateState('isInBeginTag');
                deactivateState('isInEndTag');

                if (isStateActive("isInTagAttrs")) {
                    deactivateState("isInTagAttrs");
                } else if (isStateActive("isTagName")) {
                    deactivateState("isTagName");
                }


                activateState("skipCharRead");
            }
        },
        ' ': () => {
            activateState("isWhitespace");
            if (isStateActive("isInBeginTag")) {
                if (isStateActive("isInTagAttrs") && !isStateActive("isInPlaceholder")) {
                    // if(isStateActive("isTagAttrKey")){
                    //     deactivateState("isTagAttrKey");
                    // }
                    // if(!isStateActive("isInTagAttrValue")){
                    //     activateState("isTagAttrKey")
                    // }

                    if (!isStateActive("isInTagAttrValue")) {
                        activateState("skipCharRead", true);
                    }

                } else {
                    if (isStateActive("isTagName")) {
                        deactivateState("isTagName");
                        activateState("skipCharRead", true);
                    }
                    activateState("isInTagAttrs");
                }
            }
        },
        '=': () => {
            if (isStateActive("isInTagAttrs") && !isStateActive("isInPlaceholder")) {
                if (isStateActive("isTagAttrKey")) {
                    deactivateState("isTagAttrKey");
                }
                if (isStateActive("isInTagAttrValue")) {
                    deactivateState("isInTagAttrValue");
                }
                activateState("isTagArgAssign");
                activateState("skipCharRead", true);
            }
        },
        '"': () => {
            if (isStateActive("isInTagAttrs") && !isStateActive("isInPlaceholder")) {
                if (!isStateActive("isInTagAttrValue")) {
                    if (isStateActive("isTagArgAssign")) {
                        deactivateState("isTagArgAssign");
                    }

                    activateState("isInTagAttrValue");
                } else {
                    deactivateState("isInTagAttrValue");
                }

                activateState("skipCharRead", true);
            }
        },
        '{': () => {

            if (isStateActive("isOpenPlaceholderTag")) {
                if (isStateActive("isInPlaceholder")) {
                    throwInvalidHTMLError("Cannot open new placeholder while in placeholder.")
                }

                if (isStateActive("isInTagAttrs")) {
                    // add to element listener
                } else {
                    // just change value
                }

                deactivateState("isOpenPlaceholderTag");
                activateState("isInPlaceholder");
                activateState("skipCharRead");
            } else {
                activateState("isOpenPlaceholderTag");
            }
        },
        '}': () => {
            if (isStateActive("isClosePlaceholderTag")) {
                if (isStateActive("isInTagAttrs")) {
                    // add to element listener
                } else {
                    // just change value
                }

                deactivateState("isClosePlaceholderTag");
                deactivateState("isInPlaceholder");
                activateState("skipCharRead");
            } else {
                activateState("isClosePlaceholderTag");
            }
        }
    }

    /** @type {string[0]} */
    let char;

    /** @type {keyof datas} */
    let dataKey;
    /** @type {string[]} */
    let dataValue = [];
    let prevDataKey;

    processHtml();
    console.log(datas);

    function processHtml() {
        for (char of html) {
            if (isCharTrigger(char)) {
                triggerStates(char);
            } else {
                // if(isStateActive(""))
            }

            handleStates();
            updateDataKeyPointer();

            let skipCharRead = isStateActive("skipCharRead");
            if (!skipCharRead) {
                dataValue.push(char);
            }

            console.log({ char, dataKey, dataValue: dataValue.join(''), datas: { ...datas }, states: Object.entries(states).filter(([key, val]) => val).map(([key, val]) => key) });

            if (skipCharRead) {
                deactivateState("skipCharRead");
            }

            if (isStateActive("isWhitespace")) {
                deactivateState("isWhitespace");
            }
        }
    }

    function handleStates() {
        if (isStateActive("isInBeginTag")) {
            if (isStateActive("isInTagAttrs")) {
                if (isStateActive("isWhitespace")) {
                    // if(!isStateActive("isInTagAttrValue")){
                    //     activateState("isTagAttrKey");
                    // }
                    if (!isStateActive("isTagAttrKey") && !isStateActive("isTagArgAssign") && !isStateActive("isInTagAttrValue")) {
                        activateState("isTagAttrKey");
                    }
                }


            } else {
                activateState("isTagName");
            }
        }
    }

    /** @param {string[0]} char */
    function triggerStates(char) {
        actions[char]();

    }

    /** @param {string[0]} char */
    function isCharTrigger(char) {
        return actions.hasOwnProperty(char[0]);
    }

    function updateDataKeyPointer() {
        if (isStateActive("isInPlaceholder")) {
            dataKey = "placeholder";
        } else {
            if (isStateActive("isInBeginTag")) {
                if (isStateActive("isInTagAttrs")) {
                    if (isStateActive("isInTagAttrValue")) {
                        dataKey = "tagAttrValue";
                    } else if (isStateActive("isTagAttrKey")) {
                        dataKey = "tagAttrKey";
                    }
                } else if (isStateActive("isTagName")) {
                    dataKey = "tagName";
                }
            } else {
                dataKey = "textContent";
            }
        }


        if (!dataKey || !dataValue.length) {
            return;
        }

        if (dataKey !== prevDataKey) {
            prevDataKey = dataKey;
            if (dataKey === "placeholder") {
                let popped = dataValue.pop();
                datas[dataKey] = dataValue.join('');
                dataValue = [popped];
            }
            datas[dataKey] = dataValue.join('');
            dataValue = [];
        }
    }

    /** @param {keyof states} state */
    function isStateActive(state) {
        return states[state];
    }

    /** @param {keyof states} state */
    function activateState(state) {
        states[state] = true;
    }

    /** @param {keyof states} state */
    function deactivateState(state) {
        states[state] = false;
    }
}

export function htmlToElement_almostSuccess(html = '<div className="red-color container" onclick="{{onClick}}">hello, {{onClick}}</div>') {
    /**
     * @typedef {{ 
     * isInBeginTag: boolean,
     * isInEndTag: boolean,
     * .
     * isInTagAttrs: boolean,
     * isInTextContent: boolean,
     * .
     * isTagAttrsSeparator: boolean,
     * isTagArgAssign: boolean,
     * isTagValueQuotes: boolean,
     * .
     * isTagName: boolean,
     * isTagAttrKey: boolean,
     * isInTagAttrValue: boolean,
     * .
     * isInPlaceholder: boolean,
     * isOpenPlaceholderTag: boolean,
     * isClosePlaceholderTag: boolean,
     * .
     * isReadingChar: boolean,
     * }} States
     */
    /** @type {States} */
    let states = {
        isInBeginTag: false,
        isInEndTag: false,

        isInTagAttrs: false,
        isInTextContent: false,

        isTagAttrsSeparator: false,
        isTagArgAssign: false,

        isTagName: false,
        isTagAttrKey: false,
        isInTagAttrValue: false,

        isInPlaceholder: false,
        isOpenPlaceholderTag: false,
        isClosePlaceholderTag: false,

        isReadingChar: false,
    }

    let hasStateChanged = true;

    /** 
     * @typedef {{
     * isOpenTag: 'isOpenTag',
     * isCloseTag: 'isCloseTag',
     * .
     * isSlash: 'isSlash',
     * isDoubleQuotes: 'isDoubleQuotes',
     * isWhitespace: 'isWhitespace',
     * isEquals: 'isEquals',
     * .
     * isOpenCurlyBracket: 'isOpenCurlyBracket',
     * isCloseCurlyBracket: 'isCloseCurlyBracket',
     * .
     * isNonSpecial: 'isNonSpecial',
     * }} CharSpecialTypes
     * */

    const charSpecialTypes = {
        '<': "isOpenTag",
        '>': "isCloseTag",
        '/': "isSlash",
        '"': "isDoubleQuotes",
        ' ': "isWhitespace",
        '=': "isEquals",
        '{': "isOpenCurlyBracket",
        '}': "isCloseCurlyBracket",
    }

    /**
     * @typedef {{ 
     * tagName: string | undefined,
     * tagAttrKey: string | undefined,
     * tagAttrValue: string | undefined,
     * placeholder: string | undefined,
     * textContent: string | undefined
     * }} Datas
     */
    /** @type {Datas} */
    const datas = {
        tagName: undefined,
        tagAttrKey: undefined,
        tagAttrValue: undefined,
        placeholder: undefined,
        textContent: undefined
    }

    const actions = {
        '<': () => {
            activateState("isInBeginTag");
        },
        '/': () => {
            if (isStateActive("isInBeginTag")) {
                activateState("isInEndTag");
                activateState("skipCharRead");
            }
        },
        '>': () => {
            if (isStateActive("isInBeginTag")) {
                deactivateState('isInBeginTag');
                deactivateState('isInEndTag');

                if (isStateActive("isInTagAttrs")) {
                    deactivateState("isInTagAttrs");
                } else if (isStateActive("isTagName")) {
                    deactivateState("isTagName");
                }


                activateState("skipCharRead");
            }
        },
        ' ': () => {
            activateState("isWhitespace");
            if (isStateActive("isInBeginTag")) {
                if (isStateActive("isInTagAttrs") && !isStateActive("isInPlaceholder")) {
                    // if(isStateActive("isTagAttrKey")){
                    //     deactivateState("isTagAttrKey");
                    // }
                    // if(!isStateActive("isInTagAttrValue")){
                    //     activateState("isTagAttrKey")
                    // }

                    if (!isStateActive("isInTagAttrValue")) {
                        activateState("skipCharRead", true);
                    }

                } else {
                    if (isStateActive("isTagName")) {
                        deactivateState("isTagName");
                        activateState("skipCharRead", true);
                    }
                    activateState("isInTagAttrs");
                }
            }
        },
        '=': () => {
            if (isStateActive("isInTagAttrs") && !isStateActive("isInPlaceholder")) {
                if (isStateActive("isTagAttrKey")) {
                    deactivateState("isTagAttrKey");
                }
                if (isStateActive("isInTagAttrValue")) {
                    deactivateState("isInTagAttrValue");
                }
                activateState("isTagArgAssign");
                activateState("skipCharRead", true);
            }
        },
        '"': () => {
            if (isStateActive("isInTagAttrs") && !isStateActive("isInPlaceholder")) {
                if (isStateActive("isTagValueQuotes")) {
                    deactivateState("isTagValueQuotes");
                } else {
                    activateState("isTagValueQuotes");
                }
                activateState("skipCharRead", true);
            }
        },
        '{': () => {

            if (isStateActive("isOpenPlaceholderTag")) {
                if (isStateActive("isInPlaceholder")) {
                    throwInvalidHTMLError("Cannot open new placeholder while in placeholder.")
                }

                if (isStateActive("isInTagAttrs")) {
                    // add to element listener
                } else {
                    // just change value
                }

                deactivateState("isOpenPlaceholderTag");
                activateState("isInPlaceholder");
                activateState("skipCharRead");
            } else {
                activateState("isOpenPlaceholderTag");
            }
        },
        '}': () => {
            if (isStateActive("isClosePlaceholderTag")) {
                if (isStateActive("isInTagAttrs")) {
                    // add to element listener
                } else {
                    // just change value
                }

                deactivateState("isClosePlaceholderTag");
                deactivateState("isInPlaceholder");
                activateState("skipCharRead");
            } else {
                activateState("isClosePlaceholderTag");
            }
        }
    }

    /** @type {string[0]} */
    let char = undefined;
    /** @type {keyof CharSpecialTypes} */
    let charSpecialType = undefined;

    /** @type {keyof Datas} */
    let dataKey = undefined;
    /** @type {keyof Datas | undefined} */
    let prevDataKey = undefined;
    /** @type {string[]} */
    let dataValue = [];

    processHtml();
    console.log(datas);

    function processHtml() {
        for (let char of html) {
            //handleStates();
            updateChar(char);
            updateCharType();

            updateStates();

            // if (hasStateChanged) {
            updateDataKeyPointer();
            handleData();
            // }
            writeChar(char);
            console.log(JSON.stringify({ char, charSpecialType, dataKey, states: Object.entries(states).filter(x => x[1]).map(x => x[0] + ": " + x[1]) }, null, 2));
        }
    }

    function updateStates() {
        // hasStateChanged = true;
        // debugger
        switch (charSpecialType) {
            case "isNonSpecial": {
                // hasStateChanged = false;

                activateState("isReadingChar");

                if (isStateActive("isInBeginTag")) {
                    if (!isStateActive("isInTagAttrs")) {
                        activateState("isInTagAttrs");
                        activateState("isTagName");
                        // hasStateChanged = true;
                    }
                } else {
                    activateState("isInTextContent");
                }

                if (isStateActive("isTagAttrsSeparator")) {
                    if (!isStateActive("isInTagAttrValue")) {
                        activateState("isTagAttrKey");
                    }
                    deactivateState("isTagAttrsSeparator");
                }

                if (isStateActive("isTagValueQuotes")) {
                    activateState("isInTagAttrValue");
                    deactivateState("isTagValueQuotes");
                }

                if (isStateActive("isOpenPlaceholderTag")) {
                    deactivateState("isOpenPlaceholderTag");
                }

                if (isStateActive("isClosePlaceholderTag")) {
                    deactivateState("isClosePlaceholderTag");
                }

                break;
            }
            case "isOpenTag": {
                if (isStateActive("isInBeginTag")) {
                    throwInvalidHTMLError("Tag is already in tag. Cannot open a tag while in another opened tag.");
                }

                deactivateState("isInTextContent");

                activateState("isInBeginTag");

                deactivateState("isReadingChar");

                break;
            }
            case "isCloseTag": {
                if (isStateActive("isInBeginTag")) {
                    deactivateState("isInBeginTag");
                    if (isStateActive("isInEndTag")) {
                        deactivateState("isInEndTag");
                    }
                    deactivateState("isInTagAttrs");
                    if (isStateActive("isTagName")) {
                        deactivateState("isTagName");
                    }

                    if (isStateActive("isTagValueQuotes")) {
                        deactivateState("isTagValueQuotes");
                    }

                    deactivateState("isReadingChar");
                } else {
                    activateState("isReadingChar");
                }

                break;
            }
            case "isSlash": {
                if (isStateActive("isInBeginTag")) {
                    // maybe check if 'isInTagAttrs'
                    activateState("isInEndTag");
                    deactivateState("isReadingChar");
                } else {
                    activateState("isReadingChar");
                }

                break;
            }
            case "isWhitespace": {
                if (isStateActive("isInBeginTag")) {
                    if (isStateActive("isTagName")) {
                        deactivateState("isTagName");
                        deactivateState("isReadingChar");
                    }

                    if (isStateActive("isTagValueQuotes")) {
                        deactivateState("isTagValueQuotes");
                    }

                    if (isStateActive("isInTagAttrValue")) {
                        activateState("isReadingChar");
                    } else {
                        activateState("isTagAttrsSeparator");
                    }
                } else {
                    activateState("isReadingChar");
                }

                break;
            }
            case "isEquals": {
                if (isStateActive("isInBeginTag")) {
                    if (isStateActive("isInTagAttrs")) {
                        if (isStateActive("isTagAttrKey")) {
                            deactivateState("isTagAttrKey");
                            activateState("isTagArgAssign");
                            deactivateState("isReadingChar");
                        }
                    }
                } else {
                    activateState("isReadingChar");
                }

                break;
            }
            case "isDoubleQuotes": {
                if (isStateActive("isInBeginTag")) {
                    if (isStateActive("isInTagAttrs")) {
                        activateState("isTagValueQuotes");

                        if (isStateActive("isInTagAttrValue")) {
                            deactivateState("isInTagAttrValue");
                        }

                        if (isStateActive("isTagArgAssign")) {
                            deactivateState("isTagArgAssign");
                        }

                        deactivateState("isReadingChar");
                    }
                } else {
                    activateState("isReadingChar");
                }

                break;
            }
            case "isOpenCurlyBracket": {
                if (isStateActive("isTagValueQuotes")) {
                    deactivateState("isTagValueQuotes");
                }

                if (isStateActive("isOpenPlaceholderTag")) {
                    deactivateState("isOpenPlaceholderTag");
                    activateState("isInPlaceholder");
                    deactivateState("isReadingChar");
                    // pop last two chars in dataValue
                } else {
                    activateState("isOpenPlaceholderTag");
                    activateState("isReadingChar");
                }

                break;
            }
            case "isCloseCurlyBracket": {
                activateState("isReadingChar");

                if (isStateActive("isClosePlaceholderTag")) {
                    deactivateState("isClosePlaceholderTag");
                    deactivateState("isInPlaceholder");
                    deactivateState("isReadingChar");
                    // pop last two chars in dataValue
                } else {
                    activateState("isClosePlaceholderTag");
                    activateState("isReadingChar");
                }

                break;
            }
        }
    }

    function updateDataKeyPointer() {
        dataKey = undefined;

        if (isStateActive("isInPlaceholder")) {
            dataKey = "placeholder";
        } else {
            if (isStateActive("isInBeginTag")) {
                if (isStateActive("isInTagAttrs")) {
                    if (isStateActive("isTagName")) {
                        dataKey = "tagName";
                    } else if (isStateActive("isInTagAttrValue")) {
                        dataKey = "tagAttrValue";
                    } else if (isStateActive("isTagAttrKey")) {
                        dataKey = "tagAttrKey";
                    }
                }
            } else {
                dataKey = "textContent";
            }
        }
    }

    /** @param {string[0]} char */
    function writeChar(char) {
        if (isStateActive("isReadingChar")) {
            dataValue.push(char[0]);
        }
    }

    function handleData() {
        if (dataKey === prevDataKey) {
            return;
        }

        if (datas['tagAttrKey'] === 'onclick{') {
            // debugger
        }

        if (dataKey === "placeholder") {
            dataValue.pop();
            // datas[prevDataKey] = datas[prevDataKey]?.slice(0, -1);
        }

        if (prevDataKey === 'placeholder') {
            dataValue.pop();
        }

        if (isStateActive("isClosePlaceholderTag")) {
            dataValue.pop();
        }

        if (dataKey === undefined) {
            return;
        }

        if (prevDataKey !== undefined) {
            datas[prevDataKey] = dataValue.join('');
            console.warn(`datas[${prevDataKey}] = ${datas[prevDataKey]}`)
        }



        prevDataKey = dataKey;
        dataValue = [];

        // if (dataKey !== prevDataKey) {
        //     if (dataKey === "placeholder") {
        //         datas[dataKey] = datas[prevDataKey]?.slice(0, -1) || undefined;
        //     }

        //     console.warn(`datas[${prevDataKey}] = ${dataValue.join('')}`)
        //     datas[prevDataKey] = dataValue.join('');
        //     prevDataKey = dataKey;

        //     dataValue = [];
        // }
    }

    /** @param {string[0]} char */
    function triggerStates(char) {
        actions[char]();

    }

    /** @param {string[0]} char */
    function isCharTrigger(char) {
        return actions.hasOwnProperty(char[0]);
    }
    /** @param {keyof States} state */
    function isStateActive(state) {
        return states[state];
    }

    /** @param {keyof States} state */
    function activateState(state) {
        states[state] = true;
    }

    /** @param {keyof States} state */
    function deactivateState(state) {
        states[state] = false;
    }

    function updateChar(ch) {
        char = ch[0];
    }

    function updateCharType() {
        charSpecialType = charSpecialTypes[char[0]] || "isNonSpecial";
    }
}

// TODO:
// replace placeholders
// proccess nested html
// proccess nested html and replace placeholders (funcs and strings)

// <div className="red-color container" onclick="{{onClick}}">hello, {{addToMessage}}</div>
export function htmlToElement(html = '<div style="color: red;align-content: center" className="red-color container" onclick="{{onClick}}"></div>') {
    /**
     * @typedef {{ 
     * isOpenTag: boolean,
     * isTagCloser: boolean,
     * shouldClearDatas: boolean,
     * isCloseTag: boolean,
     * .
     * isInTag: boolean,
     * isInBeginTag: boolean,
     * isInEndTag: boolean,
     * .
     * isInTagAttrs: boolean,
     * isInTextContent: boolean,
     * .
     * isTagAttrsSeparator: boolean,
     * isTagArgAssign: boolean,
     * isTagValueQuotes: boolean,
     * .
     * isTagName: boolean,
     * isTagAttrKey: boolean,
     * isInTagAttrValue: boolean,
     * .
     * isReadingChar: boolean,
     * isHtmlReady: boolean,
     * }} States
     */
    /** @type {States} */
    let states = {
        isOpenTag: false,
        isTagCloser: false,
        shouldClearDatas: true,
        isCloseTag: false,

        isInTag: false,
        isInBeginTag: false,
        isInEndTag: false,

        isInTagAttrs: false,
        isInTextContent: false,

        isTagAttrsSeparator: false,
        isTagArgAssign: false,

        isTagName: false,
        isTagAttrKey: false,
        isInTagAttrValue: false,

        isReadingChar: false,
        isHtmlReady: false
    }

    const specialChars = ['<', '>', '/', '"', ' ', '='];

    /**
     * @typedef {{ 
     * tagName: string | undefined,
     * tagAttrKeyValuePair: {[key: string]: any},
     * tagAttrKey: string | undefined,
     * tagAttrValue: string | undefined,
     * textContent: string | undefined
     * }} Datas
     */
    /** @type {Datas} */
    const datas = {
        tagName: undefined,
        tagAttrKeyValuePair: {},
        tagAttrKey: undefined,
        tagAttrValue: undefined,
        textContent: undefined
    }

    /** @type {string[0]} */
    let char = undefined;

    /** @type {keyof Datas} */
    let dataKey = undefined;
    /** @type {keyof Datas | undefined} */
    let prevDataKey = undefined;
    /** @type {string[]} */
    let dataValue = [];

    processHtml();
    console.log(datas);

    function processHtml() {
        for (let char of html) {
            updateChar(char);

            updateStates();
            handleStates();

            updateDataKeyPointer();
            handleData();
            console.log(JSON.stringify({ char, dataKey, states: Object.entries(states).filter(x => x[1]).map(x => x[0] + ": " + x[1]), datas }, null, 2),);
            console.log(dataValue);
        }
    }

    function updateStates() {
        switch (char) {
            case "<": {
                if (isStateActive("isInTag") || isStateActive("isOpenTag")) {
                    throwInvalidHTMLError("Tag is already in tag. Cannot open a tag while in another opened tag.");
                }

                activateState("isOpenTag");
                deactivateReadingCharState();

                break;
            }
            case ">": {
                if (isStateActive("isInTag")) {
                    activateState("isCloseTag");
                    deactivateReadingCharState();
                }
                
                break;
            }
            case "/": {
                if (isStateActive("isOpenTag")) {
                    activateState("isTagCloser");
                    deactivateReadingCharState();
                }

                break;
            }
            case " ": {
                if (isStateActive("isInBeginTag")) {
                    if (!isStateActive("isInTagAttrValue")) {
                        activateState("isTagAttrsSeparator");
                        deactivateReadingCharState();
                    }
                }

                break;
            }
            case "=": {
                if (isStateActive("isInTagAttrs")) {
                    if (isStateActive("isTagAttrKey")) {
                        activateState("isTagArgAssign");
                        deactivateReadingCharState();
                    }
                }

                break;
            }
            case "\"": {
                if (isStateActive("isInTagAttrs")) {
                    activateState("isTagValueQuotes");
                    deactivateReadingCharState();
                }

                break;
            }
            default: {
                activateState("isReadingChar");

                break;
            }
        }
    }

    function deactivateReadingCharState() {
        deactivateState("isReadingChar");
    }

    function handleStates() {
        if (isStateActive("isReadingChar")) {
            
            if(isStateActive("isTagCloser")){
                deactivateState("isTagCloser");

                activateState("isInTag");
                activateState("isInEndTag");
                activateState("isTagName");
                return;
            }

            if(isStateActive("isCloseTag")){
                deactivateState("isCloseTag");
                
                activateState("isInTextContent");
                return;
            }

            if(isStateActive("isOpenTag")){
                if(isStateActive("isInTextContent")){
                    deactivateState("isInTextContent");
                }

                deactivateState("isOpenTag");

                activateState("isInTag");
                activateState("isInBeginTag");
                activateState("isTagName");
                return;
            }

            if (isStateActive("isTagAttrsSeparator")) {
                deactivateState("isTagAttrsSeparator");

                if(!isStateActive("isInTagAttrs")){
                    activateState("isInTagAttrs");
                }

                activateState("isTagAttrKey");
                return;
            }

            if (isStateActive("isTagValueQuotes")) {
                deactivateState("isTagValueQuotes");
                activateState("isInTagAttrValue");
                return;
            }
        } else {
            activateState("isReadingChar");
        }


        if (isStateActive("isHtmlReady")) {
            console.dir(createHTMLElement());
            deactivateState("isHtmlReady");
            return;
        }

        if(isStateActive("isTagCloser")){
            if(isStateActive("isOpenTag")){
                deactivateState("isOpenTag")
                deactivateState("shouldClearDatas");
            }

            deactivateReadingCharState();
            return;
        }

        if (isStateActive("isOpenTag")) {
            if (isStateActive("shouldClearDatas")) {
                clearDatas();
                deactivateState("shouldClearDatas");
            } else {
                activateState("shouldClearDatas");
            }

            if (isStateActive("isInTextContent")) {
                deactivateState("isInTextContent");
            }

            if(isStateActive("isCloseTag")){
                deactivateState("isCloseTag");
            }

            deactivateReadingCharState();
            return;
        }

        if (isStateActive("isCloseTag")) {
            if (isStateActive("isInBeginTag")) {
                deactivateState("isInBeginTag");

                if (isStateActive("isInTagAttrs")) {
                    deactivateState("isInTagAttrs");
                }

                if (isStateActive("isTagValueQuotes")) {
                    deactivateState("isTagValueQuotes");
                }
            }

            if (isStateActive("isInEndTag")) {
                deactivateState("isInEndTag");
                activateState("isHtmlReady");
            }

            if (isStateActive("isTagName")) {
                deactivateState("isTagName");
            }

            deactivateState("isInTag");

            deactivateReadingCharState();
            return;
        }

        if (isStateActive("isTagAttrsSeparator")) {
            if (isStateActive("isTagName")) {
                deactivateState("isTagName");
            }

            if (isStateActive("isTagValueQuotes")) {
                deactivateState("isTagValueQuotes");
            }

            deactivateReadingCharState();

            return;
        }

        if (isStateActive("isTagValueQuotes")) {
            if (isStateActive("isInTagAttrValue")) {
                deactivateState("isInTagAttrValue");
            } else {
                if (isStateActive("isTagArgAssign")) {
                    deactivateState("isTagArgAssign");
                }
            }

            deactivateReadingCharState();

            return;
        }

        if(isStateActive("isTagArgAssign")){
            deactivateState("isTagAttrKey");

            deactivateReadingCharState();
            return;
        }
    }

    function clearDatas() {
        datas.tagName = undefined;
        datas.tagAttrKeyValuePair = {};
        datas.tagAttrKey = undefined;
        datas.tagAttrValue = undefined;
        datas.textContent = undefined;
    }

    function createHTMLElement() {
        let element = document.createElement(datas.tagName);
        datas.tagAttrKeyValuePair['onclick'] = () => alert('hi');
        for (let propName in datas.tagAttrKeyValuePair) {
            element[propName] = datas.tagAttrKeyValuePair[propName];
            if (element[propName] !== datas.tagAttrKeyValuePair[propName]) {
                if (propName !== 'style') {
                    console.warn(`Assignment Error: datas.tagAttrKeyValuePair['${propName}'](${typeof datas.tagAttrKeyValuePair[propName]}) could not be assigned to element['${propName}'](${typeof element[propName]})`);
                }
            }
        }
        element.textContent = datas.textContent;
        return element;
    }

    function updateDataKeyPointer() {
        dataKey = undefined;

        if (isStateActive("isInBeginTag")) {
            if (isStateActive("isInTagAttrs")) {
                if (isStateActive("isTagName")) {
                    dataKey = "tagName";
                } else if (isStateActive("isInTagAttrValue")) {
                    dataKey = "tagAttrValue";
                } else if (isStateActive("isTagAttrKey")) {
                    dataKey = "tagAttrKey";
                }
            }
        }

        if (isStateActive("isInTextContent")) {
            dataKey = "textContent";
        }
    }

    function writeChar() {
        if (isStateActive("isReadingChar")) {
            dataValue.push(char[0]);
        }
    }

    function handleData() {
        if(dataKey !== prevDataKey){
            if(prevDataKey !== undefined){
                datas[prevDataKey] = dataValue.join('');
                console.warn(`datas[${prevDataKey}] = ${datas[prevDataKey]}`)
                
                if (prevDataKey === "tagAttrValue") {
                    datas.tagAttrKeyValuePair[datas.tagAttrKey] = datas.tagAttrValue;
                    datas.tagAttrKey = undefined;
                    datas.tagAttrValue = undefined;
                }
            }

            dataValue = [];
            prevDataKey = dataKey;
        }
        
        if(isStateActive("isReadingChar")){
            dataValue.push(char[0]);
        }
    }

    /** @param {keyof States} state */
    function isStateActive(state) {
        return states[state];
    }

    /** @param {keyof States} state */
    function activateState(state) {
        states[state] = true;
    }

    /** @param {keyof States} state */
    function deactivateState(state) {
        states[state] = false;
    }

    function updateChar(ch) {
        char = ch[0];
    }
}

function replacePlaceholders() {

}

function addToArgs() {
    if (!isWritingInQuotes) {
        let [argKey, argValue] = chars.join('').split('=');
        argValue = argValue.slice(1, -1);
        args[argKey.trim()] = argValue;
        clearChars();
    }
}

function createHTMLElement() {
    let tagName = chars.join('');
    let element = document.createElement(tagName);
    return element;
}
/** 
 * @private
 * @param {{ message?: string charI?: number }} info
 */
function throwInvalidHTMLError(info) {
    throw new InvalidHTMLError(`${info?.charI ? `(charIndex: ${info?.charI}) ` : ''}${info?.message || 'Invalid html'}`);
}

class InvalidHTMLError extends Error {
    /** @param {(string | undefined)} message */
    constructor(message = undefined) {
        super("InvalidHTMLError: " + message);
    }
}

