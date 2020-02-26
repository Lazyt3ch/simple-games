export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function randomInt(n) {
    return Math.floor(Math.random() * Math.floor(n));
}

export function pxToNum(pixels) {
    if (typeof pixels === 'string' && pixels.endsWith('px')) {
        return parseInt(pixels.slice(0, pixels.length - 2));
    } else {
        return null;
    }
}
