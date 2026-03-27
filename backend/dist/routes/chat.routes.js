"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const aiService_1 = require("../services/aiService");
const router = (0, express_1.Router)();
/**
 * POST /api/admin/chat
 * Admin hanya - get AI insights untuk laporan
 */
router.post('/chat', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { question } = req.body;
        if (!question || question.trim().length === 0) {
            return res.status(400).json({
                error: 'Question is required',
                message: 'Silakan masukkan pertanyaan untuk AI'
            });
        }
        // Get AI insights
        const insight = await (0, aiService_1.getAIInsights)(question);
        return res.json({
            question,
            insight,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error in chat endpoint:', error);
        return res.status(500).json({
            error: 'Failed to get AI insights',
            message: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        });
    }
});
/**
 * GET /api/admin/chat/suggested-questions
 * Admin hanya - get suggested questions
 */
router.get('/suggested-questions', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const questions = (0, aiService_1.getSuggestedQuestions)();
        res.json({ questions });
    }
    catch (error) {
        console.error('Error getting suggested questions:', error);
        res.status(500).json({
            error: 'Failed to get suggested questions',
            message: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        });
    }
});
/**
 * GET /api/admin/chat/context
 * Admin hanya - get laporan context data untuk dashboard
 */
router.get('/context', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const context = await (0, aiService_1.aggregateLaporanData)();
        res.json(context);
    }
    catch (error) {
        console.error('Error getting context:', error);
        res.status(500).json({
            error: 'Failed to get context',
            message: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        });
    }
});
exports.default = router;
//# sourceMappingURL=chat.routes.js.map