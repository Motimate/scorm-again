// @flow
import {scorm12_constants} from '../constants/api_constants';
import {scorm12_error_codes} from '../constants/error_codes';
import {ValidationError} from '../exceptions';
import {scorm12_regex} from '../constants/regex';

/**
 * Check if the value matches the proper format. If not, throw proper error code.
 *
 * @param {string} value
 * @param {string} regexPattern
 * @param {number} errorCode
 * @param {boolean} allowEmptyString
 * @return {boolean}
 */
export function checkValidFormat(
    value: String,
    regexPattern: String,
    errorCode: number,
    allowEmptyString?: boolean) {
  const formatRegex = new RegExp(regexPattern);
  const matches = value.match(formatRegex);
  if (allowEmptyString && value === '') {
    return true;
  }
  if (value === undefined || !matches || matches[0] === '') {
    throw new ValidationError(errorCode);
  }
  return true;
}

/**
 * Check if the value matches the proper range. If not, throw proper error code.
 *
 * @param {*} value
 * @param {string} rangePattern
 * @param {number} errorCode
 * @return {boolean}
 */
export function checkValidRange(
    value: any, rangePattern: String, errorCode: number) {
  const ranges = rangePattern.split('#');
  value = value * 1.0;
  if (value >= ranges[0]) {
    if ((ranges[1] === '*') || (value <= ranges[1])) {
      return true;
    } else {
      throw new ValidationError(errorCode);
    }
  } else {
    throw new ValidationError(errorCode);
  }
}

/**
 * Base class for API cmi objects
 */
export class BaseCMI {
  jsonString = false;
  #initialized = false;

  /**
   * Getter for #initialized
   * @return {boolean}
   */
  get initialized() {
    return this.#initialized;
  }

  /**
   * Called when the API has been initialized after the CMI has been created
   */
  initialize() {
    this.#initialized = true;
  }
}

/**
 * Base class for cmi *.score objects
 */
export class CMIScore extends BaseCMI {
  /**
   * Constructor for *.score
   * @param {string} score_children
   * @param {string} score_range
   * @param {string} max
   * @param {number} invalidErrorCode
   * @param {number} invalidTypeCode
   * @param {number} invalidRangeCode
   * @param {string} decimalRegex
   */
  constructor(
      {
        score_children,
        score_range,
        max,
        invalidErrorCode,
        invalidTypeCode,
        invalidRangeCode,
        decimalRegex,
      }) {
    super();

    this.#_children = score_children ?
        score_children :
        scorm12_constants.score_children;
    this.#_score_range = !score_range ? false : scorm12_regex.score_range;
    this.#max = (max || max === '') ? max : '100';
    this.#_invalid_error_code = invalidErrorCode ?
        invalidErrorCode :
        scorm12_error_codes.INVALID_SET_VALUE;
    this.#_invalid_type_code = invalidTypeCode ?
        invalidTypeCode :
        scorm12_error_codes.TYPE_MISMATCH;
    this.#_invalid_range_code = invalidRangeCode ?
        invalidRangeCode :
        scorm12_error_codes.VALUE_OUT_OF_RANGE;
    this.#_decimal_regex = decimalRegex ?
        decimalRegex :
        scorm12_regex.CMIDecimal;
  }

  #_children;
  #_score_range;
  #_invalid_error_code;
  #_invalid_type_code;
  #_invalid_range_code;
  #_decimal_regex;
  #raw = '';
  #min = '';
  #max;

  /**
   * Getter for _children
   * @return {string}
   * @private
   */
  get _children() {
    return this.#_children;
  }

  /**
   * Setter for _children. Just throws an error.
   * @param {string} _children
   * @private
   */
  set _children(_children) {
    throw new ValidationError(this.#_invalid_error_code);
  }

  /**
   * Getter for #raw
   * @return {string}
   */
  get raw() {
    return this.#raw;
  }

  /**
   * Setter for #raw
   * @param {string} raw
   */
  set raw(raw) {
    if (checkValidFormat(raw, this.#_decimal_regex,
        this.#_invalid_type_code) &&
        (!this.#_score_range ||
            checkValidRange(raw, this.#_score_range,
                this.#_invalid_range_code))) {
      this.#raw = raw;
    }
  }

  /**
   * Getter for #min
   * @return {string}
   */
  get min() {
    return this.#min;
  }

  /**
   * Setter for #min
   * @param {string} min
   */
  set min(min) {
    if (checkValidFormat(min, this.#_decimal_regex,
        this.#_invalid_type_code) &&
        (!this.#_score_range ||
            checkValidRange(min, this.#_score_range,
                this.#_invalid_range_code))) {
      this.#min = min;
    }
  }

  /**
   * Getter for #max
   * @return {string}
   */
  get max() {
    return this.#max;
  }

  /**
   * Setter for #max
   * @param {string} max
   */
  set max(max) {
    if (checkValidFormat(max, this.#_decimal_regex,
        this.#_invalid_type_code) &&
        (!this.#_score_range ||
            checkValidRange(max, this.#_score_range,
                this.#_invalid_range_code))) {
      this.#max = max;
    }
  }

  /**
   * toJSON for *.score
   * @return {{min: string, max: string, raw: string}}
   */
  toJSON() {
    return {
      'raw': this.raw,
      'min': this.min,
      'max': this.max,
    };
  }
}

/**
 * Base class for cmi *.n objects
 */
export class CMIArray extends BaseCMI {
  /**
   * Constructor cmi *.n arrays
   * @param {string} children
   * @param {number} errorCode
   */
  constructor({children, errorCode}) {
    super();
    this.#_children = children;
    this.#errorCode = errorCode;
    this.childArray = [];
  }

  #errorCode;
  #_children;

  /**
   * Getter for _children
   * @return {*}
   * @private
   */
  get _children() {
    return this.#_children;
  }

  /**
   * Setter for _children. Just throws an error.
   * @param {string} _children
   * @private
   */
  set _children(_children) {
    throw new ValidationError(this.#errorCode);
  }

  /**
   * Getter for _count
   * @return {number}
   * @private
   */
  get _count() {
    return this.childArray.length;
  }

  /**
   * Setter for _count. Just throws an error.
   * @param {number} _count
   * @private
   */
  set _count(_count) {
    throw new ValidationError(this.#errorCode);
  }

  /**
   * toJSON for *.n arrays
   * @return {object}
   */
  toJSON() {
    this.jsonString = true;
    const result = {};
    for (let i = 0; i < this.childArray.length; i++) {
      result[i + ''] = this.childArray[i];
    }
    delete this.jsonString;
    return result;
  }
}
