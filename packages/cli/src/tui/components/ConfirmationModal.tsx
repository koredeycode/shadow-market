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
        borderStyle="double" 
        borderColor={confirmColor} 
        padding={1} 
        paddingX={3}
        alignItems="center"
        width={50}
      >
        <Box marginBottom={1}>
           <Text bold color={confirmColor}> ⚠️ {title} ⚠️ </Text>
        </Box>
        <Box marginY={1}>
          <Text color="white" wrap="wrap">{message}</Text>
        </Box>
        <Box marginTop={1} justifyContent="space-around" width="100%">
          <Text color="gray">[n] {cancelLabel}</Text>
          <Text color={confirmColor} bold>[y] {confirmLabel}</Text>
        </Box>
      </Box>
    </Box>
  );
};
