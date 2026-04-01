export function ledger(stateOrChargedState: any): {
    readonly state: number;
    readonly question: string;
    readonly endTime: bigint;
    readonly outcome: {
        is_some: boolean;
        value: bigint;
    };
    readonly totalYesBets: bigint;
    readonly totalNoBets: bigint;
    readonly totalBets: bigint;
    betCommitments: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): Uint8Array<ArrayBufferLike>;
        [Symbol.iterator](...args_0: any[]): any;
    };
};
export const MarketState: any;
export class Contract {
    constructor(...args_0: any[]);
    witnesses: any;
    circuits: {
        placeBet: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        closeMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        resolveMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: __compactRuntime.Value;
                    alignment: __compactRuntime.Alignment;
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        claimWinnings: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        getYesTotal(context: any, ...args_1: any[]): {
            result: never[];
            context: any;
        };
        getNoTotal(context: any, ...args_1: any[]): {
            result: never[];
            context: any;
        };
        getBetCount(context: any, ...args_1: any[]): {
            result: never[];
            context: any;
        };
    };
    impureCircuits: {
        placeBet: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        closeMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        resolveMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: __compactRuntime.Value;
                    alignment: __compactRuntime.Alignment;
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        claimWinnings: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
    };
    provableCircuits: {
        placeBet: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        closeMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        resolveMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: __compactRuntime.Value;
                    alignment: __compactRuntime.Alignment;
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        claimWinnings: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: never[];
                    alignment: never[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
    };
    initialState(...args_0: any[]): {
        currentContractState: __compactRuntime.ContractState;
        currentPrivateState: any;
        currentZswapLocalState: __compactRuntime.EncodedZswapLocalState;
    };
    _some_0(value_0: any): {
        is_some: boolean;
        value: any;
    };
    _none_0(): {
        is_some: boolean;
        value: bigint;
    };
    _persistentHash_0(value_0: any): Uint8Array<ArrayBufferLike>;
    _persistentHash_1(value_0: any): Uint8Array<ArrayBufferLike>;
    _userSecretKey_0(context: any, partialProofData: any): any;
    _betAmount_0(context: any, partialProofData: any): bigint;
    _betSide_0(context: any, partialProofData: any): bigint;
    _betNonce_0(context: any, partialProofData: any): any;
    _placeBet_0(context: any, partialProofData: any): never[];
    _closeMarket_0(context: any, partialProofData: any): never[];
    _resolveMarket_0(context: any, partialProofData: any, result_0: any): never[];
    _claimWinnings_0(context: any, partialProofData: any): never[];
    _getYesTotal_0(): never[];
    _getNoTotal_0(): never[];
    _getBetCount_0(): never[];
}
export namespace pureCircuits {
    function getYesTotal(...args_0: any[]): never[];
    function getNoTotal(...args_0: any[]): never[];
    function getBetCount(...args_0: any[]): never[];
}
export namespace contractReferenceLocations {
    let tag: string;
    let indices: {};
}
import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
//# sourceMappingURL=index.d.ts.map