// Escape user input before using it in a MongoDB $regex / RegExp so searches
// like "c++" or "(beginner" match literally instead of throwing or backtracking.
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = escapeRegex;
