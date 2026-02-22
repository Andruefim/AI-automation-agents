import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function Landing() {
  return (
    <Layout>
      <Flex
        flex={1}
        direction="column"
        align="center"
        justify="center"
        textAlign="center"
        py={{ base: 16, md: 24 }}
        px={6}
      >
        <Flex
          align="center"
          gap={2}
          py={1}
          px={4}
          borderRadius="full"
          bg="rgba(79,142,247,0.09)"
          borderWidth={1}
          borderColor="rgba(79,142,247,0.22)"
          fontSize="12px"
          color="accent"
          fontWeight={500}
          mb={7}
        >
          <Box w={1.5} h={1.5} borderRadius="50%" bg="accent" animation="pulse 2s infinite" />
          Now in early access
        </Flex>
        <Heading
          fontFamily="heading"
          fontSize={{ base: '2.5rem', md: '4rem', lg: '4.75rem' }}
          fontWeight={800}
          lineHeight={1.04}
          letterSpacing="-2.5px"
          mb={5}
        >
          Your Telegram group
          <br />
          <Box as="span" bgGradient="linear(135deg, accent, accent2)" bgClip="text">
            finally remembers
          </Box>
        </Heading>
        <Text fontSize="17px" color="muted" maxW="500px" lineHeight={1.7} mb={9} fontWeight={300}>
          Slediq gives your group chat a long-term memory. Ask anything — decisions, discussions,
          facts — across months of history.
        </Text>
        <Flex gap={3} justify="center" flexWrap="wrap" mb={16}>
          <Button asChild colorPalette="blue" variant="solid" size="lg">
            <Link to="/register">Start for free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Sign in</Link>
          </Button>
        </Flex>
        <Box
          w="100%"
          maxW="820px"
          borderRadius="20px"
          overflow="hidden"
          borderWidth={1}
          borderColor="glassBorder"
          bg="rgba(12,15,26,0.85)"
          backdropFilter="blur(24px)"
          boxShadow="0 40px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,0.03)"
        >
          <Flex
            align="center"
            gap={2}
            py={3}
            px={5}
            bg="rgba(255,255,255,0.025)"
            borderBottomWidth={1}
            borderColor="glassBorder"
          >
            <Box w={2.5} h={2.5} borderRadius="50%" bg="#ff5f57" />
            <Box w={2.5} h={2.5} borderRadius="50%" bg="#febc2e" />
            <Box w={2.5} h={2.5} borderRadius="50%" bg="#28c840" />
            <Text ml={2} fontSize="13px" color="muted" fontWeight={500}>
              Dev Team · 4 members
            </Text>
          </Flex>
          <Box p={6} display="flex" flexDirection="column" gap={4}>
            <Flex gap={2} align="flex-start">
              <Box
                w={8}
                h={8}
                borderRadius="50%"
                bg="glass"
                borderWidth={1}
                borderColor="glassBorder"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="13px"
                flexShrink={0}
              >
                A
              </Box>
              <Box
                py={2}
                px={3}
                borderRadius="13px"
                fontSize="13.5px"
                lineHeight={1.55}
                maxW="68%"
                bg="rgba(255,255,255,0.055)"
                borderWidth={1}
                borderColor="glassBorder"
                color="muted"
              >
                what was the decision we made about auth last month?
              </Box>
            </Flex>
            <Flex gap={2} align="flex-start" flexDirection="row-reverse">
              <Box
                w={8}
                h={8}
                borderRadius="50%"
                bg="rgba(79,142,247,0.12)"
                borderWidth={1}
                borderColor="rgba(79,142,247,0.28)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="13px"
                flexShrink={0}
              >
                🤖
              </Box>
              <Box
                py={2}
                px={3}
                borderRadius="13px"
                fontSize="13.5px"
                lineHeight={1.55}
                maxW="68%"
                bg="rgba(79,142,247,0.11)"
                borderWidth={1}
                borderColor="rgba(79,142,247,0.2)"
                color="text"
              >
                On Nov 14th you decided to go with JWT + refresh tokens. Alex suggested adding a
                Redis-based token blacklist for logout.
              </Box>
            </Flex>
          </Box>
        </Box>
      </Flex>
      <Flex
        as="footer"
        justify="center"
        py={7}
        borderTopWidth={1}
        borderColor="glassBorder"
        color="dim"
        fontSize="12px"
      >
        © 2025 Slediq · Made with ☕
      </Flex>
    </Layout>
  );
}
