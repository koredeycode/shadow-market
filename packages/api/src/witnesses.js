import { randomBytes } from './utils.js';
let _betAmount = 0n;
let _betSide = 0;
let _betNonce = new Uint8Array(32);
let _wagerAmount = 0n;
export const setBetContext = (amount, side, nonce) => {
    _betAmount = amount;
    _betSide = side;
    _betNonce = nonce ?? new Uint8Array(32);
    if (!nonce) {
        const randomBits = randomBytes(16);
        _betNonce.set(randomBits, 0);
    }
};
export const setWagerAmount = (amount) => {
    _wagerAmount = amount;
};
export const createWitnessProviders = (privateState) => ({
    userSecretKey: (ctx) => {
        return [privateState, privateState.userSecretKey];
    },
    betAmount: (ctx) => {
        return [privateState, _betAmount];
    },
    betSide: (ctx) => {
        return [privateState, _betSide];
    },
    betNonce: (ctx) => {
        return [privateState, _betNonce];
    },
    wagerAmountInput: (ctx) => {
        return [privateState, _wagerAmount];
    },
});
//# sourceMappingURL=witnesses.js.map