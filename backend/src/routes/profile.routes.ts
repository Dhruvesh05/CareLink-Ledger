import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { profileAvatarUpload } from "../middleware/profileAvatarUpload.middleware";
import { ProfileController } from "../controllers/ProfileController";

const router = Router();
const controller = new ProfileController();
router.use(authenticate);
router.get("/me", controller.getMe.bind(controller));
router.put("/me", controller.updateMe.bind(controller));
router.post("/me/avatar", profileAvatarUpload, controller.uploadAvatar.bind(controller));
router.delete("/me/avatar", controller.deleteAvatar.bind(controller));
export default router;
