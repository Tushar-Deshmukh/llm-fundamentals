import { Router } from "express";
import { structuredOutputController } from "../controllers/structuredOutput.controller.js";

const router = Router();

router.post("/", structuredOutputController);

export default router;
