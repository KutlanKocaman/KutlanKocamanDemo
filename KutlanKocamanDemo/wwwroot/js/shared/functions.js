/**
 * Returns a multi-dimensional array. Each argument is the length of a dimension.
 * @param {any} length
 */
export function createMultiDimensionalArray(length) {
    let arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        let args = Array.prototype.slice.call(arguments, 1);
        while (i--) arr[length - 1 - i] = createMultiDimensionalArray.apply(this, args);
    }

    return arr;
}

/**
 * Returns a deep copy/clone of the simple or nested object passed in.
 * @param {any} input
 */
export function createDeepCopy(input) {
    let output, value, key

    //Return the value if object is not an object
    if (typeof input !== "object" || input === null) {
        return input;
    }

    //If the object is a Set then copy the Set and return it.
    if (input.constructor.name === 'Set') {
        output = new Set();
        for (let item of input) {
            output.add(createDeepCopy(item));
        }
    }
    //If the input is another kind of object or an array, copy it and return it.
    else {
        output = Array.isArray(input) ? [] : {};
        for (key in input) {
            value = input[key];

            //Recursively deep copy nested objects.
            let result = createDeepCopy(value);
            output[key] = result;
        }
    }
    return output;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * @param {any} min
 * @param {any} max
 */
export function randomBetweenInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Sets the given query string parameter value.
 * @param {any} name The name of the query string parameter to set.
 * @param {any} value The value to set the query string parameter to.
 */
export function setQueryStringParameter(name, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(name, value);
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
}

/**
 * Gets the given query string parameter value.
 * @param {any} name The name of the query string parameter to get.
 */
export function getQueryStringParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

/**
 * Removes the query string and anything after it from a URI.
 * @param {any} uri The URI to remove the query string from. Uses the current URI as default.
 */
export function getUriWithoutQueryString(uri = null) {
    if (uri === null) {
        uri = window.location.href;
    }

    const qMarkIndex = uri.indexOf('?');
    if (qMarkIndex > 0) {
        uri = uri.substring(0, qMarkIndex);
    }

    return uri;
}

/**
 * Copied the given text to the clipboard.
 * @param {any} text The text to be copied to the clipboard.
 */
export function copyTextToClipboard(text) {
    const dummy = document.createElement('input');
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
}

/**
 * Attach a given request verification token value to a given form, then submit the form.
 * @param {any} formName The name of the form to submit.
 * @param {any} requestVerificationTokenValue The value to be set for the request verification token form input.
 */
export function submitFormWithRequestVerificationToken(formName, requestVerificationTokenValue) {
    //Create a request verification token input element, assign the given value, and append it to the form.
    let requestVerificationTokenInput = document.createElement("input");
    requestVerificationTokenInput.setAttribute("name", "__RequestVerificationToken");
    requestVerificationTokenInput.value = requestVerificationTokenValue;
    document.forms[formName].appendChild(requestVerificationTokenInput);

    //Submit the form.
    document.forms[formName].submit();
}

/**
 * Get the request verification token value.
 * */
export function getRequestVerificationTokenValue() {
    return document.querySelector("input[name=\"__RequestVerificationToken\"]").value;
}