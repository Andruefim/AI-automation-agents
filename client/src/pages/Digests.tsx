import { Box, Heading, Text } from '@chakra-ui/react';

export function Digests() {
  return (
    <>
      <Heading fontFamily="heading" fontSize="22px" fontWeight={800} mb={2}>
        Digests
      </Heading>
      <Text fontSize="13px" color="muted" mb={6}>
        Daily or weekly summaries (coming soon)
      </Text>
      <Box p={6} bg="glass" borderWidth={1} borderColor="glassBorder" borderRadius="14px">
        <Text color="muted">Configure digest delivery here in a future update.</Text>
      </Box>
    </>
  );
}
