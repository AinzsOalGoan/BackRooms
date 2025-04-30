import { Router } from "express";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/subscribed/:subscriberId", getSubscribedChannels);
router.post("/subscribe/:channelId", toggleSubscription);
router.get("/channel/:channelId/subscribers", getUserChannelSubscribers);

export default router;
