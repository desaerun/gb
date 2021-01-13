
/**
 * Gets a random member from an array.
 * @param arr - the array
 * @returns {*} - a random member from the array
 */
exports.getRandomArrayMember = function getRandomArrayMember(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Picks a random number between min and max (inclusive)
 * @param min
 * @param max
 * @returns {number}
 */
exports.getRand = function getRand(min,max) {
    return Math.floor(min + (Math.random() * (max-min)));
}