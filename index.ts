import { parseT, parseX } from "./generated";

let json = JSON.parse('{ "n": 1, "s": "a", "b": true, "u": null, "x": { "n": 1 } }');
let v = parseT(json);

let r = parseX({});
