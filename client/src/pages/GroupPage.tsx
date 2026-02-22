import { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, SimpleGrid } from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';
import { getGroup } from '../api/groups';
import type { ChatGroup } from '../api/groups';

export function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const n = id ? parseInt(id, 10) : NaN;
    if (Number.isNaN(n)) {
      setLoading(false);
      return;
    }
    getGroup(n)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !group) {
    return (
      <Box py={8}>
        <Text color="muted">{loading ? 'Loading…' : 'Group not found.'}</Text>
      </Box>
    );
  }

  return (
    <>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#7d8599', marginBottom: 24 }}>
        ← Back to groups
      </Link>
      <Flex
        align="center"
        gap={5}
        mb={8}
        p={6}
        borderRadius="14px"
        bg="glass"
        borderWidth={1}
        borderColor="glassBorder"
      >
        <Box
          w={14}
          h={14}
          borderRadius="16px"
          bg="rgba(79,142,247,0.1)"
          borderWidth={1}
          borderColor="rgba(79,142,247,0.2)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="24px"
        >
          💬
        </Box>
        <Box flex={1}>
          <Heading fontFamily="heading" fontSize="20px" fontWeight={800} letterSpacing="-0.3px" mb={0.5}>
            {group.title || 'Unnamed group'}
          </Heading>
          <Text fontSize="13px" color="muted">
            @{group.bot?.botUsername ?? 'bot'}
          </Text>
        </Box>
        <Flex gap={2}>
          <Flex
            align="center"
            gap={1.5}
            fontSize="11px"
            color="green"
            bg="rgba(52,211,153,0.08)"
            px={2}
            py={1}
            borderRadius="full"
            borderWidth={1}
            borderColor="rgba(52,211,153,0.18)"
          >
            <Box w={1.5} h={1.5} borderRadius="50%" bg="green" />
            Connected
          </Flex>
        </Flex>
      </Flex>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={5}>
        <Box>
          <Text fontSize="13px" fontWeight={600} color="muted" textTransform="uppercase" letterSpacing="0.6px" mb={4}>
            Overview
          </Text>
          <SimpleGrid columns={3} gap={3} mb={5}>
            <Box p={5} bg="glass" borderWidth={1} borderColor="glassBorder" borderRadius="14px">
              <Text fontFamily="heading" fontSize="26px" fontWeight={800} display="block">
                —
              </Text>
              <Text fontSize="12px" color="muted" mt={1} display="block">
                Messages
              </Text>
            </Box>
            <Box p={5} bg="glass" borderWidth={1} borderColor="glassBorder" borderRadius="14px">
              <Text fontFamily="heading" fontSize="26px" fontWeight={800} display="block">
                —
              </Text>
              <Text fontSize="12px" color="muted" mt={1} display="block">
                Indexed
              </Text>
            </Box>
            <Box p={5} bg="glass" borderWidth={1} borderColor="glassBorder" borderRadius="14px">
              <Text fontFamily="heading" fontSize="26px" fontWeight={800} display="block">
                —
              </Text>
              <Text fontSize="12px" color="muted" mt={1} display="block">
                Members
              </Text>
            </Box>
          </SimpleGrid>
        </Box>
        <Box>
          <Text fontSize="13px" fontWeight={600} color="muted" textTransform="uppercase" letterSpacing="0.6px" mb={4}>
            Settings
          </Text>
          <Box
            p={5}
            bg="glass"
            borderWidth={1}
            borderColor="glassBorder"
            borderRadius="14px"
            display="flex"
            flexDirection="column"
            gap={4}
          >
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="14px" fontWeight={600}>RAG / Memory</Text>
                <Text fontSize="12px" color="muted" lineHeight={1.5}>Semantic search over chat history</Text>
              </Box>
              <Box
                w={10}
                h={6}
                borderRadius="full"
                bg="dim"
                position="relative"
                cursor="pointer"
                _after={{
                  content: '""',
                  position: 'absolute',
                  top: '3px',
                  left: '3px',
                  w: '16px',
                  h: '16px',
                  borderRadius: '50%',
                  bg: 'white',
                }}
              />
            </Flex>
          </Box>
        </Box>
      </SimpleGrid>
    </>
  );
}
