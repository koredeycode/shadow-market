import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export const startTUI = () => {
    // Clear terminal 
    process.stdout.write('\u001b[2J\u001b[0;0H');
    
    // Suppress console logs to avoid TUI corruption
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};

    const instance = render(React.createElement(App));
    
    instance.waitUntilExit().then(() => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        console.info = originalInfo;
        console.debug = originalDebug;
        process.exit();
    });
};
