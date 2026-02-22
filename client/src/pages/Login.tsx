import { useState } from 'react';
import { Box, Flex, Heading, Text, Button, Input, Field } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box minH="100vh" position="relative">
      <Box position="fixed" top={-250} right={-180} w="700px" h="700px" borderRadius="50%" bg="rgba(79,142,247,0.07)" filter="blur(100px)" pointerEvents="none" zIndex={0} />
      <Box position="fixed" bottom={-150} left={-200} w="500px" h="500px" borderRadius="50%" bg="rgba(123,108,246,0.06)" filter="blur(100px)" pointerEvents="none" zIndex={0} />
      <Flex as="nav" align="center" justify="space-between" px={{ base: 4, md: 12 }} py={4} borderBottomWidth={1} borderColor="glassBorder" bg="rgba(7,9,15,0.75)" backdropFilter="blur(24px)">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Box fontFamily="Syne, sans-serif" fontSize="20px" fontWeight={800} cursor="pointer" color="#eef2ff">
            Sled<Box as="span" color="#4f8ef7">iq</Box>
          </Box>
        </Link>
        <Button asChild colorPalette="blue" variant="solid" size="sm">
          <Link to="/register">Register</Link>
        </Button>
      </Flex>
      <Flex flex={1} align="center" justify="center" py={10} px={6} position="relative" zIndex={1}>
        <Box
          as="form"
          onSubmit={handleSubmit}
          w="100%"
          maxW="400px"
          p={10}
          bg="glass"
          borderWidth={1}
          borderColor="glassBorder"
          borderRadius="14px"
          backdropFilter="blur(18px)"
        >
          <Heading fontFamily="heading" fontSize="26px" fontWeight={800} mb={1}>
            Welcome back
          </Heading>
          <Text fontSize="13px" color="muted" mb={7}>
            Sign in to your Slediq account
          </Text>
          {error && (
            <Text color="red.400" fontSize="sm" mb={3}>
              {error}
            </Text>
          )}
          <Field.Root mb={4}>
            <Field.Label fontSize="12px" fontWeight={500} color="#7d8599">Email</Field.Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field.Root>
          <Field.Root mb={4}>
            <Field.Label fontSize="12px" fontWeight={500} color="#7d8599">Password</Field.Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field.Root>
          <Button type="submit" colorPalette="blue" variant="solid" w="100%" loading={loading}>
            Sign in →
          </Button>
          <Text textAlign="center" mt={6} fontSize="13px" color="#7d8599">
            No account? <Link to="/register" style={{ color: '#4f8ef7', cursor: 'pointer' }}>Create one</Link>
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
