// The last key that was pressed
let lastKey;

// The current line
let keyBuffer = '';

let scrollback = ["JavaScript REPL"];
let history = [];

// Similar to the Python convention
let _ = null;

// Config constants
const SCROLLBACK_COLOR = 15;

// Environment
const SCREEN_HEIGHT = 20; // In characters
const SCROLLBACK_HEIGHT = 18;
const FIRST_PRINTABLE_CHARACTER = 32;

const SPACE = 32; // First printable ASCII character

const MAX_BUFFER_LENGTH = 49;

// Control characters
const BACKSPACE = 8;
const TAB = 9;
const ENTER = 10;
const UP = 17;
const DOWN = 18;
const LEFT = 19;
const RIGHT = 20;
const ESCAPE = 27;
const DEL = 127;

function getName() {
    return 'REPL';
}

function onConnect() {
    // Reset the server variables when a new user connects:
    lastKey = '';
}

function onUpdate() {
    // It is safe to completely redraw the screen during every update:
    clearScreen();

    const displayHeight = Math.min(scrollback.length, SCROLLBACK_HEIGHT);
    const unseenLines = Math.max(scrollback.length - SCROLLBACK_HEIGHT, 0);
    for (let i = 0; i < displayHeight; i++) {
        drawText(sanitize(scrollback[i + unseenLines]), SCROLLBACK_COLOR, 0, i)
    }
    
    drawText("> " + sanitize(keyBuffer) + "█", 17, 0, SCREEN_HEIGHT - 1);
}

function onInput(key) {
    // Remember the last key pressed:
    lastKey = key.toString();

    switch (key) {
        case BACKSPACE:
            if (keyBuffer.length > 0) {
                keyBuffer = keyBuffer.substring(0, keyBuffer.length - 1);
            }
            break;
        case ENTER:
            if (keyBuffer.length > 0) {

                try {
                    scrollback.push(keyBuffer);
                    _ = eval(keyBuffer);
                    if (_ === null) {
                        scrollback.push("null");
                    }
                    else if (_ === undefined) {
                        scrollback.push("undefined");
                    }
                    else {
                        scrollback.push(_.toString());
                    }
                }
                catch (error) {
                    scrollback.push(error.toString());
                }
            }
            keyBuffer = '';
            break;
        case TAB:
        case ESCAPE:
        case DEL:
            // noop
            break;
        default:
            // Add text
            if (key >= FIRST_PRINTABLE_CHARACTER && keyBuffer.length < MAX_BUFFER_LENGTH) {
                keyBuffer = keyBuffer + String.fromCharCode(key);
                saveData(keyBuffer);
            }
    }
}

// Some characters aren't printable, so I replace them with the most reasonable-looking substitute possible.
function sanitize(input) {
    input = input.replace(/=/g, "═");
    input = input.replace(/\|/g, "║");
    input = input.replace(/~/g, "™");
    input = input.replace(/@/g, "☺");
    input = input.replace(/\$/g, "♣");
    input = input.replace(/_/g, "▄");
    input = input.replace(/\{/g, "╣");
    input = input.replace(/\}/g, "╠");

    return input;
}