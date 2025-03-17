import express from "express";
import { getUsers, Register, Login, logout} from "../controller/users.js";
import { verfifyToken } from "../middleware/verifyToken.js";
import { refreshToken } from "../controller/refreshToken.js";

const router = express.Router();

router.get('/users', verfifyToken, getUsers);
router.post('/users', Register);
router.post('/login', Login);
router.get('/token', refreshToken);
router.delete('/logout', logout);

export default router;