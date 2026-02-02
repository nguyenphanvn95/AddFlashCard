// SQL.js Placeholder
// This is a placeholder file. You need to download the actual sql-wasm.js

console.warn('⚠️ SQL.js is not properly installed!');
console.warn('📋 To enable APKG export:');
console.warn('1. Download: https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js');
console.warn('2. Download: https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm');
console.warn('3. Place both files in the vendor/ directory');
console.warn('4. Or run: ./download-sql-js.sh');
console.warn('📖 See SETUP_SQL_JS.md for detailed instructions');

// Create a stub to prevent errors
window.initSqlJs = function() {
  return Promise.reject(new Error(
    'SQL.js is not installed. Please download sql-wasm.js and sql-wasm.wasm to the vendor/ directory. ' +
    'See SETUP_SQL_JS.md for instructions.'
  ));
};
