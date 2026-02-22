import { Box, Flex, Button, Text } from '@chakra-ui/react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/dashboard', label: 'Groups' },
  { to: '/dashboard/digests', label: 'Digests' },
  { to: '/dashboard/settings', label: 'Settings' },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box minH="100vh" position="relative" overflowX="hidden" bg="#07090f" color="#eef2ff">
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
        px={{ base: 4, md: 10 }}
        py={4}
        borderBottomWidth={1}
        borderColor="rgba(255,255,255,0.07)"
        bg="rgba(7,9,15,0.8)"
        backdropFilter="blur(24px)"
        position="sticky"
        top={0}
        zIndex={200}
      >
        <Flex align="center" gap={8}>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <Box fontFamily="Syne, sans-serif" fontSize="18px" fontWeight={800} letterSpacing="-0.5px" cursor="pointer" _hover={{ opacity: 0.9 }} color="#eef2ff">
              Sled<Box as="span" color="#4f8ef7">iq</Box>
            </Box>
          </Link>
          <Flex gap={1}>
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    fontSize="13px"
                    fontWeight={500}
                    color={isActive ? '#eef2ff' : '#7d8599'}
                    bg={isActive ? 'rgba(255,255,255,0.04)' : 'transparent'}
                    _hover={{ bg: 'rgba(255,255,255,0.04)', color: '#eef2ff' }}
                  >
                    {label}
                  </Button>
                )}
              </NavLink>
            ))}
          </Flex>
        </Flex>
        <Flex
          align="center"
          gap={2}
          py={1}
          pl={2}
          pr={3}
          borderRadius="full"
          bg="rgba(255,255,255,0.04)"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.07)"
          fontSize="13px"
          color="#7d8599"
          cursor="pointer"
        >
          <Box
            w={6}
            h={6}
            borderRadius="50%"
            bg="rgba(79,142,247,0.2)"
            borderWidth={1}
            borderColor="rgba(79,142,247,0.3)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="11px"
            color="#4f8ef7"
          >
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </Box>
          <Text maxW="120px" truncate title={user?.email ?? ''}>
            {user?.email ?? 'User'}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Logout
          </Button>
        </Flex>
      </Flex>
      <Box position="relative" zIndex={1} flex={1} py={9} px={{ base: 4, md: 10 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
