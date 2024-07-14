const BUTTON_LEFT = 0;
const BUTTON_RIGHT = 2;
const PIXEL_RATIO = window.devicePixelRatio;
const DOUBLE_CLICK_TIME = 300;

const TAU = 2 * Math.PI;

function copymap(map) {
    if (map === null) {
        return null;
    } else {
        return new Map(JSON.parse(JSON.stringify(Array.from(map))));
    }
}

function deepcopyobj(obj) {
    if (obj === null) {
        return null;
    } else if (obj === true) {
        return true;
    } else if (obj === false) {
        return false;
    } else {
        return JSON.parse(JSON.stringify(obj));
    }
}
