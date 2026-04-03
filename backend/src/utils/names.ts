const ADJECTIVES = [
  'Swift', 'Silent', 'Dark', 'Golden', 'Electric', 'Lunar', 'Neon', 'Spectral', 
  'Hyper', 'Cyber', 'Shadow', 'Midnight', 'Ethereal', 'Quantum', 'Cosmic', 'Void'
];

const NOUNS = [
  'Falcon', 'Phantom', 'Ghost', 'Specter', 'Vortex', 'Pulse', 'Cipher', 'Entity',
  'Knight', 'Seeker', 'Hunter', 'Drifter', 'Nomad', 'Oracle', 'Agent', 'Runner'
];

/**
 * Generates a random username like "Swift-Falcon-42"
 */
export function generateRandomUsername(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}-${noun}-${number}`;
}
