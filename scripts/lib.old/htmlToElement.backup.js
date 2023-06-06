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

// better than above
export function createElementFromHtml(html = orgHtml) {
    /**
     * @typedef {{ 
     * isOpenTag: boolean,
     * isTagCloser: boolean,
     * shouldClearDatas: boolean,
     * isCloseTag: boolean,
     * .
     * isOpenPlaceholderBracket: boolean,
     * isInPlaceholder: boolean,
     * isClosePlaceholderBracket: boolean,
     * isReplacingPlaceholder: boolean,
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

        isOpenPlaceholderBracket: false,
        isInPlaceholder: false,
        isClosePlaceholderBracket: false,
        isReplacingPlaceholder: false,

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

    /** @type {HTMLElement}*/
    let element;

    processHtml();
    return element;

    function processHtml() {
        for (let char of html) {
            updateChar(char);

            updateStates();
            handleStates();

            if (isStateActive("isHtmlReady")) {
                createHTMLElement();
                deactivateState("isHtmlReady");
                return;
            }

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

            if (isStateActive("isTagCloser")) {
                deactivateState("isTagCloser");

                activateState("isInTag");
                activateState("isInEndTag");
                activateState("isTagName");
                return;
            }

            if (isStateActive("isCloseTag")) {
                deactivateState("isCloseTag");

                activateState("isInTextContent");
                return;
            }

            if (isStateActive("isOpenTag")) {
                if (isStateActive("isInTextContent")) {
                    deactivateState("isInTextContent");
                }

                deactivateState("isOpenTag");

                activateState("isInTag");
                activateState("isInBeginTag");
                activateState("isTagName");

                if (isStateActive("shouldClearDatas")) {
                    clearDatas();
                    deactivateState("shouldClearDatas");
                } else {
                    activateState("shouldClearDatas");
                }

                return;
            }

            if (isStateActive("isTagAttrsSeparator")) {
                deactivateState("isTagAttrsSeparator");

                if (!isStateActive("isInTagAttrs")) {
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

        if (isStateActive("isTagCloser")) {
            if (isStateActive("isOpenTag")) {
                deactivateState("isOpenTag")
                deactivateState("shouldClearDatas");
            }

            deactivateReadingCharState();
            return;
        }

        if (isStateActive("isOpenTag")) {
            if (isStateActive("isInTextContent")) {
                deactivateState("isInTextContent");
            }

            if (isStateActive("isCloseTag")) {
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

        if (isStateActive("isTagArgAssign")) {
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
        element = document.createElement(datas.tagName);
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
    }

    function updateDataKeyPointer() {
        dataKey = undefined;

        if (isStateActive("isInBeginTag")) {
            if (isStateActive("isTagName")) {
                dataKey = "tagName";
            }
            if (isStateActive("isInTagAttrs")) {
                if (isStateActive("isInTagAttrValue")) {
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

    function handleData() {
        if (dataKey !== prevDataKey) {
            if (prevDataKey !== undefined) {
                datas[prevDataKey] = dataValue.join('');
                // console.log(`datas[${prevDataKey}] = ${datas[prevDataKey]}`)

                if (prevDataKey === "tagAttrValue") {
                    datas.tagAttrKeyValuePair[datas.tagAttrKey] = datas.tagAttrValue;
                    datas.tagAttrKey = undefined;
                    datas.tagAttrValue = undefined;
                }
            }

            dataValue = [];
            prevDataKey = dataKey;
        }

        if (isStateActive("isReadingChar")) {
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

// best one yet
export function createElementFromHtml_and_placeholderReplacements(templateHtml = tmpHtml, placeholderData = {
    className: 'red-color container',
    style: {
        backgroundColor: 'yellow'
    },
    onClick: () => alert('hi'),
    textContent: () => 'aLaraw'
}) {
    /**
     * @typedef {{ 
     * isOpenTag: boolean,
     * isTagCloser: boolean,
     * shouldClearDatas: boolean,
     * isCloseTag: boolean,
     * .
     * isOpenPlaceholderBracket: boolean,
     * isInPlaceholder: boolean,
     * isClosePlaceholderBracket: boolean,
     * isReplacingPlaceholder: boolean,
     * .
     * isWritingTagName: boolean,
     * isWritingTagAttrKey: boolean,
     * isWritingTagAttrValue: boolean,
     * isWritingTextContent: boolean,
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

        isOpenPlaceholderBracket: false,
        isInPlaceholder: false,
        isClosePlaceholderBracket: false,
        isReplacingPlaceholder: false,

        isWritingTagName: false,
        isWritingTagAttrKey: false,
        isWritingTagAttrValue: false,
        isWritingTextContent: false,

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

    /** @type {HTMLElement}*/
    let element;

    processHtml();
    return element;

    function processHtml() {
        for (let char of templateHtml) {
            updateChar(char);

            updateStates();
            handleStates();

            if (isStateActive("isHtmlReady")) {
                // createHTMLElement();
                deactivateState("isHtmlReady");
                return;
            }

            updateDataKeyPointer();
            handleData();
            console.log(JSON.stringify({ char, dataKey, states: Object.entries(states).filter(x => x[1]).map(x => x[0] + ": " + x[1]), datas }, null, 2),);
            console.log(dataValue);
        }
    }

    function updateStates() {
        deactivateReadingCharState();

        switch (char) {
            case "<": {
                if (isStateActive("isInTag") || isStateActive("isOpenTag")) {
                    throwInvalidHTMLError("Tag is already in tag. Cannot open a tag while in another opened tag.");
                }

                activateState("isOpenTag");

                break;
            }
            case ">": {
                if (isStateActive("isInTag")) {
                    activateState("isCloseTag");
                }

                break;
            }
            case "/": {
                if (isStateActive("isOpenTag")) {
                    activateState("isTagCloser");
                }

                break;
            }
            case " ": {
                if(isStateActive("isInTextContent")){
                    activateState("isReadingChar");
                }
                if (isStateActive("isInBeginTag")) {
                    if (!isStateActive("isInTagAttrValue")) {
                        activateState("isTagAttrsSeparator");
                    }
                }

                break;
            }
            case "=": {
                if (isStateActive("isInTagAttrs")) {
                    if (isStateActive("isTagAttrKey")) {
                        activateState("isTagArgAssign");
                    }
                }

                break;
            }
            case "\"": {
                if (isStateActive("isInTagAttrs")) {
                    activateState("isTagValueQuotes");
                }

                break;
            }
            default: {
                activateState("isReadingChar");

                return;
            }
        }
    }

    function deactivateReadingCharState() {
        deactivateState("isReadingChar");
    }

    function handleStates() {
        if (isStateActive("isReadingChar")) {
            if (isStateActive("isTagCloser")) {
                deactivateState("isTagCloser");

                activateState("isInTag");
                activateState("isInEndTag");
                activateState("isTagName");
                return;
            }

            if (isStateActive("isCloseTag")) {
                deactivateState("isCloseTag");

                activateState("isInTextContent");
                return;
            }

            if (isStateActive("isOpenTag")) {
                if (isStateActive("isInTextContent")) {
                    deactivateState("isInTextContent");
                }

                deactivateState("isOpenTag");

                activateState("isInTag");
                activateState("isInBeginTag");
                activateState("isTagName");

                if (isStateActive("shouldClearDatas")) {
                    clearDatas();
                    deactivateState("shouldClearDatas");
                } else {
                    activateState("shouldClearDatas");
                }

                return;
            }

            if (isStateActive("isTagAttrsSeparator")) {
                deactivateState("isTagAttrsSeparator");

                if (!isStateActive("isInTagAttrs")) {
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
        }

        if (isStateActive("isTagCloser")) {
            if (isStateActive("isOpenTag")) {
                deactivateState("isOpenTag")
                deactivateState("shouldClearDatas");
            }

            return;
        }

        if (isStateActive("isOpenTag")) {
            if (isStateActive("isInTextContent")) {
                deactivateState("isInTextContent");

                activateState("isWritingTextContent");
            }

            if (isStateActive("isCloseTag")) {
                deactivateState("isCloseTag");
            }

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

            return;
        }

        if (isStateActive("isTagAttrsSeparator")) {
            if (isStateActive("isTagName")) {
                deactivateState("isTagName");

                activateState("isWritingTagName");
            }

            if (isStateActive("isTagValueQuotes")) {
                deactivateState("isTagValueQuotes");
            }

            return;
        }

        if (isStateActive("isTagValueQuotes")) {
            if (isStateActive("isInTagAttrValue")) {
                deactivateState("isInTagAttrValue");

                activateState("isWritingTagAttrValue");
            } else {
                if (isStateActive("isTagArgAssign")) {
                    deactivateState("isTagArgAssign");
                }
            }

            return;
        }

        if (isStateActive("isTagArgAssign")) {
            deactivateState("isTagAttrKey");

            activateState("isWritingTagAttrKey");

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
        element = document.createElement(datas.tagName);
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
    }

    function updateDataKeyPointer() {
        dataKey = undefined;

        if (isStateActive("isInBeginTag")) {
            if (isStateActive("isTagName")) {
                dataKey = "tagName";
            }
            if (isStateActive("isInTagAttrs")) {
                if (isStateActive("isInTagAttrValue")) {
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

    function handleData() {
        if (isStateActive("isWritingTagName")) {
            element = document.createElement(dataValue.join(''));
            dataValue = [];

            deactivateState("isWritingTagName");
        }

        if (isStateActive("isWritingTagAttrKey")) {
            datas.tagAttrKey = dataValue.join('');
            dataValue = [];

            deactivateState("isWritingTagAttrKey");
        }

        if (isStateActive("isWritingTagAttrValue")) {
            let dataVal = dataValue.join('');

            if (!(dataVal.includes('{{') && dataVal.includes('}}'))) {
                element[datas.tagAttrKey] = undefined;
            } else {
                while (dataVal.includes('{{') && dataVal.includes('}}')) {
                    let startI = dataVal.indexOf(`{{`);
                    let endI = dataVal.indexOf(`}}`);
                    let placeholderKey = dataVal.slice(startI + 2, endI);

                    if (datas.tagAttrKey.startsWith('on')) {
                        if (typeof placeholderData[placeholderKey] !== 'function') {
                            console.warn(`placeholderData[${placeholderKey}] is not a function.`)
                        }
                        element[datas.tagAttrKey] = placeholderData[placeholderKey];
                        dataVal = dataVal.replace(`{{${placeholderKey}}}`, '')
                    } else if (datas.tagAttrKey === 'style') {
                        if (typeof placeholderData[datas.tagAttrKey] !== 'object') {
                            console.warn("placeholderData['style'] not an object");
                            dataVal = dataVal.replace(`{{${placeholderKey}}}`, placeholderData[placeholderKey])
                            element[datas.tagAttrKey] = dataVal;
                        } else {
                            for(let propName in placeholderData[placeholderKey]){
                                element[datas.tagAttrKey][propName] = placeholderData[placeholderKey][propName];
                            }
                            dataVal = dataVal.replace(`{{${placeholderKey}}}`, '')
                        }
                    } else {
                        dataVal = dataVal.replace(`{{${placeholderKey}}}`, placeholderData[placeholderKey])
                        element[datas.tagAttrKey] = dataVal;
                    }
                }
            }


            dataValue = [];

            deactivateState("isWritingTagAttrValue");
        }

        if (isStateActive("isWritingTextContent")) {
            let dataVal = dataValue.join('');

            if (!(dataVal.includes('{{') && dataVal.includes('}}'))) {
                element[datas.tagAttrKey] = undefined;
            } else {
                while (dataVal.includes('{{') && dataVal.includes('}}')) {
                    let startI = dataVal.indexOf(`{{`);
                    let endI = dataVal.indexOf(`}}`);
                    let placeholderKey = dataVal.slice(startI + 2, endI);

                    dataVal = dataVal.replace(`{{${placeholderKey}}}`, placeholderData[placeholderKey])
                    element.textContent = dataVal;
                }
            }

            dataValue = [];

            deactivateState("isWritingTextContent");
        }

        // if (dataKey !== prevDataKey) {
        //     if (prevDataKey !== undefined) {
        //         datas[prevDataKey] = dataValue.join('');
        //         // console.log(`datas[${prevDataKey}] = ${datas[prevDataKey]}`)

        //         if (prevDataKey === "tagAttrValue") {
        //             datas.tagAttrKeyValuePair[datas.tagAttrKey] = datas.tagAttrValue;
        //             datas.tagAttrKey = undefined;
        //             datas.tagAttrValue = undefined;
        //         }
        //     }

        //     dataValue = [];
        //     prevDataKey = dataKey;
        // }

        if (isStateActive("isReadingChar")) {
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
