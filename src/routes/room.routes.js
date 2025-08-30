import { Router } from 'express';
import { 
    createRoom, 
    joinRoom, 
    getMyRooms, 
    deleteRoom, 
    kickMember,
    getRoomDetails 
} from '../controllers/room.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT); 

router.route("/create").post(createRoom);
router.route("/my-rooms").get(getMyRooms); 
router.route("/join/:roomId").post(joinRoom);
router.route("/:roomId/delete").delete(deleteRoom); 
router.route("/details/:roomId").get(getRoomDetails); 
router.route("/:roomId/kick").post(kickMember); 

export default router;