import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export const startTUI = () => {
    // Clear terminal 
    process.stdout.write('\u001b[2J\u001b[0;0H');
    
    // Suppress console logs to avoid TUI corruption
    const originalLog = console.log;
    const originalError = console.error;
    console.log = () => {};
    console.error = () => {};

    const instance = render(React.createElement(App));
    
    instance.waitUntilExit().then(() => {
        console.log = originalLog;
        console.error = originalError;
        process.exit();
    });
};
