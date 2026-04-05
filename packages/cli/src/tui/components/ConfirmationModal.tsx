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
      flexDirection="column" 
      borderStyle="double" 
      borderColor={confirmColor} 
      padding={1} 
      alignItems="center"
      position="absolute"
      marginTop={5}
      marginLeft={5}
      width={40}
    >
      <Text bold color={confirmColor}>{title}</Text>
      <Box marginY={1}>
        <Text>{message}</Text>
      </Box>
      <Box justifyContent="space-around" width="100%">
        <Text color="gray">[n] {cancelLabel}</Text>
        <Text color={confirmColor} bold>[y] {confirmLabel}</Text>
      </Box>
    </Box>
  );
};
