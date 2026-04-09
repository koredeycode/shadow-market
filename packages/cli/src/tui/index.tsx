import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export const startTerminal = () => {
    // Clear terminal 
    process.stdout.write('\u001b[2J\u001b[0;0H');
    
    // Suppress console logs to avoid Terminal corruption
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

    const cleanup = () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        console.info = originalInfo;
        console.debug = originalDebug;
    };

    // Handle signals for cleanup
    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', () => { cleanup(); process.exit(); });

    const instance = render(React.createElement(App));
    
    instance.waitUntilExit()
        .then(() => {
            cleanup();
            process.exit();
        })
        .catch((err) => {
            cleanup();
            originalError('CLI exited with error:', err);
            process.exit(1);
        });
};
