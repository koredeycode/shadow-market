import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm (y)',
  cancelLabel = 'Cancel (n/esc)',
  confirmColor = 'red'
}) => {
  useInput((input, key) => {
    if (input === 'y' || input === 'Y') {
        onConfirm();
    } else if (input === 'n' || input === 'N' || key.escape) {
        onCancel();
    }
  });

  return (
    <Box 
      position="absolute" 
      width="100%" 
      height="100%" 
      alignItems="center" 
      justifyContent="center"
    >
      <Box 
        flexDirection="column" 
        borderStyle="bold" 
        borderColor={confirmColor} 
        padding={2} 
        paddingX={4}
        alignItems="center"
        width={60}
        backgroundColor="black"
      >
        <Box marginBottom={1}>
           <Text bold color={confirmColor}> 🔒 {title} 🔒 </Text>
        </Box>
        <Box marginY={1}>
          <Text color="white" wrap="wrap">{message}</Text>
        </Box>
        <Box marginTop={2} justifyContent="space-around" width="100%">
          <Box borderStyle="single" borderColor="gray" paddingX={1}>
            <Text color="gray">{cancelLabel}</Text>
          </Box>
          <Box borderStyle="bold" borderColor={confirmColor} paddingX={1}>
            <Text color={confirmColor} bold>{confirmLabel}</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
