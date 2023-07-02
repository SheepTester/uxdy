/**
 * Returns the first digit of `roomNum`. If the room number is in the basement,
 * the floor number will be negative. If the room number isn't a number, it's
 * presumed to be on floor 0.
 *
 * This isn't perfect, but it's just a helper function for `compareRoomNums`. If
 * the floor numbers of two room numbers are the same, they'll be compared
 * alphanumerically. Otherwise, they'll be sorted by this floor number.
 */
function getFloor (roomNum: string): number {
  const digit = roomNum.match(/\d/)
  if (digit) {
    const basement = roomNum.startsWith('B')
    return basement ? -digit[0] : +digit[0]
  } else {
    // eg PRICE THTRE, JEANN AUD, RBC GARDN
    return 0
  }
}

/**
 * A comparator function for room numbers, so basement rooms get sorted before
 * positive floor numbers.
 */
export function compareRoomNums (a: string, b: string): number {
  const aFloor = getFloor(a)
  const bFloor = getFloor(b)
  if (aFloor !== bFloor) {
    // Sort different floor room numbers by their floor numbers (see
    // `getFloor`), so MANDE B260 goes before MANDE B150, and RBC AUD goes
    // before RBC 1301
    return aFloor - bFloor
  } else {
    // Sort room numbers on the same floor alphanumerically, so CSE B230 goes
    // before CSE B240
    return a.localeCompare(b)
  }
}
