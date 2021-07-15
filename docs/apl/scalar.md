<div class="axi-header">
  <h1>Scalar functions</h1>
</div>

## String functions

| **Function Name** | **Description**    |
|--------------|---------------------|
|`base64_encode_tostring()`|Encodes a string as base64 string.|
|`base64_decode_tostring()`|Decodes a base64 string to a UTF-8 string.|
|`countof()`|Counts occurrences of a substring in a string. Plain string matches may overlap; regex matches don't.|
|`extract()`|Get a match for a regular expression from a text string.|
|`extract_all()`|Get all matches for a regular expression from a text string.|
|`indexof()`|Function reports the zero-based index of the first occurrence of a specified string within input string.|
|`isempty()`|Returns true if the argument is an empty string or is null.|
|`isnotempty()`|Returns true if the argument isn't an empty string or a null.|
|`isnotnull()`|Returns true if the argument is not null.|
|`isnull()`|Evaluates its sole argument and returns a bool value indicating if the argument evaluates to a null value.|
|`parse_ipv4()`|Converts input to long (signed 64-bit) number representation.|
|`parse_ipv4_mask()`|Converts input string and IP-prefix mask to long (signed 64-bit) number representation.|
|`parse_json()`|Interprets a string as a JSON value) and returns the value as dynamic.|
|`parse_url()`|Parses an absolute URL string and returns a dynamic object contains all parts of the URL.|
|`parse_urlquery()`|Parses a url query string and returns a dynamic object contains the Query parameters.|
|`replace()`| Replace all regex matches with another string.|
|`reverse()`| Function makes reverse of input string.|
|`split()`| Splits a given string according to a given delimiter and returns a string array with the contained substrings.
| `strcat()`| Concatenates between 1 and 64 arguments.
|`strcat_delim()`	| Concatenates between 2 and 64 arguments, with delimiter, provided as first argument.
|`strcmp()`	| Compares two strings.
|`strlen()`	| Returns the length, in characters, of the input string.
|`strrep()`	| Repeats given string provided number of times (default = 1).
|`substring()`	| Extracts a substring from a source string starting from some index to the end of the string.
|`toupper()`	| Converts a string to upper case.
|`translate()`	| Replaces a set of characters ('searchList') with another set of characters ('replacementList') in a given a string.
|`trim()`	| Removes all leading and trailing matches of the specified regular expression.
|`trim_end()`	| Removes trailing match of the specified regular expression.
|`trim_start()`	| Removes leading match of the specified regular expression.
|`url_decode()`	| The function converts encoded URL into a regular URL representation.
|`url_encode()`	| The function converts characters of the input URL into a format that can be transmitted over the Internet.