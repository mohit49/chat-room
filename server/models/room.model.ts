import { IRoom, IRoomMember } from '../database/schemas/room.schema';

export interface CreateRoomData {
  name: string;
  description?: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  createdBy: string;
  createdByUsername: string;
  createdByMobileNumber: string;
  createdByProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

export interface UpdateRoomData {
  name?: string;
  description?: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

export interface AddMemberData {
  roomId: string;
  mobileNumber: string;
  addedBy: string;
}

export interface ChangeMemberRoleData {
  roomId: string;
  memberId: string;
  newRole: 'admin' | 'editor' | 'viewer';
  changedBy: string;
}

export interface RemoveMemberData {
  roomId: string;
  memberId: string;
  removedBy: string;
}

export interface RoomService {
  createRoom(data: CreateRoomData): Promise<IRoom>;
  getRoomById(roomId: string): Promise<IRoom | null>;
  getRoomsByUserId(userId: string): Promise<IRoom[]>;
  updateRoom(roomId: string, data: UpdateRoomData, updatedBy: string): Promise<IRoom | null>;
  addMember(data: AddMemberData): Promise<IRoom | null>;
  changeMemberRole(data: ChangeMemberRoleData): Promise<IRoom | null>;
  removeMember(data: RemoveMemberData): Promise<IRoom | null>;
  deleteRoom(roomId: string, deletedBy: string): Promise<boolean>;
  getRoomMembers(roomId: string): Promise<IRoomMember[]>;
  getUserRoleInRoom(roomId: string, userId: string): Promise<'admin' | 'editor' | 'viewer' | null>;
  isUserInRoom(roomId: string, userId: string): Promise<boolean>;
  canUserManageRoom(roomId: string, userId: string): Promise<boolean>;
  canUserEditRoom(roomId: string, userId: string): Promise<boolean>;
  canUserViewRoom(roomId: string, userId: string): Promise<boolean>;
}
