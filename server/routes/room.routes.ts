import express from 'express';
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  addMember,
  changeMemberRole,
  removeMember,
  deleteRoom,
  getRoomMembers,
  getPendingInvitations,
  approveRoomInvitation,
  rejectRoomInvitation,
  leaveRoom
} from '../controllers/room.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Room CRUD operations
router.post('/', createRoom);
router.get('/', getRooms);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

// Member management
router.post('/:id/members', addMember);
router.get('/:id/members', getRoomMembers);
router.get('/:id/pending-invitations', getPendingInvitations);
router.put('/:id/members/:memberId/role', changeMemberRole);
router.delete('/:id/members/:memberId', removeMember);

// Room invitation management
router.post('/approve-invitation', approveRoomInvitation);
router.post('/reject-invitation', rejectRoomInvitation);

// Leave room
router.post('/:id/leave', leaveRoom);

export default router;
