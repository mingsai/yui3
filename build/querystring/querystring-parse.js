YUI.add('querystring-parse', function(Y) {

/**
 * <p>The QueryString module adds support for serializing JavaScript objects into
 * query strings and parsing JavaScript objects from query strings format.</p>
 *
 * <p>The QueryString namespace is added to your YUI instance including static methods
 * Y.QueryString.parse(..) and Y.QueryString.stringify(..).</p>
 *
 * <p>The <code>querystring</code> module is a rollup of <code>querystring-parse</code> and
 * <code>querystring-stringify</code>.</p>
 * 
 * <p>As their names suggest, <code>querystring-parse</code> adds support for parsing
 * Query String data (Y.QueryString.parse) and <code>querystring-stringify</code> for serializing
 * JavaScript data into Query Strings (Y.QueryString.stringify).  You may choose to
 * include either of the submodules individually if you don't need the
 * complementary functionality, or include the rollup for both.</p>
 *
 * @module querystring
 * @class QueryString
 * @static
 */
var QueryString = Y.namespace("QueryString");

/**
 * Provides Y.QueryString.parse method to accept Query Strings and return native
 * JavaScript objects.
 *
 * @module querystring
 * @submodule querystring-parse
 * @for QueryString
 * @static
 */
QueryString.parse = function (qs, sep, eq) {
    // wouldn't Y.Array(qs.split()).map(pieceParser(eq)).reduce(mergeParams) be prettier?
    return Y.Array.reduce(
        Y.Array.map(
            qs.split(sep || "&"),
            pieceParser(eq || "=")
        ),
        mergeParams
    );
};


// Parse a key=val string.
// These can get pretty hairy
// example flow:
// parse(foo[bar][][bla]=baz)
// return parse(foo[bar][][bla],"baz")
// return parse(foo[bar][], {bla : "baz"})
// return parse(foo[bar], [{bla:"baz"}])
// return parse(foo, {bar:[{bla:"baz"}]})
// return {foo:{bar:[{bla:"baz"}]}}
var pieceParser = function (eq) {
    return function parsePiece (key, val) {
        if (arguments.length !== 2) {
            // key=val, called from the map/reduce
            key = key.split(eq);
            return parsePiece(
                decodeURIComponent(key.shift().replace(/\+/g, " ")),
                decodeURIComponent(key.join(eq))
            );
        }
        key = key.replace(/^\s+|\s+$/g, '');
        if (Y.Lang.isString(val)) {
            val = val.replace(/^\s+|\s+$/g, '');
            // convert numerals to numbers
            if (!isNaN(val)) {
                var numVal = +val;
                if (val === numVal.toString(10)) val = numVal;
            }
        }
        var sliced = /(.*)\[([^\]]*)\]$/.exec(key);
        if (!sliced) {
            var ret = {};
            if (key) ret[key] = val;
            return ret;
        }
        // ["foo[][bar][][baz]", "foo[][bar][]", "baz"]
        var tail = sliced[2], head = sliced[1];

        // array: key[]=val
        if (!tail) return parsePiece(head, [val]);

        // obj: key[subkey]=val
        var ret = {};
        ret[tail] = val;
        return parsePiece(head, ret);
    };
};

// the reducer function that merges each query piece together into one set of params
function mergeParams (params, addition) {
    return (
        // if it's uncontested, then just return the addition.
        (!params) ? addition
        // if the existing value is an array, then concat it.
        : (Y.Lang.isArray(params)) ? params.concat(addition)
        // if the existing value is not an array, and either are not objects, arrayify it.
        : (!Y.Lang.isObject(params) || !Y.Lang.isObject(addition)) ? [params].concat(addition)
        // else merge them as objects, which is a little more complex
        : mergeObjects(params, addition)
    );
};

// Merge two *objects* together. If this is called, we've already ruled
// out the simple cases, and need to do the for-in business.
function mergeObjects (params, addition) {
    for (var i in addition) if (i && addition.hasOwnProperty(i)) {
        params[i] = mergeParams(params[i], addition[i]);
    }
    return params;
};


}, '@VERSION@' ,{requires:['collection']});
