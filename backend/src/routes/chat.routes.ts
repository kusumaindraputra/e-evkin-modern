import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
import { getAIInsights, getSuggestedQuestions, aggregateLaporanData } from '../services/aiService';

const router = Router();

/**
 * POST /api/admin/chat
 * Admin hanya - get AI insights untuk laporan
 */
router.post('/chat', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        error: 'Question is required',
        message: 'Silakan masukkan pertanyaan untuk AI'
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        error: 'Question too long',
        message: 'Pertanyaan maksimal 2000 karakter'
      });
    }

    // Get AI insights
    const insight = await getAIInsights(question);

    return res.json({
      question,
      insight,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
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
router.get('/suggested-questions', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const questions = getSuggestedQuestions();
    res.json({ questions });
  } catch (error: any) {
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
router.get('/context', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const context = await aggregateLaporanData();
    res.json(context);
  } catch (error: any) {
    console.error('Error getting context:', error);
    res.status(500).json({
      error: 'Failed to get context',
      message: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
});

export default router;
