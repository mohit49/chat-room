import { Request, Response } from 'express';
import roomService from '../services/room.service';
import { validateRoomCreation, validateRoomUpdate, validateAddMember, validateChangeRole, validateRemoveMember } from '../validators/room.validator';

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { error, value } = validateRoomCreation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { name, description, profilePicture } = value;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get user details
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const roomData = {
      name,
      description,
      profilePicture,
      createdBy: userId,
      createdByUsername: user.username || user.mobileNumber,
      createdByMobileNumber: user.mobileNumber,
      createdByProfilePicture: user.profile.profilePicture
    };

    const room = await roomService.createRoom(roomData);

    res.status(201).json({
      success: true,
      room,
      message: 'Room created successfully'
    });
  } catch (error: any) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create room'
    });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const rooms = await roomService.getRoomsByUserId(userId);
    console.log('getRooms - returned rooms:', rooms.map(r => ({ id: r._id, roomId: r.roomId, name: r.name })));

    res.json({
      success: true,
      rooms
    });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch rooms'
    });
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Validate room ID
    if (!id || id === 'undefined' || id === 'null' || id.length !== 24) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const room = await roomService.getRoomByMongoId(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check if user has access to this room
    const canView = await roomService.canUserViewRoomByMongoId(id, userId);
    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this room'
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error: any) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch room'
    });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('=== ROOM UPDATE CONTROLLER DEBUG ===');
    console.log('Update room request - id:', id);
    
    // Validate room ID
    if (!id || id === 'undefined' || id === 'null' || id.length !== 24) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    console.log('Update room request - body:', JSON.stringify(req.body, null, 2));
    console.log('Update room request - profilePicture:', req.body.profilePicture);
    console.log('Update room request - userId:', req.userId);
    
    const { error, value } = validateRoomUpdate(req.body);
    
    if (error) {
      console.log('❌ Room update validation error:', error.details);
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    console.log('✅ Room update validation passed:', value);

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const room = await roomService.updateRoomByMongoId(id, value, userId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or you do not have permission to edit it'
      });
    }

    res.json({
      success: true,
      room,
      message: 'Room updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update room'
    });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = validateAddMember(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const room = await roomService.addMember({
      roomId: id,
      username: value.username,
      mobileNumber: value.mobileNumber,
      addedBy: userId
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or you do not have permission to add members'
      });
    }

    res.json({
      success: true,
      room,
      message: 'Invitation sent successfully. User will be added to the room once they approve the invitation.'
    });
  } catch (error: any) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add member'
    });
  }
};

export const changeMemberRole = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const { error, value } = validateChangeRole(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const room = await roomService.changeMemberRole({
      roomId: id,
      memberId,
      newRole: value.newRole,
      changedBy: userId
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or you do not have permission to change roles'
      });
    }

    res.json({
      success: true,
      room,
      message: 'Member role updated successfully'
    });
  } catch (error: any) {
    console.error('Error changing member role:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to change member role'
    });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const room = await roomService.removeMember({
      roomId: id,
      memberId,
      removedBy: userId
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or you do not have permission to remove members'
      });
    }

    res.json({
      success: true,
      room,
      message: 'Member removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove member'
    });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const deleted = await roomService.deleteRoomByMongoId(id, userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or you do not have permission to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete room'
    });
  }
};

export const getPendingInvitations = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user can manage the room
    const canManage = await roomService.canUserManageRoomByMongoId(id, userId);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view pending invitations'
      });
    }

    const pendingInvitations = await roomService.getPendingInvitations(id);

    res.json({
      success: true,
      pendingInvitations
    });
  } catch (error: any) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pending invitations'
    });
  }
};

export const getRoomMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user has access to this room
    const canView = await roomService.canUserViewRoomByMongoId(id, userId);
    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this room'
      });
    }

    const members = await roomService.getRoomMembersByMongoId(id);

    res.json({
      success: true,
      members
    });
  } catch (error: any) {
    console.error('Error fetching room members:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch room members'
    });
  }
};

export const approveRoomInvitation = async (req: Request, res: Response) => {
  try {
    const { roomId, userId } = req.body;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!roomId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and User ID are required'
      });
    }

    // Only the invited user can approve their own invitation
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only approve your own invitations'
      });
    }

    const room = await roomService.approveRoomInvitation(roomId, userId);

    res.json({
      success: true,
      room,
      message: 'Room invitation approved successfully'
    });
  } catch (error: any) {
    console.error('Error approving room invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve room invitation'
    });
  }
};

export const rejectRoomInvitation = async (req: Request, res: Response) => {
  try {
    const { roomId, userId } = req.body;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!roomId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and User ID are required'
      });
    }

    // Only the invited user can reject their own invitation
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only reject your own invitations'
      });
    }

    const room = await roomService.rejectRoomInvitation(roomId, userId);

    res.json({
      success: true,
      room,
      message: 'Room invitation rejected successfully'
    });
  } catch (error: any) {
    console.error('Error rejecting room invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject room invitation'
    });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const room = await roomService.leaveRoom(id, userId);

    res.json({
      success: true,
      room,
      message: 'Successfully left the room'
    });
  } catch (error: any) {
    console.error('Error leaving room:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to leave room'
    });
  }
};
