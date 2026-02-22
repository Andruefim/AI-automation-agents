import { Box, Heading, Text } from '@chakra-ui/react';

export function Settings() {
  return (
    <>
      <Heading fontFamily="heading" fontSize="22px" fontWeight={800} mb={2}>
        Settings
      </Heading>
      <Text fontSize="13px" color="muted" mb={6}>
        Account and app preferences
      </Text>
      <Box p={6} bg="glass" borderWidth={1} borderColor="glassBorder" borderRadius="14px">
        <Text color="muted">Settings panel (coming soon).</Text>
      </Box>
    </>
  );
}
