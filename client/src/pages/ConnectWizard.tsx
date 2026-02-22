import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Field,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { createBot, getBotStatus } from '../api/bots';

const STEPS = [
  { n: 1, label: 'Get token' },
  { n: 2, label: 'Verify' },
  { n: 3, label: 'Add to group' },
  { n: 4, label: 'Confirm' },
];

export function ConnectWizard() {
  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [botId, setBotId] = useState<number | null>(null);
  const [botUsername, setBotUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const navigate = useNavigate();

  const verifyToken = useCallback(async () => {
    if (!token.trim()) {
      setError('Enter a bot token');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await createBot(token.trim());
      setBotId(res.botId);
      setBotUsername(res.botUsername);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid token');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (step !== 4 || !botId) return;
    setPolling(true);
    const t = setInterval(async () => {
      try {
        const status = await getBotStatus(botId);
        if (status.connected && status.groups.length > 0) {
          clearInterval(t);
          setPolling(false);
          navigate('/dashboard');
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(t);
  }, [step, botId, navigate]);

  return (
    <Flex flex={1} align="center" justify="center" py={10} px={6}>
      <Box
        w="100%"
        maxW="540px"
        p={10}
        bg="glass"
        borderWidth={1}
        borderColor="glassBorder"
        borderRadius="14px"
        backdropFilter="blur(18px)"
      >
        <Heading fontFamily="heading" fontSize="22px" fontWeight={800} mb={1}>
          Connect a Telegram group
        </Heading>
        <Text fontSize="13px" color="muted" mb={8}>
          Use your own bot from BotFather
        </Text>

        <Flex align="center" gap={0} mb={9} flexWrap="wrap">
          {STEPS.map((s, i) => (
            <Flex key={s.n} align="center" gap={2} flexShrink={0}>
              <Flex
                align="center"
                gap={2}
                fontSize="12px"
                fontWeight={500}
                color={step > s.n ? 'green' : step === s.n ? 'accent' : 'dim'}
              >
                <Box
                  w={7}
                  h={7}
                  borderRadius="50%"
                  bg={step > s.n ? 'rgba(52,211,153,0.12)' : step === s.n ? 'rgba(79,142,247,0.12)' : 'glass'}
                  borderWidth={1}
                  borderColor={step > s.n ? 'rgba(52,211,153,0.3)' : step === s.n ? 'rgba(79,142,247,0.35)' : 'glassBorder'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="11px"
                  color={step > s.n ? 'green' : step === s.n ? 'accent' : 'dim'}
                >
                  {step > s.n ? '✓' : s.n}
                </Box>
                {s.label}
              </Flex>
              {i < STEPS.length - 1 && (
                <Box flex={1} maxW="36px" h="1px" bg="glassBorder" mx={1} />
              )}
            </Flex>
          ))}
        </Flex>

        {step === 1 && (
          <Box>
            <Box
              py={5}
              px={5}
              borderRadius="12px"
              bg="rgba(79,142,247,0.05)"
              borderWidth={1}
              borderColor="rgba(79,142,247,0.12)"
              mb={5}
            >
              <Text fontSize="13px" color="muted" lineHeight={1.7}>
                1. Open Telegram and message <Box as="span" color="accent" fontFamily="mono" fontSize="12px">@BotFather</Box>.
                <br />
                2. Send <Box as="span" color="accent" fontFamily="mono" fontSize="12px">/newbot</Box> and follow the steps.
                <br />
                3. Copy the bot token and paste it below.
              </Text>
            </Box>
            <Button colorPalette="blue" variant="solid" w="100%" onClick={() => setStep(2)}>
              I have a token →
            </Button>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Field.Root mb={5}>
              <Field.Label fontSize="12px" fontWeight={500} color="#7d8599">Bot token</Field.Label>
              <Flex gap={2} align="center">
                <Input
                  type="password"
                  placeholder="123456:ABC-DEF..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  flex={1}
                />
                <Button size="sm" variant="outline" onClick={verifyToken} loading={loading}>
                  Verify
                </Button>
              </Flex>
            </Field.Root>
            {error && (
              <Text color="red.400" fontSize="sm" mb={3}>
                {error}
              </Text>
            )}
            <Flex gap={2} mt={6}>
              <Button variant="ghost" flex={1} onClick={() => setStep(1)}>
                Back
              </Button>
            </Flex>
          </Box>
        )}

        {step === 3 && botUsername && (
          <Box>
            <Box
              py={5}
              px={5}
              borderRadius="12px"
              bg="rgba(79,142,247,0.05)"
              borderWidth={1}
              borderColor="rgba(79,142,247,0.12)"
              mb={5}
            >
              <Text fontSize="13px" color="muted" lineHeight={1.7}>
                Add your bot to a Telegram group: open{' '}
                <a
                  href={`https://t.me/${botUsername}?startgroup=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4f8ef7', fontFamily: 'monospace', fontSize: '12px' }}
                >
                  t.me/{botUsername}?startgroup=true
                </a>
                {' '}and choose the group. Then send any message in that group.
              </Text>
            </Box>
            <Button
              colorPalette="blue"
              variant="solid"
              w="100%"
              onClick={() => {
                setStep(4);
              }}
            >
              I added the bot →
            </Button>
          </Box>
        )}

        {step === 4 && (
          <Box>
            {polling ? (
              <Flex
                align="center"
                gap={3}
                py={4}
                px={5}
                borderRadius="10px"
                bg="rgba(79,142,247,0.06)"
                borderWidth={1}
                borderColor="rgba(79,142,247,0.14)"
                fontSize="13px"
                color="muted"
                mt={4}
              >
                <Box
                  w={4}
                  h={4}
                  borderRadius="50%"
                  borderWidth={2}
                  borderColor="rgba(79,142,247,0.2)"
                  borderTopColor="accent"
                  animation="spin 0.8s linear infinite"
                  flexShrink={0}
                />
                Waiting for a message in the group…
              </Flex>
            ) : (
              <Flex
                flexDirection="column"
                align="center"
                py={5}
              >
                <Box
                  w={16}
                  h={16}
                  borderRadius="50%"
                  bg="rgba(52,211,153,0.1)"
                  borderWidth={1}
                  borderColor="rgba(52,211,153,0.25)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="28px"
                  mb={5}
                >
                  ✓
                </Box>
                <Heading fontFamily="heading" fontSize="20px" fontWeight={700} mb={2}>
                  Group connected
                </Heading>
                <Text fontSize="13px" color="muted" lineHeight={1.65}>
                  You can go to the dashboard to see your group.
                </Text>
                <Button colorPalette="blue" variant="solid" mt={5} onClick={() => navigate('/dashboard')}>
                  Go to dashboard
                </Button>
              </Flex>
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
}
