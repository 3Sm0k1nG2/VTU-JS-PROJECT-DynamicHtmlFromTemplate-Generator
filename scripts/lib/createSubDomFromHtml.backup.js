import { throwInvalidHTMLError } from "./common/error.js";

/**
 * @param {string} templateHtml 
 * @param {{
 * [key: string]: string | Function,
 * className: string | undefined,
 * style: string | object | undefined,
 * textContent: string | undefined,
 * onClick: Function | null
 * }} placeholderData 
 * @returns {HTMLElement}
 */

export function createSubDomFromHtml(templateHtml, placeholderData) {
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
     * shouldCloseTagSpan: boolean,
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
        shouldCloseTagSpan: false,
    }
    const specialChars = ['<', '>', '/', '"', ' ', '=', '\n'];

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
        isTagAttrKeyCssPropName: false,
        tagAttrValue: undefined,
        textContent: undefined
    }

    /** @type {string[0]} */
    let char = undefined;
    /** @type {number} */
    let charI = 0;

    /** @type {keyof Datas} */
    let dataKey = undefined;
    /** @type {keyof Datas | undefined} */
    let prevDataKey = undefined;
    /** @type {string[]} */
    let dataValue = [];

    /** @type {HTMLElement | null}*/
    let currentElement = null;

    /** 
     * @typedef {{ 
     * element: HTMLElement,
     * parentElement: stackElement,
     * isClosed: boolean
     * }} stackElement
    */
    /** @type {[stackElement]}*/
    let elementStack = [];
    let elementStackI = -1;

    processHtml();
    console.log(elementStack);
    let root = elementStack[0];

    if(!root.isClosed){
        throwInvalidHTMLError(`More begin tags than end tags. Missing end tag '</${root.element.tagName.toLowerCase()}>'`);
    }

    for(let elementI in elementStack){
        let element = elementStack[elementI];
        if(!element.parentElement && elementI != 0){
            throwInvalidHTMLError("More than one root element. Only one element is allowed as root");
        }
    }

    appendChildren();

    return root.element;

    function appendChildren() {
        // skip 1st element - it is root, does NOT have parentElement ref
        for(let i = 1; i < elementStack.length; i++){
            let stackElement = elementStack[i];
            stackElement.parentElement.element.appendChild(stackElement.element);
        }
    }

    function processHtml() {
        while(charI < templateHtml.length){
            updateChar(templateHtml[charI]);

            updateStates();
            handleStates();

            updateDataKeyPointer();
            handleData();
            console.log(JSON.stringify({ char, dataKey, states: Object.entries(states).filter(x => x[1]).map(x => x[0] + ": " + x[1]), datas }, null, 2),);
            console.log(dataValue);
        }

    }

    function updateStates() {
        deactivateReadingCharState();

        switch (char) {
            case '\n': {
                break;
            }
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
                if(isStateActive("isInTagAttrValue")){
                    activateState("isReadingChar");
                }

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

                if(isStateActive("isInBeginTag")){
                    deactivateState("isInBeginTag");
                    
                    activateState("isWritingTagName");
                }

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

                activateState("shouldClearDatas");

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
            deactivateState("isOpenTag");
            
            activateState("isInEndTag");

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

            if (isStateActive("isTagName")) {
                deactivateState("isTagName");

                activateState("isWritingTagName");
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
                activateState("shouldCloseTagSpan");
            }

            if (isStateActive("isTagName")) {
                deactivateState("isTagName");

                activateState("isWritingTagName");
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
        if(isStateActive("shouldClearDatas")){
            clearDatas();

            deactivateState("shouldClearDatas");
        }

        if (isStateActive("isWritingTagName")) {
            let dataVal = getDataValue();

            if(isStateActive("shouldCloseTagSpan")){


                let elementToBeClosed = null;
                let elementToBeClosedI = elementStackI;

                while(elementToBeClosedI >= 0){
                    let element = elementStack[elementToBeClosedI];
                    if(!element.isClosed){
                        elementToBeClosed = element;
                        break;
                    }

                    elementToBeClosedI--;
                }

                if(elementToBeClosed?.element.tagName.toLowerCase() !== dataVal.toLowerCase()){
                    if(!elementToBeClosed){
                        throwInvalidHTMLError(`Received lone end tag '</${dataVal}>'`);
                    } else {
                        throwInvalidHTMLError(`Received end tag '</${dataVal}>' on begin tag '<${elementToBeClosed?.element.tagName.toLowerCase()}>'`);
                    }
                }

                if(elementToBeClosedI === -1){
                    throwInvalidHTMLError(`Fewer begin tags than end tags. '</${datas.tagName}>' has no element to close`);
                }

                clearDatas();

                elementToBeClosed.isClosed = true;

                deactivateState("shouldCloseTagSpan");
            } else {
                datas.tagName = dataVal;
                
                let parentElement = null;
                let parentElementI = elementStackI;

                while(parentElementI >= 0){
                    let element = elementStack[parentElementI];
                    if(!element.isClosed){
                        parentElement = element;
                        break;
                    }

                    parentElementI--;
                }

                elementStack.push({
                    element: document.createElement(datas.tagName),
                    parentElement,
                    isClosed: false
                });
                elementStackI++;
                currentElement = elementStack[elementStackI].element;
            }

            clearDataValue();

            deactivateState("isWritingTagName");
        }

        if (isStateActive("isWritingTagAttrKey")) {
            datas.tagAttrKey = getDataValue();

            if(datas.tagAttrKey.includes('-')){
                datas.tagAttrKey = datas.tagAttrKey[0] + datas.tagAttrKey.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join('').slice(1);
                datas.isTagAttrKeyCssPropName = true;
            }

            clearDataValue();

            deactivateState("isWritingTagAttrKey");
        }

        if (isStateActive("isWritingTagAttrValue")) {
            let dataVal = getDataValue();

            if(datas.isTagAttrKeyCssPropName){
                currentElement.style[datas.tagAttrKey] = dataVal;

                datas.isTagAttrKeyCssPropName = false;
            } else if (!(dataVal.includes('{{') && dataVal.includes('}}'))) {
                datas.tagAttrValue = dataVal;
                currentElement[datas.tagAttrKey] = datas.tagAttrValue;
            } else {
                while (dataVal.includes('{{') && dataVal.includes('}}')) {
                    let startI = dataVal.indexOf(`{{`);
                    let endI = dataVal.indexOf(`}}`);
                    let placeholderKey = dataVal.slice(startI + 2, endI);

                    if (datas.tagAttrKey.startsWith('on')) {
                        if (typeof placeholderData[placeholderKey] !== 'function') {
                            console.warn(`placeholderData[${placeholderKey}] is not a function.`)
                        }

                        datas.tagAttrValue = placeholderData[placeholderKey];
                        
                        currentElement[datas.tagAttrKey] = datas.tagAttrValue;

                        dataVal = dataVal.replace(`{{${placeholderKey}}}`, '')
                    } else if (datas.tagAttrKey === 'style') {
                        if (typeof placeholderData[datas.tagAttrKey] !== 'object') {
                            console.warn("placeholderData['style'] not an object");
                            
                            datas.tagAttrValue = placeholderData[placeholderKey];

                            dataVal = dataVal.replace(`{{${placeholderKey}}}`, datas.tagAttrValue)

                            currentElement[datas.tagAttrKey] = dataVal;
                        } else {
                            datas.tagAttrValue = placeholderData[placeholderKey];
                            for(let propName in placeholderData[placeholderKey]){
                                currentElement[datas.tagAttrKey][propName] = placeholderData[placeholderKey][propName];
                            }
                            dataVal = dataVal.replace(`{{${placeholderKey}}}`, '')
                        }
                    } else {
                        datas.tagAttrValue = placeholderData[placeholderKey];

                        dataVal = dataVal.replace(`{{${placeholderKey}}}`, datas.tagAttrValue)
                        currentElement[datas.tagAttrKey] = dataVal;
                    }
                }
            }

            clearDataValue();

            deactivateState("isWritingTagAttrValue");
        }

        if (isStateActive("isWritingTextContent")) {
            let dataVal = getDataValue();

            if (!(dataVal.includes('{{') && dataVal.includes('}}'))) {
                datas.textContent = dataVal;
                currentElement.textContent = datas.textContent;
            } else {
                while (dataVal.includes('{{') && dataVal.includes('}}')) {
                    let startI = dataVal.indexOf(`{{`);
                    let endI = dataVal.indexOf(`}}`);
                    let placeholderKey = dataVal.slice(startI + 2, endI);

                    dataVal = dataVal.replace(`{{${placeholderKey}}}`, placeholderData[placeholderKey])
                    datas.textContent = dataVal;
                    currentElement.textContent = datas.textContent;
                }
            }

            clearDataValue();

            deactivateState("isWritingTextContent");
        }

        // if (dataKey !== prevDataKey) {
        //     if (prevDataKey !== undefined) {
        //         datas[prevDataKey] = getDataValue();
        //         // console.log(`datas[${prevDataKey}] = ${datas[prevDataKey]}`)

        //         if (prevDataKey === "tagAttrValue") {
        //             datas.tagAttrKeyValuePair[datas.tagAttrKey] = datas.tagAttrValue;
        //             datas.tagAttrKey = undefined;
        //             datas.tagAttrValue = undefined;
        //         }
        //     }

        //     clearDataValue();
        //     prevDataKey = dataKey;
        // }

        if (isStateActive("isReadingChar")) {
            dataValue.push(char[0]);
        }
    }

    function clearDataValue() {
        dataValue = [];
    }

    function getDataValue() {
        return dataValue.join('').trim()
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
        charI++;
    }

    /** @type {string} */
    function calcEndTagTotalLength(tagName){
        return (
            '<'.length
            + '/'.length
            + tagName.length + 
            + '>'.length
        );
    }
}
