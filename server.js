// Config constants
const SCROLLBACK_INPUT_COLOR = 10;
const SCROLLBACK_OUTPUT_COLOR = 16;
const SCROLLBACK_ERROR_COLOR = 8;
const MAX_BUFFER_LENGTH = 49;

// Environment
const SCREEN_WIDTH = 56;
const SCREEN_HEIGHT = 20; // In characters
const SCROLLBACK_HEIGHT = 19;
const FIRST_PRINTABLE_CHARACTER = 32;

const SPACE = 32; // First printable ASCII character

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

const Mode = {
    EDIT: 0,
    SCROLL: 1,
};



// Global variables (blech)
let lastKey = ''; // The last key that was pressed
let keyBuffer = ''; // The current line
let _ = null; // Similar to the Python convention
let currentMode = Mode.EDIT;
let scrollback = [{ text: "JavaScript REPL", color: SCROLLBACK_OUTPUT_COLOR }];
let history = [];
let scrollOffsetFromEnd = 0;


function getName() {
    return 'REPL';
}

function onConnect() {
    render();
}

function onUpdate() {

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
                    scrollback.push({ text: keyBuffer, color: SCROLLBACK_INPUT_COLOR });
                    history.push(keyBuffer);
                    _ = eval(keyBuffer);
                    if (_ === null) {
                        scrollback.push({ text: "null", color: SCROLLBACK_OUTPUT_COLOR });
                    }
                    else if (_ === undefined) {
                        scrollback.push({ text: "undefined", color: SCROLLBACK_OUTPUT_COLOR });
                    }
                    else {
                        const result = _.toString();
                        output(result, SCROLLBACK_OUTPUT_COLOR);
                    }
                }
                catch (error) {
                    output(error.toString(), SCROLLBACK_ERROR_COLOR);
                }
            }
            keyBuffer = '';
            scrollOffsetFromEnd = 0;
            break;
        case TAB:
        case ESCAPE:
        case DEL:
            // noop
            break;
        case UP: {
            const unseenLinesFromStart = Math.max(scrollback.length - SCROLLBACK_HEIGHT, 0);
            if (scrollOffsetFromEnd < unseenLinesFromStart) {
                scrollOffsetFromEnd += 1;
            }
            break;
        }
        case DOWN: {
            if (scrollOffsetFromEnd > 0) {
                scrollOffsetFromEnd -= 1;
            }
        }

        default:
            // Add text
            if (key >= FIRST_PRINTABLE_CHARACTER && keyBuffer.length < MAX_BUFFER_LENGTH) {
                keyBuffer = keyBuffer + String.fromCharCode(key);
            }
    }

    render();
}

// Some characters aren't available in the display font,
// so I replace them with reasonable-looking substitutes.
function sanitize(input) {
    input = input.replace(/=/g, "???");
    input = input.replace(/\|/g, "???");
    input = input.replace(/~/g, "???");
    input = input.replace(/@/g, "???");
    input = input.replace(/\$/g, "???");
    input = input.replace(/_/g, "???");
    input = input.replace(/\{/g, "???");
    input = input.replace(/\}/g, "???");

    return input;
}

// Output text, wrapping it across multiple lines if necessary
function output(text, color) {
    const result = text.toString();

    for (let s = 0; s < (result.length / SCREEN_WIDTH); s++) { // Break the output into chunks the size of the screen's width
        const segment = result.slice(s * SCREEN_WIDTH, (s + 1) * SCREEN_WIDTH);

        scrollback.push({ text: segment, color: color });
    }
}

function render() {

    // It is safe to completely redraw the screen during every update:
    clearScreen();

    const displayHeight = Math.min(scrollback.length, SCROLLBACK_HEIGHT);
    const unseenLinesFromStart = Math.max(scrollback.length - SCROLLBACK_HEIGHT, 0);
    for (let i = 0; i < displayHeight; i++) {
        const entry = scrollback[i + unseenLinesFromStart - scrollOffsetFromEnd];
        drawText(sanitize(entry.text), entry.color, 0, i)
    }

    drawText("> " + sanitize(keyBuffer) + "???", 17, 0, SCREEN_HEIGHT - 1);
}