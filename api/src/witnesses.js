import { randomBytes } from './utils.js';
export const createWitnessProviders = (privateState, context) => ({
    userSecretKey: (ctx) => {
        return [privateState, privateState.userSecretKey];
    },
    betAmount: (ctx) => {
        const amount = context?.betAmount ?? 0n;
        return [privateState, amount];
    },
    betSide: (ctx) => {
        const side = context?.betSide ?? 0n;
        return [privateState, side];
    },
    betNonce: (ctx) => {
        const nonce = randomBytes(32);
        return [privateState, nonce];
    },
    wagerAmountInput: (ctx) => {
        const amount = context?.wagerAmount ?? 0n;
        return [privateState, amount];
    },
    callerAddress: (ctx) => {
        return [privateState, new Uint8Array(32).fill(0)];
    },
});
//# sourceMappingURL=witnesses.js.map