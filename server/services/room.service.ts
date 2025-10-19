import Room, { IRoom, IRoomMember } from '../database/schemas/room.schema';
import { UserModel as User } from '../database/schemas/user.schema';
import Notification from '../database/schemas/notification.schema';
import { notificationService } from './notification.service';
import { 
  CreateRoomData, 
  UpdateRoomData, 
  AddMemberData, 
  ChangeMemberRoleData, 
  RemoveMemberData,
  RoomService 
} from '../models/room.model';

// Generate unique room ID
const generateRoomId = (): string => {
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `#${randomId}`;
};

class RoomServiceImpl implements RoomService {
  async createRoom(data: CreateRoomData): Promise<IRoom> {
    // Generate unique room ID
    let roomId = generateRoomId();
    
    // Ensure room ID is unique
    let existingRoom = await Room.findOne({ roomId: roomId });
    while (existingRoom) {
      roomId = generateRoomId();
      existingRoom = await Room.findOne({ roomId: roomId });
    }

    const room = new Room({
      roomId: roomId,
      name: data.name,
      description: data.description,
      profilePicture: data.profilePicture,
      createdBy: data.createdBy,
      members: [{
        userId: data.createdBy,
        username: data.createdByUsername,
        mobileNumber: data.createdByMobileNumber,
        role: 'admin',
        joinedAt: new Date(),
        profilePicture: data.createdByProfilePicture
      }]
    });

    return await room.save();
  }

  async getRoomById(roomId: string): Promise<IRoom | null> {
    return await Room.findOne({ roomId: roomId }).populate('createdBy', 'username mobileNumber');
  }

  async getRoomByMongoId(id: string): Promise<IRoom | null> {
    return await Room.findById(id).populate('createdBy', 'username mobileNumber');
  }

  async getRoomsByUserId(userId: string): Promise<IRoom[]> {
    try {
      console.log(`🔍 Fetching rooms for user: ${userId}`);
      
      const rooms = await Room.find({
        'members.userId': userId,
        isActive: true
      })
      .sort({ updatedAt: -1 })
      .maxTimeMS(15000) // Add 15 second timeout to this specific query
      .lean(); // Use lean() for better performance

      console.log(`✅ Found ${rooms.length} rooms for user: ${userId}`);
      return rooms;
    } catch (error: any) {
      console.error('❌ Error fetching rooms:', error);
      
      // If it's a timeout error, return empty array instead of crashing
      if (error.message?.includes('timed out') || error.message?.includes('buffering timed out')) {
        console.log('⚠️ Database timeout, returning empty rooms array');
        return [];
      }
      
      throw error; // Re-throw other errors
    }
  }

  async updateRoom(roomId: string, data: UpdateRoomData, updatedBy: string): Promise<IRoom | null> {
    console.log('Room service updateRoom - roomId:', roomId);
    console.log('Room service updateRoom - updatedBy:', updatedBy);
    
    // Check if user can edit the room
    const canEdit = await this.canUserEditRoom(roomId, updatedBy);
    console.log('Can user edit room:', canEdit);
    if (!canEdit) {
      throw new Error('You do not have permission to edit this room');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.profilePicture !== undefined) {
      console.log('Room service - profilePicture data:', data.profilePicture);
      updateData.profilePicture = data.profilePicture;
    }
    
    console.log('Room service - updateData:', updateData);

    return await Room.findOneAndUpdate(
      { roomId: roomId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async updateRoomByMongoId(id: string, data: UpdateRoomData, updatedBy: string): Promise<IRoom | null> {
    console.log('Room service updateRoomByMongoId - id:', id);
    console.log('Room service updateRoomByMongoId - updatedBy:', updatedBy);
    
    // Check if user can edit the room
    const canEdit = await this.canUserEditRoomByMongoId(id, updatedBy);
    console.log('Can user edit room:', canEdit);
    if (!canEdit) {
      throw new Error('You do not have permission to edit this room');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;

    return await Room.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async addMember(data: AddMemberData): Promise<IRoom | null> {
    // Check if user can manage the room (using MongoDB ID)
    const canManage = await this.canUserManageRoomByMongoId(data.roomId, data.addedBy);
    if (!canManage) {
      throw new Error('You do not have permission to add members to this room');
    }

    // Find user by username
    const username = data.username.trim().replace('@', ''); // Remove @ if present
    const user = await User.findOne({ "username": username });
    
    if (!user) {
      throw new Error('User not found with this username');
    }

    // Check if user is already in the room
    const room = await Room.findById(data.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const existingMember = room.members.find(member => member.userId === user._id.toString());
    if (existingMember) {
      throw new Error('User is already a member of this room');
    }

    // Get admin user details for notification
    const adminUser = await User.findById(data.addedBy);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Add user to room with pending status
    const newMember = {
      userId: user._id.toString(),
      username: user.username || user.mobileNumber,
      mobileNumber: user.mobileNumber,
      role: 'viewer' as const,
      status: 'pending' as const,
      joinedAt: new Date(),
      profilePicture: user.profile?.profilePicture
    };

    room.members.push(newMember);
    await room.save();

    // Send room invitation notification
    await notificationService.createNotification({
      type: 'room_invitation',
      title: 'Room Invitation',
      message: `${adminUser.username || adminUser.mobileNumber} has invited you to join the room "${room.name}"`,
      recipientId: user._id.toString(),
      senderId: data.addedBy,
      roomId: data.roomId,
      roomName: room.name,
      status: 'pending', // Set status to pending for room invitations
      metadata: {
        invitationId: data.roomId + '_' + user._id.toString() // Unique invitation ID
      }
    });

    // Return the updated room with pending member
    return room;
  }

  async changeMemberRole(data: ChangeMemberRoleData): Promise<IRoom | null> {
    // Check if user can manage the room (using MongoDB ID)
    const canManage = await this.canUserManageRoomByMongoId(data.roomId, data.changedBy);
    if (!canManage) {
      throw new Error('You do not have permission to change member roles');
    }

    const room = await Room.findById(data.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const member = room.members.find(m => m.userId === data.memberId);
    if (!member) {
      throw new Error('Member not found in this room');
    }

    // Prevent removing the last admin
    if (member.role === 'admin' && data.newRole !== 'admin') {
      const adminCount = room.members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin from the room');
      }
    }

    member.role = data.newRole;
    return await room.save();
  }

  async removeMember(data: RemoveMemberData): Promise<IRoom | null> {
    // Check if user can manage the room (using MongoDB ID)
    const canManage = await this.canUserManageRoomByMongoId(data.roomId, data.removedBy);
    if (!canManage) {
      throw new Error('You do not have permission to remove members from this room');
    }

    const room = await Room.findById(data.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const member = room.members.find(m => m.userId === data.memberId);
    if (!member) {
      throw new Error('Member not found in this room');
    }

    // Prevent removing the last admin
    if (member.role === 'admin') {
      const adminCount = room.members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin from the room');
      }
    }

    room.members = room.members.filter(m => m.userId !== data.memberId);
    return await room.save();
  }

  async deleteRoom(roomId: string, deletedBy: string): Promise<boolean> {
    // Check if user can manage the room (only admins can delete)
    const canManage = await this.canUserManageRoom(roomId, deletedBy);
    if (!canManage) {
      throw new Error('You do not have permission to delete this room');
    }

    const result = await Room.findOneAndUpdate(
      { roomId: roomId },
      { isActive: false },
      { new: true }
    );

    return !!result;
  }

  async deleteRoomByMongoId(id: string, deletedBy: string): Promise<boolean> {
    // Check if user can manage the room (only admins can delete)
    const canManage = await this.canUserManageRoomByMongoId(id, deletedBy);
    if (!canManage) {
      throw new Error('You do not have permission to delete this room');
    }

    const result = await Room.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    return !!result;
  }

  async getRoomMembers(roomId: string): Promise<IRoomMember[]> {
    const room = await Room.findOne({ roomId: roomId });
    return room ? room.members : [];
  }

  async getRoomMembersByMongoId(id: string): Promise<IRoomMember[]> {
    const room = await Room.findById(id);
    return room ? room.members : [];
  }

  async getUserRoleInRoom(roomId: string, userId: string): Promise<'admin' | 'editor' | 'viewer' | null> {
    console.log('getUserRoleInRoom - roomId:', roomId, 'userId:', userId);
    const room = await Room.findOne({ roomId: roomId });
    console.log('Found room:', room ? 'yes' : 'no');
    if (!room) return null;

    const member = room.members.find(m => m.userId === userId);
    console.log('Found member:', member ? member.role : 'no');
    return member ? member.role : null;
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInRoom(roomId, userId);
    return role !== null;
  }

  async canUserManageRoom(roomId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInRoom(roomId, userId);
    return role === 'admin';
  }

  async canUserEditRoom(roomId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInRoom(roomId, userId);
    return role === 'admin' || role === 'editor';
  }

  async canUserViewRoom(roomId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInRoom(roomId, userId);
    return role !== null;
  }

  async getUserRoleInRoomByMongoId(id: string, userId: string): Promise<'admin' | 'editor' | 'viewer' | null> {
    console.log('getUserRoleInRoomByMongoId - id:', id, 'userId:', userId);
    const room = await Room.findById(id);
    console.log('Found room:', room ? 'yes' : 'no');
    if (!room) return null;

    const member = room.members.find(m => m.userId === userId);
    console.log('Found member:', member ? member.role : 'no');
    return member ? member.role : null;
  }

  async canUserEditRoomByMongoId(id: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInRoomByMongoId(id, userId);
    return role === 'admin' || role === 'editor';
  }

  async canUserViewRoomByMongoId(id: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInRoomByMongoId(id, userId);
    return role !== null;
  }

  async canUserManageRoomByMongoId(id: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInRoomByMongoId(id, userId);
    return role === 'admin';
  }

  async getPendingInvitations(roomId: string): Promise<any[]> {
    const notifications = await Notification.find({
      roomId: roomId,
      type: 'room_invitation',
      status: 'pending'
    }).populate('recipientId', 'username mobileNumber profile.profilePicture');
    
    return notifications.map(notif => ({
      id: notif._id.toString(),
      userId: notif.recipientId._id.toString(),
      username: notif.recipientId.username || notif.recipientId.mobileNumber,
      mobileNumber: notif.recipientId.mobileNumber,
      profilePicture: notif.recipientId.profile?.profilePicture,
      invitedAt: notif.createdAt,
      status: 'pending'
    }));
  }

  async approveRoomInvitation(roomId: string, userId: string): Promise<IRoom | null> {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const member = room.members.find(m => m.userId === userId && m.status === 'pending');
    if (!member) {
      throw new Error('Pending invitation not found');
    }

    // Update member status to active
    member.status = 'active';
    await room.save();

    // Update notification status
    await Notification.findOneAndUpdate(
      {
        roomId: roomId,
        recipientId: userId,
        type: 'room_invitation',
        status: 'pending'
      },
      { status: 'approved' }
    );

    return room;
  }

  async rejectRoomInvitation(roomId: string, userId: string): Promise<IRoom | null> {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const member = room.members.find(m => m.userId === userId && m.status === 'pending');
    if (!member) {
      throw new Error('Pending invitation not found');
    }

    // Remove member from room
    room.members = room.members.filter(m => m.userId !== userId);
    await room.save();

    // Update notification status
    await Notification.findOneAndUpdate(
      {
        roomId: roomId,
        recipientId: userId,
        type: 'room_invitation',
        status: 'pending'
      },
      { status: 'rejected' }
    );

    return room;
  }

  async leaveRoom(roomId: string, userId: string): Promise<IRoom | null> {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const member = room.members.find(m => m.userId === userId);
    if (!member) {
      throw new Error('You are not a member of this room');
    }

    // Prevent the last admin from leaving
    if (member.role === 'admin') {
      const adminCount = room.members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Cannot leave room as the last admin. Transfer admin role or delete the room.');
      }
    }

    // Remove member from room
    room.members = room.members.filter(m => m.userId !== userId);
    await room.save();

    return room;
  }
}

export default new RoomServiceImpl();
