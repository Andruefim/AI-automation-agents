import { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, SimpleGrid } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { listGroups } from '../api/groups';
import type { ChatGroup } from '../api/groups';

export function Dashboard() {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Flex align="flex-start" justify="space-between" mb={8}>
        <Box>
          <Heading fontFamily="heading" fontSize="22px" fontWeight={800} letterSpacing="-0.5px">
            Groups
          </Heading>
          <Text fontSize="13px" color="muted" mt={1}>
            Telegram groups connected to your bots
          </Text>
        </Box>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {groups.map((g) => (
          <Link key={g.id} to={`/dashboard/groups/${g.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <Box
            p={6}
            bg="rgba(255,255,255,0.04)"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.07)"
            borderRadius="14px"
            cursor="pointer"
            transition="all 0.18s"
            _hover={{
              transform: 'translateY(-2px)',
              borderColor: 'rgba(79,142,247,0.18)',
            }}
          >
            <Flex align="center" gap={3} mb={4}>
              <Box
                w={11}
                h={11}
                borderRadius="13px"
                bg="rgba(79,142,247,0.09)"
                borderWidth={1}
                borderColor="rgba(79,142,247,0.18)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="18px"
              >
                💬
              </Box>
              <Box>
                <Text fontFamily="heading" fontSize="15px" fontWeight={700} mb={0.5}>
                  {g.title || 'Unnamed group'}
                </Text>
                <Text fontSize="11px" color="#343b52">
                  @{g.bot?.botUsername ?? 'bot'}
                </Text>
              </Box>
            </Flex>
            <Flex gap={2} mt={4} pt={4} borderTopWidth={1} borderColor="rgba(255,255,255,0.07)" align="center" justify="space-between">
              <Flex align="center" gap={1.5} fontSize="11px" color="#34d399" bg="rgba(52,211,153,0.08)" px={2} py={0.5} borderRadius="full" borderWidth={1} borderColor="rgba(52,211,153,0.18)">
                <Box w={1.5} h={1.5} borderRadius="50%" bg="#34d399" />
                Connected
              </Flex>
            </Flex>
          </Box>
          </Link>
        ))}
        <Link to="/dashboard/connect" style={{ textDecoration: 'none' }}>
        <Box
          borderWidth={1}
          borderStyle="dashed"
          borderColor="#343b52"
          borderRadius="14px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={9}
          minH="195px"
          cursor="pointer"
          transition="all 0.2s"
          color="#343b52"
          _hover={{
            borderColor: '#4f8ef7',
            color: '#4f8ef7',
            bg: 'rgba(79,142,247,0.03)',
          }}
        >
          <Text fontSize="28px" fontWeight={300} lineHeight={1}>
            +
          </Text>
          <Text fontSize="13px" fontWeight={500}>
            Connect a group
          </Text>
        </Box>
        </Link>
      </SimpleGrid>
      {loading && (
        <Text color="#7d8599" fontSize="sm" mt={4}>
          Loading…
        </Text>
      )}
    </>
  );
}
