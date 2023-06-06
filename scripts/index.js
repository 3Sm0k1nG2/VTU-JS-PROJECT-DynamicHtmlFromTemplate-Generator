import { createSubDomFromHtml, testTemplates, mainTemplate } from "./imports.js";

// // let el = createSubDomFromHtml(
// //     testTemplates.singleDiv,
// //     {
// //     className: 'red-color container',
// //     style: 'background-color: yellow',
// //     onClick: () => alert('hi'),
// //     textContent: () => 'aLaraw'
// //     }
// // );

let el = createSubDomFromHtml(mainTemplate.mainTemplate, {
    runGenerator: logic || mainTemplate.runGenerator,
    copyToClipboard: mainTemplate.copyToClipboard,
    createAnotherTemplate: mainTemplate.createAnotherTemplate,
    createCssRule: mainTemplate.createCssRule,
    // updatePreviewStyles: mainTemplate.updatePreviewStyles
});

// console.log(el);
document.getElementById('root').append(el);

let logicScriptElement = document.createElement('script');
logicScriptElement.id = "logic";
logicScriptElement.textContent = '(' + logic.toString() + ')()';

document.body.append(logicScriptElement);

function logic() {
    const htmlTemplateElement = document.getElementById('html-template').querySelector('textarea');
    const cssRulesElement = document.getElementById('css-rules').querySelector('ul');
    const jsFunctionalityElement = document.getElementById('js-functionality').querySelector('textarea');

    const jsFuncScriptElement = document.createElement('script');
    jsFuncScriptElement.id = "handleJS";

    debugger

    updateUserJS();

    /** @type {[{element: HTMLElement, cssKey: string, cssValue: string}]} */
    const defaultCSSStyles = [];
    /** @typedef {[selector: string, keyValuePairs: string]} CssRule*/
    /** @type {[CssRule]} */
    const cssRules = [];

    updateDefaultCSSStyles();

    console.error(defaultCSSStyles);
    updatePreviewStyles();


    function handleJS() {
        const htmlTemplateElement = document.getElementById('html-template').querySelector('textarea');
        const codeElement = document.getElementById('code').querySelector('textarea');
        const previewElement = document.getElementById('preview').querySelector('div.preview-container');

        while (previewElement.hasChildNodes()) {
            previewElement.removeChild(previewElement.firstChild);
        }

        debugger
        let subDom = null;
        try {
            subDom = createSubDomFromHtml(htmlTemplateElement.value, data);
        } catch (e) {
            subDom = createSubDomFromHtml(htmlTemplateElement.value, {});
        } finally {
            previewElement.append(subDom || '');
            codeElement.value = subDom?.outerHTML || '';
        }

        function createSubDomFromHtml(templateHtml, placeholderData) {
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

            if (!root.isClosed) {
                throwInvalidHTMLError(`More begin tags than end tags. Missing end tag '</${root.element.tagName.toLowerCase()}>' | charI: ${charI} char: ${char}`);
            }

            for (let elementI in elementStack) {
                let element = elementStack[elementI];
                if (!element.parentElement && elementI != 0) {
                    throwInvalidHTMLError(`More than one root element. Only one element is allowed as root | charI: ${charI} char: ${char}`);
                }
            }

            appendChildren();

            return root.element;

            function appendChildren() {
                // skip 1st element - it is root, does NOT have parentElement ref
                for (let i = 1; i < elementStack.length; i++) {
                    let stackElement = elementStack[i];
                    stackElement.parentElement.element.appendChild(stackElement.element);
                }
            }

            function processHtml() {
                while (charI < templateHtml.length) {
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
                        if (isStateActive("isInTagAttrValue")) {
                            activateState('isReadingChar');
                            return;
                        }

                        if (!isStateActive("isTagValueQuotes") && !isStateActive("isInTagAttrValue")) {
                            if (isStateActive("isInTag") || isStateActive("isOpenTag")) {
                                throwInvalidHTMLError(`Tag is already in tag. Cannot open a tag while in another opened tag. | charI: ${charI} char: ${char}`);
                            }
                        }

                        activateState("isOpenTag");

                        break;
                    }
                    case ">": {
                        if (isStateActive("isInTagAttrValue")) {
                            activateState("isReadingChar");
                            return;
                        }

                        if (isStateActive("isInTag")) {
                            activateState("isCloseTag");
                        }

                        break;
                    }
                    case "/": {
                        if (isStateActive("isInTagAttrValue")) {
                            activateState("isReadingChar");
                            return;
                        }

                        if (isStateActive("isOpenTag")) {
                            activateState("isTagCloser");
                            return;
                        }

                        if (isStateActive("isInTag")) {
                            if (!isStateActive("isInTextContent") && !isStateActive("isInPlaceholder") && !isStateActive("isInTagAttrValue")) {
                                activateState("isTagCloser");
                            }
                        }

                        break;
                    }
                    case " ": {
                        if (isStateActive("isInTagAttrValue")) {
                            activateState("isReadingChar");
                        }

                        if (isStateActive("isInTextContent")) {
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
                        if (isStateActive("isInTagAttrValue")) {
                            activateState("isReadingChar");
                            return;
                        }

                        if (isStateActive("isInTagAttrs")) {
                            if (isStateActive("isTagAttrKey")) {
                                activateState("isTagArgAssign");
                            }
                        }

                        break;
                    }
                    case "\"": {
                        if (isStateActive("shouldReadNextChar")) {
                            activateState("isReadingChar");
                            deactivateState("shouldReadNextChar");

                            break;
                        }

                        if (isStateActive("isInTagAttrs")) {
                            activateState("isTagValueQuotes");
                        }

                        break;
                    }
                    case "'": {
                        char = '"';

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

                        // FIND ME FIX ME
                        // <input />
                        // <div></div>

                        activateState("isInTag");
                        activateState("isInEndTag");
                        activateState("isTagName");
                        return;
                    }

                    if (isStateActive("isCloseTag")) {
                        deactivateState("isCloseTag");

                        if (isStateActive("isInBeginTag")) {
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

                if (isStateActive("isInTagAttrValue") && !isStateActive("isTagValueQuotes")) {
                    activateState("isReadingChar");
                    return;
                }

                if (isStateActive("isOpenTag")) {
                    if (isStateActive("isTagValueQuotes")) {
                        deactivateState("isTagValueQuotes");
                        deactivateState("isOpenTag");
                        activateState("isReadingChar");
                        activateState("isInTagAttrValue");
                    }

                    if (isStateActive("isInTextContent")) {
                        deactivateState("isInTextContent");

                        activateState("isWritingTextContent");
                    }

                    if (isStateActive("isCloseTag")) {
                        deactivateState("isCloseTag");
                    }

                    // if (isStateActive("isTagName")) {
                    //     deactivateState("isTagName");

                    //     activateState("isWritingTagName");
                    // }

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

                        if (isStateActive("isTagName")) {
                            deactivateState("isTagName");

                            activateState("isWritingTagName");
                        }
                    }

                    if (isStateActive("isInEndTag")) {
                        deactivateState("isInEndTag");

                        if (isStateActive("isWritingTagName")) {
                            deactivateState("isWritingTagName");
                        }

                        activateState("shouldCloseTagSpan");
                    }

                    deactivateState("isInTag");

                    return;
                }

                if (isStateActive("isTagCloser")) {
                    if (isStateActive("isOpenTag")) {
                        deactivateState("isOpenTag");
                    }

                    activateState("isInEndTag");

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
                if (isStateActive("shouldClearDatas")) {
                    clearDatas();

                    deactivateState("shouldClearDatas");
                }

                if (isStateActive("isWritingTagName")) {
                    let dataVal = getDataValue();

                    datas.tagName = dataVal;

                    let parentElement = null;
                    let parentElementI = elementStackI;

                    while (parentElementI >= 0) {
                        let element = elementStack[parentElementI];
                        if (!element.isClosed) {
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

                    clearDataValue();

                    deactivateState("isWritingTagName");
                }

                if (isStateActive("shouldCloseTagSpan")) {
                    let dataVal = datas.tagName || getDataValue();
                    // let dataVal = datas.tagName;

                    let elementToBeClosed = null;
                    let elementToBeClosedI = elementStackI;

                    while (elementToBeClosedI >= 0) {
                        let element = elementStack[elementToBeClosedI];
                        if (!element.isClosed) {
                            elementToBeClosed = element;
                            break;
                        }

                        elementToBeClosedI--;
                    }

                    if (elementToBeClosed?.element.tagName.toLowerCase() !== dataVal.toLowerCase()) {
                        if (!elementToBeClosed) {
                            throwInvalidHTMLError(`Received lone end tag '</${dataVal}> | charI: ${charI} char: ${char}'`);
                        } else {
                            throwInvalidHTMLError(`Received end tag '</${dataVal}>' on begin tag '<${elementToBeClosed?.element.tagName.toLowerCase()}> | charI: ${charI} char: ${char} char: ${char}'`);
                        }
                    }

                    if (elementToBeClosedI === -1) {
                        throwInvalidHTMLError(`Fewer begin tags than end tags. '</${datas.tagName}>' has no element to close | charI: ${charI} char: ${char}`);
                    }

                    clearDatas();
                    clearDataValue();

                    elementToBeClosed.isClosed = true;

                    deactivateState("shouldCloseTagSpan");
                }

                if (isStateActive("isWritingTagAttrKey")) {
                    datas.tagAttrKey = getDataValue();

                    if (datas.tagAttrKey === "readonly") {
                        currentElement.readOnly = true;
                    }

                    if (datas.tagAttrKey.includes('-')) {
                        datas.tagAttrKey = datas.tagAttrKey[0] + datas.tagAttrKey.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join('').slice(1);
                        datas.isTagAttrKeyCssPropName = true;
                    }

                    clearDataValue();

                    deactivateState("isWritingTagAttrKey");
                }

                if (isStateActive("isWritingTagAttrValue")) {
                    let dataVal = getDataValue();

                    if (datas.isTagAttrKeyCssPropName) {
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

                            let placeholderValue = placeholderData[placeholderKey]/* || globalThis[placeholderKey]*/;

                            if (datas.tagAttrKey.startsWith('on')) {
                                if (typeof placeholderValue !== 'function') {
                                    console.warn(`placeholderData[${placeholderKey}] is not a function.`)
                                }

                                datas.tagAttrValue = placeholderValue;

                                currentElement[datas.tagAttrKey] = datas.tagAttrValue;

                                dataVal = dataVal.replace(`{{${placeholderKey}}}`, '')
                            } else if (datas.tagAttrKey === 'style') {
                                if (typeof placeholderData[datas.tagAttrKey] !== 'object') {
                                    console.warn("placeholderData['style'] not an object");

                                    datas.tagAttrValue = placeholderValue;

                                    dataVal = dataVal.replace(`{{${placeholderKey}}}`, datas.tagAttrValue)

                                    currentElement[datas.tagAttrKey] = dataVal;
                                } else {
                                    datas.tagAttrValue = placeholderValue;
                                    for (let propName in placeholderValue) {
                                        currentElement[datas.tagAttrKey][propName] = placeholderValue[propName];
                                    }
                                    dataVal = dataVal.replace(`{{${placeholderKey}}}`, '')
                                }
                            } else {
                                datas.tagAttrValue = placeholderValue;

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

                            let placeholderValue = placeholderData[placeholderKey]/* || globalThis[placeholderKey]*/;

                            dataVal = dataVal.replace(`{{${placeholderKey}}}`, placeholderValue)
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
            function calcEndTagTotalLength(tagName) {
                return (
                    '<'.length
                    + '/'.length
                    + tagName.length +
                    + '>'.length
                );
            }
        }
    }

    function updateUserJS() {
        debugger

        jsFuncScriptElement.textContent = jsFunctionalityElement.value;
        if (jsFuncScriptElement.textContent && jsFuncScriptElement.textContent[jsFuncScriptElement.textContent.length - 2] !== ';') {
            jsFuncScriptElement.textContent += ';\n';
        }
        jsFuncScriptElement.textContent += '\n(' + handleJS.toString() + ')()';
        if (document.body.lastChild.id === "handleJS") {
            document.body.replaceChild(jsFuncScriptElement, document.body.lastChild);
        } else {
            document.body.append(jsFuncScriptElement);
        }
    }

    function updateDefaultCSSStyles() {
        const previewElement = document.getElementById('preview').querySelector('div.preview-container');

        
        previewElement.querySelectorAll('*[style]').forEach(x => {for(let style of x.style){defaultCSSStyles.push({element: x, cssKey: style, cssValue: x.style[style]})}});
        // logDefaultStyles(previewElement);
    }

    function logDefaultStyles(parentElement) {
        for (let child of parentElement.children) {
            // console.error(style)

            for (let styleKey of child.style) {
                defaultCSSStyles.push({ element: child, cssKey: styleKey, value: child.style[styleKey] })
                console.error(child, styleKey);
            }

            if (child.hasChildNodes()) {
                logDefaultStyles(child);
            }
        }
    }

    function handleHTML() {

    }

    // /** @type {HTMLUListElement} */
    // let cssRulesElement = null;
    // /** @typedef {[selector: string, keyValuePairs: string]} cssRule*/
    // /** @type {[cssRule]} */
    // let cssRules = [];
    // /** @type {HTMLDivElement} */
    // let previewContainer = null;

    function updatePreviewStyles() {
        const previewContainer = document.getElementById('preview').querySelector('.preview-container');
        
        if (previewContainer.getAttribute('hasListeners') !== 'true') {
            previewContainer.setAttribute('hasListeners', 'true');
            const cssRulesElement = document.getElementById('css-rules').querySelector('ul');

            cssRulesElement.addEventListener('change', (e) => {
                if (e.target.type !== 'text') {
                    return;
                }

                let ruleActionBtnIndex = 2;
                let ruleActionBtn = e.target.parentElement.children[ruleActionBtnIndex];
                if (!(ruleActionBtn.type === "button" && ruleActionBtn.className === "removeRule")) {
                    return;
                }

                let cssRuleIndex = findElementIndex(e.target.parentElement, e.target.parentElement.parentElement);
                let cssRule = cssRules[cssRuleIndex];

                if (e.target.className === 'key') {
                    cssRule[0] = e.target.value;
                } else if (e.target.className === 'value') {
                    cssRule[1] = e.target.value;
                }

                updatePreviewAddCss(cssRule);

                debugger
                console.error('changed');
            })

            cssRulesElement.addEventListener('click', (e) => {
                e.preventDefault();

                if (e.target.type !== 'button') {
                    return;
                }

                let ruleIndex = findElementIndex(e.target.parentElement, cssRulesElement);

                debugger
                if (e.target.className === 'addRule') {
                    createCssRule();
                    let cssRule = cssRules[ruleIndex];
                    if (cssRule) {
                        console.error("cssRule already has values: " + cssRule)
                    }
                    cssRule = cssRules[ruleIndex] = [e.target.parentElement.children[0].value || undefined, e.target.parentElement.children[1].value || undefined];
                    updatePreviewAddCss(cssRule);
                } else if (e.target.className === 'removeRule') {
                    if (ruleIndex === -1) {
                        return;
                    }
                    debugger

                    let [cssRule] = cssRules.splice(ruleIndex, 1);
                    e.target.parentElement.remove();

                    updatePreviewRemoveCss(cssRule);
                }




                debugger
                console.dir(cssRulesElement.children);
                console.error(e.target.parentElement)
            })
        }

        const cssRulesElement = document.getElementById('css-rules').querySelector('ul');
        let cssRuleElements = cssRulesElement.querySelectorAll('li');

        for(let cssRuleElement of cssRuleElements){
            cssRules.push([cssRuleElement.querySelector('input.key').value, cssRuleElement.querySelector('input.value').value]);
        }

        for(let cssRule of cssRules){
            debugger
            updatePreviewAddCss(cssRule);
        }

        function updatePreviewRemoveCss(cssRule) {
            if (!cssRule) {
                return;
            }

            debugger
            console.error(cssRules[cssRules.lastIndexOf(cssRule[0])]);

            let lastIndex = -1;
            let i = -1;
            while(++i < cssRules.length){
                if(cssRules[i][0] === cssRule[0]){
                    lastIndex = i;
                }
            }
            
            /** @type {[[cssKey: string, cssValue: string]]} */
            let prevValues = undefined;
            if(lastIndex !== -1){
                prevValues = cssRules[lastIndex][1].split(';').filter(x => x);
                prevValues = prevValues.map(x => x.split(':').map(x => x.trim()));

                for (let prevValueIndex in prevValues) {
                    let [key, _] = prevValues[prevValueIndex];
                    key = key.split('-');
                    key = key[0] + key[1][0].toUpperCase() + key[1].slice(1);

                    prevValues[prevValueIndex][0] = key;
                }
            }

            let values = cssRule[1].split(';').filter(x => x);
            values = values.map(x => x.split(':').map(x => x.trim()));

            console.warn(cssRule[0], cssRules[1], values);
            for (let [key, value] of values) {
                key = key.split('-');
                key = key[0] + key[1][0].toUpperCase() + key[1].slice(1);

                // FIND ME FIX ME PATCH ME UPDATE ME
                // replace value should default to 'html code' section
                // if there is already style explicitly written default to it instead of empty string
                debugger
                previewContainer.querySelectorAll(cssRule[0]).forEach(x => x.style[key] = x.style[key].replace(value, prevValues?.find(y => y[0] === key)[1] || defaultCSSStyles.find(y => y === x)?.cssValue || ''));
            }
        }

        function updatePreviewAddCss(cssRule) {
            if (!cssRule) {
                return;
            }

            if(!cssRule[0] || !cssRule[1]){
                return;
            }

            let values = cssRule[1].split(';').filter(x => x);
            values = values.map(x => x.split(':').map(x => x.trim()));

            console.warn(cssRule[0], cssRules[1], values);
            for (let [key, value] of values) {
                key = key.split('-');
                key = key[0] + key[1][0].toUpperCase() + key[1].slice(1);

                // FIND ME FIX ME PATCH ME UPDATE ME
                // replace value should default to 'html code' section
                // if there is already style explicitly written default to it instead of empty string
                debugger
                previewContainer.querySelectorAll(cssRule[0]).forEach(x => { if (defaultCSSStyles.find(y => y.element !== x)) { x.style[key] = value } });
            }
        }

        /** @return {-1 | elementIndexAsPositiveNumber} */
        function findElementIndex(childElement, parentElement) {
            let elementIndex = -1;
            let indexCounter = -1;
            while (++indexCounter < parentElement.children.length) {
                if (parentElement.children[indexCounter] === childElement) {
                    elementIndex = indexCounter;
                    break;
                }
            }

            return elementIndex;
        }

        function createCssRule() {
            convertAddToRemoveRuleBtn(cssRulesElement.lastChild.querySelector('.addRule'));

            cssRulesElement.append(createEmptyCSSRule());

            function convertAddToRemoveRuleBtn(ruleAddBtn) {
                ruleAddBtn.value = '-';
                ruleAddBtn.className = 'removeRule';
            }

            function createEmptyCSSRule() {
                return createSubDomFromHtml(`
                <li className="css-rule">
                    <input className="key" placeholder="CSS Key"/>
                    <input className="value" placeholder="CSS Value" value=""/>
                    <input className="addRule" type="button" value="+"/>
                </li>
            `
                )
            }

        }

        function removeCssRule() {

        }

        function createSubDomFromHtml(templateHtml, placeholderData) {
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

            if (!root.isClosed) {
                throwInvalidHTMLError(`More begin tags than end tags. Missing end tag '</${root.element.tagName.toLowerCase()}>' | charI: ${charI} char: ${char}`);
            }

            for (let elementI in elementStack) {
                let element = elementStack[elementI];
                if (!element.parentElement && elementI != 0) {
                    throwInvalidHTMLError(`More than one root element. Only one element is allowed as root | charI: ${charI} char: ${char}`);
                }
            }

            appendChildren();

            return root.element;

            function appendChildren() {
                // skip 1st element - it is root, does NOT have parentElement ref
                for (let i = 1; i < elementStack.length; i++) {
                    let stackElement = elementStack[i];
                    stackElement.parentElement.element.appendChild(stackElement.element);
                }
            }

            function processHtml() {
                while (charI < templateHtml.length) {
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
                        if (isStateActive("isInTagAttrValue")) {
                            activateState('isReadingChar');
                            return;
                        }

                        if (!isStateActive("isTagValueQuotes") && !isStateActive("isInTagAttrValue")) {
                            if (isStateActive("isInTag") || isStateActive("isOpenTag")) {
                                throwInvalidHTMLError(`Tag is already in tag. Cannot open a tag while in another opened tag. | charI: ${charI} char: ${char}`);
                            }
                        }

                        activateState("isOpenTag");

                        break;
                    }
                    case ">": {
                        if (isStateActive("isInTagAttrValue")) {
                            activateState("isReadingChar");
                            return;
                        }

                        if (isStateActive("isInTag")) {
                            activateState("isCloseTag");
                        }

                        break;
                    }
                    case "/": {
                        if (isStateActive("isInTagAttrValue")) {
                            activateState("isReadingChar");
                            return;
                        }

                        if (isStateActive("isOpenTag")) {
                            activateState("isTagCloser");
                            return;
                        }

                        if (isStateActive("isInTag")) {
                            if (!isStateActive("isInTextContent") && !isStateActive("isInPlaceholder") && !isStateActive("isInTagAttrValue")) {
                                activateState("isTagCloser");
                            }
                        }

                        break;
                    }
                    case " ": {
                        if (isStateActive("isInTagAttrValue")) {
                            activateState("isReadingChar");
                        }

                        if (isStateActive("isInTextContent")) {
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
                        if (isStateActive("isInTagAttrValue")) {
                            activateState("isReadingChar");
                            return;
                        }

                        if (isStateActive("isInTagAttrs")) {
                            if (isStateActive("isTagAttrKey")) {
                                activateState("isTagArgAssign");
                            }
                        }

                        break;
                    }
                    case "\"": {
                        if (isStateActive("shouldReadNextChar")) {
                            activateState("isReadingChar");
                            deactivateState("shouldReadNextChar");

                            break;
                        }

                        if (isStateActive("isInTagAttrs")) {
                            activateState("isTagValueQuotes");
                        }

                        break;
                    }
                    case "'": {
                        char = '"';

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

                        // FIND ME FIX ME
                        // <input />
                        // <div></div>

                        activateState("isInTag");
                        activateState("isInEndTag");
                        activateState("isTagName");
                        return;
                    }

                    if (isStateActive("isCloseTag")) {
                        deactivateState("isCloseTag");

                        if (isStateActive("isInBeginTag")) {
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

                if (isStateActive("isInTagAttrValue") && !isStateActive("isTagValueQuotes")) {
                    activateState("isReadingChar");
                    return;
                }

                if (isStateActive("isOpenTag")) {
                    if (isStateActive("isTagValueQuotes")) {
                        deactivateState("isTagValueQuotes");
                        deactivateState("isOpenTag");
                        activateState("isReadingChar");
                        activateState("isInTagAttrValue");
                    }

                    if (isStateActive("isInTextContent")) {
                        deactivateState("isInTextContent");

                        activateState("isWritingTextContent");
                    }

                    if (isStateActive("isCloseTag")) {
                        deactivateState("isCloseTag");
                    }

                    // if (isStateActive("isTagName")) {
                    //     deactivateState("isTagName");

                    //     activateState("isWritingTagName");
                    // }

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

                        if (isStateActive("isTagName")) {
                            deactivateState("isTagName");

                            activateState("isWritingTagName");
                        }
                    }

                    if (isStateActive("isInEndTag")) {
                        deactivateState("isInEndTag");

                        if (isStateActive("isWritingTagName")) {
                            deactivateState("isWritingTagName");
                        }

                        activateState("shouldCloseTagSpan");
                    }

                    deactivateState("isInTag");

                    return;
                }

                if (isStateActive("isTagCloser")) {
                    if (isStateActive("isOpenTag")) {
                        deactivateState("isOpenTag");
                    }

                    activateState("isInEndTag");

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
                if (isStateActive("shouldClearDatas")) {
                    clearDatas();

                    deactivateState("shouldClearDatas");
                }

                if (isStateActive("isWritingTagName")) {
                    let dataVal = getDataValue();

                    datas.tagName = dataVal;

                    let parentElement = null;
                    let parentElementI = elementStackI;

                    while (parentElementI >= 0) {
                        let element = elementStack[parentElementI];
                        if (!element.isClosed) {
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

                    clearDataValue();

                    deactivateState("isWritingTagName");
                }

                if (isStateActive("shouldCloseTagSpan")) {
                    let dataVal = datas.tagName || getDataValue();
                    // let dataVal = datas.tagName;

                    let elementToBeClosed = null;
                    let elementToBeClosedI = elementStackI;

                    while (elementToBeClosedI >= 0) {
                        let element = elementStack[elementToBeClosedI];
                        if (!element.isClosed) {
                            elementToBeClosed = element;
                            break;
                        }

                        elementToBeClosedI--;
                    }

                    if (elementToBeClosed?.element.tagName.toLowerCase() !== dataVal.toLowerCase()) {
                        if (!elementToBeClosed) {
                            throwInvalidHTMLError(`Received lone end tag '</${dataVal}> | charI: ${charI} char: ${char}'`);
                        } else {
                            throwInvalidHTMLError(`Received end tag '</${dataVal}>' on begin tag '<${elementToBeClosed?.element.tagName.toLowerCase()}> | charI: ${charI} char: ${char} char: ${char}'`);
                        }
                    }

                    if (elementToBeClosedI === -1) {
                        throwInvalidHTMLError(`Fewer begin tags than end tags. '</${datas.tagName}>' has no element to close | charI: ${charI} char: ${char}`);
                    }

                    clearDatas();
                    clearDataValue();

                    elementToBeClosed.isClosed = true;

                    deactivateState("shouldCloseTagSpan");
                }

                if (isStateActive("isWritingTagAttrKey")) {
                    datas.tagAttrKey = getDataValue();

                    if (datas.tagAttrKey === "readonly") {
                        currentElement.readOnly = true;
                    }

                    if (datas.tagAttrKey.includes('-')) {
                        datas.tagAttrKey = datas.tagAttrKey[0] + datas.tagAttrKey.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join('').slice(1);
                        datas.isTagAttrKeyCssPropName = true;
                    }

                    clearDataValue();

                    deactivateState("isWritingTagAttrKey");
                }

                if (isStateActive("isWritingTagAttrValue")) {
                    let dataVal = getDataValue();

                    if (datas.isTagAttrKeyCssPropName) {
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

                            let placeholderValue = placeholderData[placeholderKey]/* || globalThis[placeholderKey]*/;

                            if (datas.tagAttrKey.startsWith('on')) {
                                if (typeof placeholderValue !== 'function') {
                                    console.warn(`placeholderData[${placeholderKey}] is not a function.`)
                                }

                                datas.tagAttrValue = placeholderValue;

                                currentElement[datas.tagAttrKey] = datas.tagAttrValue;

                                dataVal = dataVal.replace(`{{${placeholderKey}}}`, '')
                            } else if (datas.tagAttrKey === 'style') {
                                if (typeof placeholderData[datas.tagAttrKey] !== 'object') {
                                    console.warn("placeholderData['style'] not an object");

                                    datas.tagAttrValue = placeholderValue;

                                    dataVal = dataVal.replace(`{{${placeholderKey}}}`, datas.tagAttrValue)

                                    currentElement[datas.tagAttrKey] = dataVal;
                                } else {
                                    datas.tagAttrValue = placeholderValue;
                                    for (let propName in placeholderValue) {
                                        currentElement[datas.tagAttrKey][propName] = placeholderValue[propName];
                                    }
                                    dataVal = dataVal.replace(`{{${placeholderKey}}}`, '')
                                }
                            } else {
                                datas.tagAttrValue = placeholderValue;

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

                            let placeholderValue = placeholderData[placeholderKey]/* || globalThis[placeholderKey]*/;

                            dataVal = dataVal.replace(`{{${placeholderKey}}}`, placeholderValue)
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
            function calcEndTagTotalLength(tagName) {
                return (
                    '<'.length
                    + '/'.length
                    + tagName.length +
                    + '>'.length
                );
            }
        }

    }



}


//<div onclick="null" style="background-color: red;">test<div style="background-color: yellow; font-size: 25px; width: 50px;">test2</div></div>