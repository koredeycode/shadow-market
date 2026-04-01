export function ledger(stateOrChargedState: any): {
    readonly adminKey: Uint8Array<ArrayBufferLike>;
    readonly isInitialized: bigint;
    readonly marketCount: bigint;
    readonly wagerCount: bigint;
    marketIds: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    marketStatus: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    marketEndTime: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    marketOutcome: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    poolYesTotal: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    poolNoTotal: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    poolBetCount: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    readonly poolBetIdCounter: bigint;
    poolBetCommitments: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): Uint8Array<ArrayBufferLike>;
        [Symbol.iterator](...args_0: any[]): any;
    };
    poolBetClaimed: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    poolBetMarketId: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    poolBetUserKey: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): Uint8Array<ArrayBufferLike>;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerMarketId: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerCreatorKey: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): Uint8Array<ArrayBufferLike>;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerTakerKey: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): Uint8Array<ArrayBufferLike>;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerAmount: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerMatchAmount: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerSide: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerOddsNum: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerOddsDenom: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerStatus: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    wagerClaimed: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
    marketWagerCount: {
        isEmpty(...args_0: any[]): boolean;
        size(...args_0: any[]): bigint;
        member(...args_0: any[]): boolean;
        lookup(...args_0: any[]): bigint;
        [Symbol.iterator](...args_0: any[]): any;
    };
};
export class Contract {
    constructor(...args_0: any[]);
    witnesses: any;
    circuits: {
        initialize: (...args_1: any[]) => {
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
        createMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        placeBet: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        createWager: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        acceptWager: (...args_1: any[]) => {
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
        cancelWager: (...args_1: any[]) => {
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
        lockMarket: (...args_1: any[]) => {
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
        resolveMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        claimPoolWinnings: (...args_1: any[]) => {
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
        claimWagerWinnings: (...args_1: any[]) => {
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
    };
    impureCircuits: {
        initialize: (...args_1: any[]) => {
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
        createMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        placeBet: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        createWager: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        acceptWager: (...args_1: any[]) => {
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
        cancelWager: (...args_1: any[]) => {
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
        lockMarket: (...args_1: any[]) => {
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
        resolveMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        claimPoolWinnings: (...args_1: any[]) => {
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
        claimWagerWinnings: (...args_1: any[]) => {
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
    };
    provableCircuits: {
        initialize: (...args_1: any[]) => {
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
        createMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        placeBet: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        createWager: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        acceptWager: (...args_1: any[]) => {
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
        cancelWager: (...args_1: any[]) => {
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
        lockMarket: (...args_1: any[]) => {
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
        resolveMarket: (...args_1: any[]) => {
            result: any[];
            context: any;
            proofData: {
                input: {
                    value: Uint8Array<ArrayBufferLike>[];
                    alignment: __compactRuntime.AlignmentSegment[];
                };
                output: undefined;
                publicTranscript: never[];
                privateTranscriptOutputs: never[];
            };
            gasCost: any;
        };
        claimPoolWinnings: (...args_1: any[]) => {
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
        claimWagerWinnings: (...args_1: any[]) => {
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
    };
    initialState(...args_0: any[]): {
        currentContractState: __compactRuntime.ContractState;
        currentPrivateState: any;
        currentZswapLocalState: __compactRuntime.EncodedZswapLocalState;
    };
    _persistentHash_0(value_0: any): Uint8Array<ArrayBufferLike>;
    _persistentHash_1(value_0: any): Uint8Array<ArrayBufferLike>;
    _userSecretKey_0(context: any, partialProofData: any): any;
    _betAmount_0(context: any, partialProofData: any): bigint;
    _betSide_0(context: any, partialProofData: any): bigint;
    _betNonce_0(context: any, partialProofData: any): any;
    _wagerAmountInput_0(context: any, partialProofData: any): bigint;
    _initialize_0(context: any, partialProofData: any): never[];
    _createMarket_0(context: any, partialProofData: any, endTime_0: any, minBet_0: any): never[];
    _placeBet_0(context: any, partialProofData: any, marketId_0: any, side_0: any): never[];
    _createWager_0(context: any, partialProofData: any, marketId_0: any, side_0: any, oddsNumerator_0: any, oddsDenominator_0: any): never[];
    _acceptWager_0(context: any, partialProofData: any, wagerId_0: any): never[];
    _cancelWager_0(context: any, partialProofData: any, wagerId_0: any): never[];
    _lockMarket_0(context: any, partialProofData: any, marketId_0: any): never[];
    _resolveMarket_0(context: any, partialProofData: any, marketId_0: any, outcome_0: any): never[];
    _claimPoolWinnings_0(context: any, partialProofData: any, betId_0: any): never[];
    _claimWagerWinnings_0(context: any, partialProofData: any, wagerId_0: any): never[];
}
export const pureCircuits: {};
export namespace contractReferenceLocations {
    let tag: string;
    let indices: {};
}
import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
//# sourceMappingURL=index.d.ts.map