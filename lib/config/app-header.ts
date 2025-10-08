// Standardized AppHeader configurations for different page types

export const APP_HEADER_CONFIGS = {
  // Main dashboard/home page
  home: {
    title: "Dashboard",
    subtitle: "Welcome back! Manage your rooms and profile",
    showNavigation: true,
    showCreateRoom: true,
    showJoinRoom: true,
    needsCreateRoomHandler: true,
  },

  // Rooms listing page
  rooms: {
    title: "My Rooms",
    subtitle: "Manage your chat rooms and members",
    showNavigation: true,
    showCreateRoom: true,
    showJoinRoom: true,
    needsCreateRoomHandler: true,
  },

  // Room management page (admin view)
  roomManage: {
    title: (roomName: string) => `Manage: ${roomName}`,
    subtitle: (roomId: string) => `Room ID: ${roomId}`,
    showNavigation: true,
    showCreateRoom: false,
    showJoinRoom: false,
    needsCreateRoomHandler: false,
  },

  // Room view page (non-admin/read-only)
  roomView: {
    title: (roomName: string) => roomName,
    subtitle: (roomId: string) => `Room ID: ${roomId} - Read Only View`,
    showNavigation: true,
    showCreateRoom: false,
    showJoinRoom: false,
    needsCreateRoomHandler: false,
  },

  // Notifications page
  notifications: {
    title: "Notifications",
    subtitle: "Manage your notifications and invitations",
    showNavigation: true,
    showCreateRoom: false,
    showJoinRoom: false,
    needsCreateRoomHandler: false,
  },

  // Profile page
  profile: {
    title: "My Profile",
    subtitle: "Complete your profile information",
    showNavigation: true,
    showCreateRoom: false,
    showJoinRoom: false,
    needsCreateRoomHandler: false,
  },
} as const;

export type AppHeaderConfigType = keyof typeof APP_HEADER_CONFIGS;
