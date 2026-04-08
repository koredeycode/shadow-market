import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { format, isFuture, isValid } from 'date-fns';

interface CreateMarketProps {
  onCancel: () => void;
  onSubmit: (data: any) => void | Promise<void>;
  isSubmitting: boolean;
  submitStatus: string;
}

export const CreateMarket: React.FC<CreateMarketProps> = ({
  onCancel,
  onSubmit,
  isSubmitting,
  submitStatus
}) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    question: '',
    category: 'Crypto',
    tags: '',
    endTimeYear: new Date().getFullYear().toString(),
    endTimeMonth: (new Date().getMonth() + 1).toString(),
    endTimeDay: (new Date().getDate() + 1).toString(),
    description: ''
  });
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'MONTH' | 'DAY' | 'SUBMIT'>('MONTH');

  const cleanInput = (val: string) => val.replace(/[\x00-\x1F\x7F]/g, '');

  const handleNext = () => {
    setError('');
    if (step === 0 && formData.question.length < 10) {
      setError('Question must be at least 10 characters.');
      return;
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setError('');
    if (step > 0) setStep(step - 1);
    else onCancel();
  };

  useInput((input, key) => {
    if (isSubmitting) return;
    if (key.escape) {
       handlePrev();
       return;
    }
    
    if (step === 4) {
        if (key.leftArrow || key.rightArrow || key.tab) {
            setFocusedField(prev => {
                if (key.shift && key.tab || key.leftArrow) {
                    if (prev === 'SUBMIT') return 'DAY';
                    if (prev === 'DAY') return 'MONTH';
                    return 'SUBMIT';
                }
                if (prev === 'MONTH') return 'DAY';
                if (prev === 'DAY') return 'SUBMIT';
                return 'MONTH';
            });
        }
    }
  });

  const getTargetDate = () => {
    try {
        const d = new Date(
            parseInt(formData.endTimeYear),
            parseInt(formData.endTimeMonth) - 1,
            parseInt(formData.endTimeDay),
            12, 0, 0
        );
        return d;
    } catch (e) {
        return null;
    }
  };

  const validateAndSubmit = () => {
    const targetDate = getTargetDate();
    if (!targetDate || !isValid(targetDate)) {
      setError('Invalid date provided.');
      return;
    }
    if (!isFuture(targetDate)) {
      setError('Market resolution date must be in the future.');
      return;
    }
    
    onSubmit({
      ...formData,
      targetDate
    });
  };

  return (
    <Box flexDirection="column">
      <Text bold underline color="white">Create New Market</Text>

      {isSubmitting ? (
        <Box marginTop={1} borderStyle="single" borderColor="cyan" paddingX={1} height={5} justifyContent="center" alignItems="center">
          <Text color="yellow">STATUS: {submitStatus}</Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          {step === 0 && (
            <Box flexDirection="column" backgroundColor="black">
              <Text color="cyan" bold>Step 1/5: Enter Market Question</Text>
              <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
                <TextInput
                  value={formData.question}
                  onChange={(v) => setFormData(p => ({ ...p, question: cleanInput(v) }))}
                  onSubmit={handleNext}
                  placeholder="e.g. Will Midnight Network launch mainnet in 2024?"
                />
              </Box>
              <Text dimColor>Press ENTER to continue, ESC to cancel.</Text>
            </Box>
          )}

          {step === 1 && (
            <Box flexDirection="column" backgroundColor="black">
              <Text color="cyan" bold>Step 2/5: Description (Optional)</Text>
              <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
                <TextInput
                  value={formData.description}
                  onChange={(v) => setFormData(p => ({ ...p, description: cleanInput(v) }))}
                  onSubmit={handleNext}
                  placeholder="Provide context or resolution criteria..."
                />
              </Box>
              <Text dimColor>Press ENTER to continue, ESC to go back.</Text>
            </Box>
          )}

          {step === 2 && (
            <Box flexDirection="column" backgroundColor="black">
              <Text color="cyan" bold>Step 3/5: Select Category</Text>
              <Box marginTop={1}>
                <SelectInput
                  items={[
                    { label: 'CRYPTO', value: 'Crypto' },
                    { label: 'POLITICS', value: 'Politics' },
                    { label: 'SPORTS', value: 'Sports' },
                    { label: 'FINANCE', value: 'Finance' },
                    { label: 'TECH', value: 'Tech' },
                    { label: 'GEOPOLITICS', value: 'Geopolitics' },
                    { label: 'CULTURE', value: 'Culture' },
                    { label: 'ECONOMY', value: 'Economy' },
                    { label: 'WEATHER', value: 'Weather' },
                    { label: 'ELECTIONS', value: 'Elections' },
                    { label: 'OTHERS', value: 'Others' }
                  ]}
                  onSelect={(item) => {
                    setFormData(p => ({ ...p, category: item.value }));
                    handleNext();
                  }}
                />
              </Box>
            </Box>
          )}

          {step === 3 && (
            <Box flexDirection="column" backgroundColor="black">
               <Text color="cyan" bold>Step 4/5: Set Resolution Year (YYYY)</Text>
               <Box borderStyle="single" borderColor="white" paddingX={1} marginTop={1}>
                  <TextInput
                     value={formData.endTimeYear}
                     onChange={(v) => setFormData(p => ({ ...p, endTimeYear: cleanInput(v) }))}
                     onSubmit={handleNext}
                  />
               </Box>
               <Text dimColor>Current selection: {formData.endTimeYear}</Text>
               <Box marginTop={1}>
                  <Text color="gray" italic>Tip: Press ENTER to confirm and proceed.</Text>
               </Box>
            </Box>
          )}

          {step === 4 && (
            <Box flexDirection="column" backgroundColor="black">
               <Text color="cyan" bold>Step 5/5: Finalize Day & Month</Text>
                <Box flexDirection="row" marginTop={1}>
                  <Box flexDirection="column" borderStyle="single" borderColor={focusedField === 'MONTH' ? "cyan" : "gray"} paddingX={1} width={15}>
                    <Box justifyContent="space-between">
                        <Text color={focusedField === 'MONTH' ? "cyan" : "gray"}>Month (1-12)</Text>
                    </Box>
                    <TextInput
                       focus={focusedField === 'MONTH'}
                       value={formData.endTimeMonth}
                       onChange={(v) => { 
                           const n = v.replace(/\D/g, '');
                           if (n === '' || (parseInt(n) >= 1 && parseInt(n) <= 12)) {
                               setFormData(p => ({ ...p, endTimeMonth: n }));
                           }
                       }}
                       onSubmit={() => setFocusedField('DAY')}
                    />
                  </Box>
                  <Box flexDirection="column" borderStyle="single" borderColor={focusedField === 'DAY' ? "cyan" : "gray"} paddingX={1} width={15} marginLeft={2}>
                    <Box justifyContent="space-between">
                         <Text color={focusedField === 'DAY' ? "cyan" : "gray"}>Day (1-31)</Text>
                    </Box>
                    <TextInput
                       focus={focusedField === 'DAY'}
                       value={formData.endTimeDay}
                       onChange={(v) => { 
                           const n = v.replace(/\D/g, '');
                           if (n === '' || (parseInt(n) >= 1 && parseInt(n) <= 31)) {
                               setFormData(p => ({ ...p, endTimeDay: n }));
                           }
                       }}
                       onSubmit={() => setFocusedField('SUBMIT')}
                    />
                  </Box>
                </Box>

                <Box marginTop={1}>
                  <Text color="yellow" italic>Navigation: [TAB] switch fields | [ENTER] confirm value</Text>
                </Box>

               <Box marginTop={2} padding={1} borderStyle="round" borderColor="magenta">
                   <Text>RESOLUTION DATE: <Text color="white" bold>
                     {getTargetDate() && isValid(getTargetDate()) 
                       ? format(getTargetDate()!, 'PPP').toUpperCase() 
                       : 'INVALID DATE'}
                   </Text> @ 12:00 PM</Text>
               </Box>

               <Box marginTop={1}>
                 <Text color="cyan" bold>PRESS ENTER TO CONTINUE OR ESC TO BACK</Text>
               </Box>

                <Box marginTop={1} borderStyle="single" borderColor={focusedField === 'SUBMIT' ? "yellow" : "gray"} paddingX={1}>
                  <SelectInput 
                     isFocused={focusedField === 'SUBMIT'}
                     items={[{label: 'BROADCAST MARKET CREATION', value: 'submit'}, {label: 'RE-EDIT DETAILS', value: 'wait'}]}
                     onSelect={(i: any) => i.value === 'submit' ? validateAndSubmit() : setStep(0)}
                  />
                </Box>
            </Box>
          )}

          {error && (
            <Box marginTop={1}>
              <Text color="red">ERROR: {error}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
