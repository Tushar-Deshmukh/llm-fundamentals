import { Router } from "express";
import { chatController , streamChat} from "../controllers/chat.controller.js";

const router = Router();

router.post("/", chatController);
router.post("/stream",streamChat)

export default router;