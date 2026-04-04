const crypto = require('node:crypto');

const mnemonic = process.argv.slice(2).join(' ');

if (!mnemonic || mnemonic.split(' ').length < 12) {
  console.error('Error: Please provide a valid mnemonic (at least 12 words) as arguments.');
  console.log('\nUsage: node scripts/mnemonic-to-seed.js "word1 word2 ... word12"');
  process.exit(1);
}

// BIP39 seed derivation
// salt is "mnemonic" + optional passphrase (we assume empty passphrase)
const salt = 'mnemonic';
const iterations = 2048;
const keylen = 64;
const digest = 'sha512';

console.log('\nConverting mnemonic to seed...');
console.log('Mnemonic:', mnemonic);

crypto.pbkdf2(mnemonic, salt, iterations, keylen, digest, (err, derivedKey) => {
  if (err) {
    console.error('Error during derivation:', err);
    process.exit(1);
  }
  
  const seedHex = derivedKey.toString('hex');
  console.log('\n✅ Conversion successful!');
  console.log('--------------------------------------------------');
  console.log('SEED (HEX):', seedHex);
  console.log('--------------------------------------------------');
  console.log('\nYou can now use this SEED in your .env.local file:');
  console.log('ADMIN_SEED=' + seedHex);
});
