import { Box, Flex, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box minH="100vh" position="relative" overflowX="hidden">
      <Box
        position="fixed"
        top={-250}
        right={-180}
        w="700px"
        h="700px"
        borderRadius="50%"
        bg="rgba(79,142,247,0.07)"
        filter="blur(100px)"
        pointerEvents="none"
        zIndex={0}
      />
      <Box
        position="fixed"
        bottom={-150}
        left={-200}
        w="500px"
        h="500px"
        borderRadius="50%"
        bg="rgba(123,108,246,0.06)"
        filter="blur(100px)"
        pointerEvents="none"
        zIndex={0}
      />
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        px={{ base: 4, md: 12 }}
        py={4}
        borderBottomWidth={1}
        borderColor="rgba(255,255,255,0.07)"
        bg="rgba(7,9,15,0.75)"
        backdropFilter="blur(24px)"
        position="sticky"
        top={0}
        zIndex={200}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Box fontFamily="Syne, sans-serif" fontSize="20px" fontWeight={800} letterSpacing="-0.5px" cursor="pointer" _hover={{ opacity: 0.9 }} color="#eef2ff">
            Sled<Box as="span" color="#4f8ef7">iq</Box>
          </Box>
        </Link>
        <Flex gap={2} align="center">
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild colorPalette="blue" variant="solid" size="sm">
            <Link to="/register">Get started free</Link>
          </Button>
        </Flex>
      </Flex>
      <Box position="relative" zIndex={1}>
        {children}
      </Box>
    </Box>
  );
}
