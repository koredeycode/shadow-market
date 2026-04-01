import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.15.0');
export var MarketState;
(function (MarketState) {
    MarketState[MarketState['OPEN'] = 0] = 'OPEN';
    MarketState[MarketState['CLOSED'] = 1] = 'CLOSED';
    MarketState[MarketState['RESOLVED'] = 2] = 'RESOLVED';
})(MarketState || (MarketState = {}));
const _descriptor_0 = new __compactRuntime.CompactTypeEnum(2, 1);
const _descriptor_1 = __compactRuntime.CompactTypeField;
const _descriptor_2 = new __compactRuntime.CompactTypeBytes(32);
const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);
const _descriptor_4 = new __compactRuntime.CompactTypeVector(2, _descriptor_1);
const _descriptor_5 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);
const _descriptor_6 = __compactRuntime.CompactTypeBoolean;
class _Either_0 {
    alignment() {
        return _descriptor_6.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment()));
    }
    fromValue(value_0) {
        return {
            is_left: _descriptor_6.fromValue(value_0),
            left: _descriptor_2.fromValue(value_0),
            right: _descriptor_2.fromValue(value_0)
        };
    }
    toValue(value_0) {
        return _descriptor_6.toValue(value_0.is_left).concat(_descriptor_2.toValue(value_0.left).concat(_descriptor_2.toValue(value_0.right)));
    }
}
const _descriptor_7 = new _Either_0();
const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);
class _ContractAddress_0 {
    alignment() {
        return _descriptor_2.alignment();
    }
    fromValue(value_0) {
        return {
            bytes: _descriptor_2.fromValue(value_0)
        };
    }
    toValue(value_0) {
        return _descriptor_2.toValue(value_0.bytes);
    }
}
const _descriptor_9 = new _ContractAddress_0();
const _descriptor_10 = __compactRuntime.CompactTypeOpaqueString;
const _descriptor_11 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);
export class Contract {
    witnesses;
    constructor(...args_0) {
        if (args_0.length !== 1) {
            throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
        }
        const witnesses_0 = args_0[0];
        if (typeof (witnesses_0) !== 'object') {
            throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
        }
        if (typeof (witnesses_0.userSecretKey) !== 'function') {
            throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named userSecretKey');
        }
        if (typeof (witnesses_0.betAmount) !== 'function') {
            throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named betAmount');
        }
        if (typeof (witnesses_0.betSide) !== 'function') {
            throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named betSide');
        }
        this.witnesses = witnesses_0;
        this.circuits = {
            placeBet: (...args_1) => {
                if (args_1.length !== 1) {
                    throw new __compactRuntime.CompactError(`placeBet: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
                }
                const contextOrig_0 = args_1[0];
                if (!(typeof (contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
                    __compactRuntime.typeError('placeBet', 'argument 1 (as invoked from Typescript)', 'market-stub.compact line 40 char 1', 'CircuitContext', contextOrig_0);
                }
                const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
                const partialProofData = {
                    input: { value: [], alignment: [] },
                    output: undefined,
                    publicTranscript: [],
                    privateTranscriptOutputs: []
                };
                const result_0 = this._placeBet_0(context, partialProofData);
                partialProofData.output = { value: [], alignment: [] };
                return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
            },
            closeMarket: (...args_1) => {
                if (args_1.length !== 1) {
                    throw new __compactRuntime.CompactError(`closeMarket: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
                }
                const contextOrig_0 = args_1[0];
                if (!(typeof (contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
                    __compactRuntime.typeError('closeMarket', 'argument 1 (as invoked from Typescript)', 'market-stub.compact line 59 char 1', 'CircuitContext', contextOrig_0);
                }
                const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
                const partialProofData = {
                    input: { value: [], alignment: [] },
                    output: undefined,
                    publicTranscript: [],
                    privateTranscriptOutputs: []
                };
                const result_0 = this._closeMarket_0(context, partialProofData);
                partialProofData.output = { value: [], alignment: [] };
                return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
            },
            resolveMarket: (...args_1) => {
                if (args_1.length !== 2) {
                    throw new __compactRuntime.CompactError(`resolveMarket: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
                }
                const contextOrig_0 = args_1[0];
                const outcome_0 = args_1[1];
                if (!(typeof (contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
                    __compactRuntime.typeError('resolveMarket', 'argument 1 (as invoked from Typescript)', 'market-stub.compact line 65 char 1', 'CircuitContext', contextOrig_0);
                }
                if (!(typeof (outcome_0) === 'bigint' && outcome_0 >= 0 && outcome_0 <= __compactRuntime.MAX_FIELD)) {
                    __compactRuntime.typeError('resolveMarket', 'argument 1 (argument 2 as invoked from Typescript)', 'market-stub.compact line 65 char 1', 'Field', outcome_0);
                }
                const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
                const partialProofData = {
                    input: {
                        value: _descriptor_1.toValue(outcome_0),
                        alignment: _descriptor_1.alignment()
                    },
                    output: undefined,
                    publicTranscript: [],
                    privateTranscriptOutputs: []
                };
                const result_0 = this._resolveMarket_0(context, partialProofData, outcome_0);
                partialProofData.output = { value: [], alignment: [] };
                return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
            }
        };
        this.impureCircuits = {
            placeBet: this.circuits.placeBet,
            closeMarket: this.circuits.closeMarket,
            resolveMarket: this.circuits.resolveMarket
        };
        this.provableCircuits = {
            placeBet: this.circuits.placeBet,
            closeMarket: this.circuits.closeMarket,
            resolveMarket: this.circuits.resolveMarket
        };
    }
    initialState(...args_0) {
        if (args_0.length !== 2) {
            throw new __compactRuntime.CompactError(`Contract state constructor: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
        }
        const constructorContext_0 = args_0[0];
        const marketQuestion_0 = args_0[1];
        if (typeof (constructorContext_0) !== 'object') {
            throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
        }
        if (!('initialPrivateState' in constructorContext_0)) {
            throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
        }
        if (!('initialZswapLocalState' in constructorContext_0)) {
            throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
        }
        if (typeof (constructorContext_0.initialZswapLocalState) !== 'object') {
            throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
        }
        const state_0 = new __compactRuntime.ContractState();
        let stateValue_0 = __compactRuntime.StateValue.newArray();
        stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
        stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
        stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
        stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
        stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
        stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
        state_0.data = new __compactRuntime.ChargedState(stateValue_0);
        state_0.setOperation('placeBet', new __compactRuntime.ContractOperation());
        state_0.setOperation('closeMarket', new __compactRuntime.ContractOperation());
        state_0.setOperation('resolveMarket', new __compactRuntime.ContractOperation());
        const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
        const partialProofData = {
            input: { value: [], alignment: [] },
            output: undefined,
            publicTranscript: [],
            privateTranscriptOutputs: []
        };
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(0n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0),
                        alignment: _descriptor_0.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(1n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(''),
                        alignment: _descriptor_10.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(2n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(0n),
                        alignment: _descriptor_5.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(3n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                        alignment: _descriptor_1.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(4n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                        alignment: _descriptor_1.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(5n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newMap(new __compactRuntime.StateMap()).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(0n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0),
                        alignment: _descriptor_0.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(1n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(marketQuestion_0),
                        alignment: _descriptor_10.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        const tmp_0 = 0n;
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { idx: { cached: false,
                    pushPath: true,
                    path: [
                        { tag: 'value',
                            value: { value: _descriptor_11.toValue(2n),
                                alignment: _descriptor_11.alignment() } }
                    ] } },
            { addi: { immediate: parseInt(__compactRuntime.valueToBigInt({ value: _descriptor_3.toValue(tmp_0),
                        alignment: _descriptor_3.alignment() }
                        .value)) } },
            { ins: { cached: true, n: 1 } }
        ]);
        const tmp_1 = 0n;
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(3n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_1),
                        alignment: _descriptor_1.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        const tmp_2 = 0n;
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(4n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_2),
                        alignment: _descriptor_1.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
        return {
            currentContractState: state_0,
            currentPrivateState: context.currentPrivateState,
            currentZswapLocalState: context.currentZswapLocalState
        };
    }
    _persistentHash_0(value_0) {
        const result_0 = __compactRuntime.persistentHash(_descriptor_4, value_0);
        return result_0;
    }
    _persistentHash_1(value_0) {
        const result_0 = __compactRuntime.persistentHash(_descriptor_2, value_0);
        return result_0;
    }
    _userSecretKey_0(context, partialProofData) {
        const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
        const [nextPrivateState_0, result_0] = this.witnesses.userSecretKey(witnessContext_0);
        context.currentPrivateState = nextPrivateState_0;
        if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
            __compactRuntime.typeError('userSecretKey', 'return value', 'market-stub.compact line 33 char 1', 'Bytes<32>', result_0);
        }
        partialProofData.privateTranscriptOutputs.push({
            value: _descriptor_2.toValue(result_0),
            alignment: _descriptor_2.alignment()
        });
        return result_0;
    }
    _betAmount_0(context, partialProofData) {
        const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
        const [nextPrivateState_0, result_0] = this.witnesses.betAmount(witnessContext_0);
        context.currentPrivateState = nextPrivateState_0;
        if (!(typeof (result_0) === 'bigint' && result_0 >= 0 && result_0 <= __compactRuntime.MAX_FIELD)) {
            __compactRuntime.typeError('betAmount', 'return value', 'market-stub.compact line 36 char 1', 'Field', result_0);
        }
        partialProofData.privateTranscriptOutputs.push({
            value: _descriptor_1.toValue(result_0),
            alignment: _descriptor_1.alignment()
        });
        return result_0;
    }
    _betSide_0(context, partialProofData) {
        const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
        const [nextPrivateState_0, result_0] = this.witnesses.betSide(witnessContext_0);
        context.currentPrivateState = nextPrivateState_0;
        if (!(typeof (result_0) === 'bigint' && result_0 >= 0 && result_0 <= __compactRuntime.MAX_FIELD)) {
            __compactRuntime.typeError('betSide', 'return value', 'market-stub.compact line 37 char 1', 'Field', result_0);
        }
        partialProofData.privateTranscriptOutputs.push({
            value: _descriptor_1.toValue(result_0),
            alignment: _descriptor_1.alignment()
        });
        return result_0;
    }
    _placeBet_0(context, partialProofData) {
        __compactRuntime.assert(_descriptor_0.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
            { dup: { n: 0 } },
            { idx: { cached: false,
                    pushPath: false,
                    path: [
                        { tag: 'value',
                            value: { value: _descriptor_11.toValue(0n),
                                alignment: _descriptor_11.alignment() } }
                    ] } },
            { popeq: { cached: false,
                    result: undefined } }
        ]).value)
            ===
                0, 'Market not open');
        const amount_0 = this._betAmount_0(context, partialProofData);
        const side_0 = this._betSide_0(context, partialProofData);
        const commitment_0 = this._persistentHash_0([amount_0, side_0]);
        const commitmentBytes_0 = commitment_0;
        const userPubKey_0 = this._persistentHash_1(this._userSecretKey_0(context, partialProofData));
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { idx: { cached: false,
                    pushPath: true,
                    path: [
                        { tag: 'value',
                            value: { value: _descriptor_11.toValue(5n),
                                alignment: _descriptor_11.alignment() } }
                    ] } },
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(userPubKey_0),
                        alignment: _descriptor_2.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(commitmentBytes_0),
                        alignment: _descriptor_2.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } },
            { ins: { cached: true, n: 1 } }
        ]);
        const tmp_0 = 1n;
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { idx: { cached: false,
                    pushPath: true,
                    path: [
                        { tag: 'value',
                            value: { value: _descriptor_11.toValue(2n),
                                alignment: _descriptor_11.alignment() } }
                    ] } },
            { addi: { immediate: parseInt(__compactRuntime.valueToBigInt({ value: _descriptor_3.toValue(tmp_0),
                        alignment: _descriptor_3.alignment() }
                        .value)) } },
            { ins: { cached: true, n: 1 } }
        ]);
        return [];
    }
    _closeMarket_0(context, partialProofData) {
        __compactRuntime.assert(_descriptor_0.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
            { dup: { n: 0 } },
            { idx: { cached: false,
                    pushPath: false,
                    path: [
                        { tag: 'value',
                            value: { value: _descriptor_11.toValue(0n),
                                alignment: _descriptor_11.alignment() } }
                    ] } },
            { popeq: { cached: false,
                    result: undefined } }
        ]).value)
            ===
                0, 'Market not open');
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(0n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(1),
                        alignment: _descriptor_0.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        return [];
    }
    _resolveMarket_0(context, partialProofData, outcome_0) {
        __compactRuntime.assert(_descriptor_0.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
            { dup: { n: 0 } },
            { idx: { cached: false,
                    pushPath: false,
                    path: [
                        { tag: 'value',
                            value: { value: _descriptor_11.toValue(0n),
                                alignment: _descriptor_11.alignment() } }
                    ] } },
            { popeq: { cached: false,
                    result: undefined } }
        ]).value)
            ===
                1, 'Market not closed');
        __compactRuntime.queryLedgerState(context, partialProofData, [
            { push: { storage: false,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(0n),
                        alignment: _descriptor_11.alignment() }).encode() } },
            { push: { storage: true,
                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(2),
                        alignment: _descriptor_0.alignment() }).encode() } },
            { ins: { cached: false, n: 1 } }
        ]);
        return [];
    }
}
export function ledger(stateOrChargedState) {
    const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
    const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
    const context = {
        currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
        costModel: __compactRuntime.CostModel.initialCostModel()
    };
    const partialProofData = {
        input: { value: [], alignment: [] },
        output: undefined,
        publicTranscript: [],
        privateTranscriptOutputs: []
    };
    return {
        get state() {
            return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                { dup: { n: 0 } },
                { idx: { cached: false,
                        pushPath: false,
                        path: [
                            { tag: 'value',
                                value: { value: _descriptor_11.toValue(0n),
                                    alignment: _descriptor_11.alignment() } }
                        ] } },
                { popeq: { cached: false,
                        result: undefined } }
            ]).value);
        },
        get question() {
            return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                { dup: { n: 0 } },
                { idx: { cached: false,
                        pushPath: false,
                        path: [
                            { tag: 'value',
                                value: { value: _descriptor_11.toValue(1n),
                                    alignment: _descriptor_11.alignment() } }
                        ] } },
                { popeq: { cached: false,
                        result: undefined } }
            ]).value);
        },
        get totalBets() {
            return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                { dup: { n: 0 } },
                { idx: { cached: false,
                        pushPath: false,
                        path: [
                            { tag: 'value',
                                value: { value: _descriptor_11.toValue(2n),
                                    alignment: _descriptor_11.alignment() } }
                        ] } },
                { popeq: { cached: true,
                        result: undefined } }
            ]).value);
        },
        get totalYesAmount() {
            return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                { dup: { n: 0 } },
                { idx: { cached: false,
                        pushPath: false,
                        path: [
                            { tag: 'value',
                                value: { value: _descriptor_11.toValue(3n),
                                    alignment: _descriptor_11.alignment() } }
                        ] } },
                { popeq: { cached: false,
                        result: undefined } }
            ]).value);
        },
        get totalNoAmount() {
            return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                { dup: { n: 0 } },
                { idx: { cached: false,
                        pushPath: false,
                        path: [
                            { tag: 'value',
                                value: { value: _descriptor_11.toValue(4n),
                                    alignment: _descriptor_11.alignment() } }
                        ] } },
                { popeq: { cached: false,
                        result: undefined } }
            ]).value);
        },
        betCommitments: {
            isEmpty(...args_0) {
                if (args_0.length !== 0) {
                    throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
                }
                return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                    { dup: { n: 0 } },
                    { idx: { cached: false,
                            pushPath: false,
                            path: [
                                { tag: 'value',
                                    value: { value: _descriptor_11.toValue(5n),
                                        alignment: _descriptor_11.alignment() } }
                            ] } },
                    'size',
                    { push: { storage: false,
                            value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(0n),
                                alignment: _descriptor_5.alignment() }).encode() } },
                    'eq',
                    { popeq: { cached: true,
                            result: undefined } }
                ]).value);
            },
            size(...args_0) {
                if (args_0.length !== 0) {
                    throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
                }
                return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                    { dup: { n: 0 } },
                    { idx: { cached: false,
                            pushPath: false,
                            path: [
                                { tag: 'value',
                                    value: { value: _descriptor_11.toValue(5n),
                                        alignment: _descriptor_11.alignment() } }
                            ] } },
                    'size',
                    { popeq: { cached: true,
                            result: undefined } }
                ]).value);
            },
            member(...args_0) {
                if (args_0.length !== 1) {
                    throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
                }
                const key_0 = args_0[0];
                if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
                    __compactRuntime.typeError('member', 'argument 1', 'market-stub.compact line 20 char 1', 'Bytes<32>', key_0);
                }
                return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                    { dup: { n: 0 } },
                    { idx: { cached: false,
                            pushPath: false,
                            path: [
                                { tag: 'value',
                                    value: { value: _descriptor_11.toValue(5n),
                                        alignment: _descriptor_11.alignment() } }
                            ] } },
                    { push: { storage: false,
                            value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(key_0),
                                alignment: _descriptor_2.alignment() }).encode() } },
                    'member',
                    { popeq: { cached: true,
                            result: undefined } }
                ]).value);
            },
            lookup(...args_0) {
                if (args_0.length !== 1) {
                    throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
                }
                const key_0 = args_0[0];
                if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
                    __compactRuntime.typeError('lookup', 'argument 1', 'market-stub.compact line 20 char 1', 'Bytes<32>', key_0);
                }
                return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context, partialProofData, [
                    { dup: { n: 0 } },
                    { idx: { cached: false,
                            pushPath: false,
                            path: [
                                { tag: 'value',
                                    value: { value: _descriptor_11.toValue(5n),
                                        alignment: _descriptor_11.alignment() } }
                            ] } },
                    { idx: { cached: false,
                            pushPath: false,
                            path: [
                                { tag: 'value',
                                    value: { value: _descriptor_2.toValue(key_0),
                                        alignment: _descriptor_2.alignment() } }
                            ] } },
                    { popeq: { cached: false,
                            result: undefined } }
                ]).value);
            },
            [Symbol.iterator](...args_0) {
                if (args_0.length !== 0) {
                    throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
                }
                const self_0 = state.asArray()[5];
                return self_0.asMap().keys().map((key) => { const value = self_0.asMap().get(key).asCell(); return [_descriptor_2.fromValue(key.value), _descriptor_2.fromValue(value.value)]; })[Symbol.iterator]();
            }
        }
    };
}
const _emptyContext = {
    currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
    userSecretKey: (...args) => undefined,
    betAmount: (...args) => undefined,
    betSide: (...args) => undefined
});
export const pureCircuits = {};
export const contractReferenceLocations = { tag: 'publicLedgerArray', indices: {} };
//# sourceMappingURL=index.js.map