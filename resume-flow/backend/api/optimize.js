const express = require('express');
const AIOptimizer = require('../utils/aiOptimizer');
const { supabase, DatabaseHelper } = require('../utils/supabase');

const router = express.Router();
const aiOptimizer = new AIOptimizer();
const dbHelper = new DatabaseHelper();

/**
 * POST /api/optimize/resume
 * 优化简历内容
 */
router.post('/resume', express.json(), async (req, res) => {
  try {
    const { 
      originalText, 
      jobDescription, 
      type = 'self_evaluation',
      userId,
      resumeId 
    } = req.body;
    
    // 参数验证
    if (!originalText || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: '原始文本和岗位JD不能为空'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID不能为空'
      });
    }
    
    console.log(`开始优化简历内容，用户: ${userId}, 类型: ${type}`);
    
    // 调用AI优化服务
    const optimizationResult = await aiOptimizer.optimizeResume(
      originalText,
      jobDescription,
      type
    );
    
    if (!optimizationResult.success) {
      console.warn('AI优化失败，使用模拟数据');
    }
    
    // 保存优化记录到数据库
    const optimizationData = {
      user_id: userId,
      resume_id: resumeId,
      job_description: jobDescription,
      original_text: originalText,
      optimized_versions: optimizationResult.data.versions,
      missing_keywords: optimizationResult.data.missingKeywords,
      optimization_score: optimizationResult.data.keywordMatchRate,
      type: type
    };
    
    try {
      await dbHelper.insertResumeOptimization(optimizationData);
    } catch (dbError) {
      console.error('保存优化记录失败:', dbError);
      // 不中断主流程
    }
    
    console.log(`简历优化完成，关键词匹配率: ${optimizationResult.data.keywordMatchRate}%`);
    
    res.json({
      success: true,
      data: {
        optimizationResult: optimizationResult.data,
        aiSuccess: optimizationResult.success,
        timestamp: new Date().toISOString()
      },
      message: optimizationResult.success ? '简历优化成功' : '简历优化完成（使用模拟数据）'
    });
    
  } catch (error) {
    console.error('简历优化失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '简历优化失败'
    });
  }
});

/**
 * POST /api/optimize/batch
 * 批量优化简历多个部分
 */
router.post('/batch', express.json(), async (req, res) => {
  try {
    const { 
      originalTexts, 
      jobDescription, 
      userId,
      resumeId 
    } = req.body;
    
    // 参数验证
    if (!originalTexts || !jobDescription || !userId) {
      return res.status(400).json({
        success: false,
        error: '参数不完整'
      });
    }
    
    console.log(`开始批量优化简历，用户: ${userId}`);
    
    // 批量优化
    const batchResults = await aiOptimizer.optimizeMultiple(
      originalTexts,
      jobDescription
    );
    
    // 计算总体匹配率
    const successResults = Object.values(batchResults).filter(r => r.success);
    const avgMatchRate = successResults.length > 0 
      ? Math.round(successResults.reduce((sum, r) => sum + r.data.keywordMatchRate, 0) / successResults.length)
      : 0;
    
    // 保存批量优化记录
    const batchOptimizationData = {
      user_id: userId,
      resume_id: resumeId,
      job_description: jobDescription,
      original_texts: originalTexts,
      batch_results: batchResults,
      avg_optimization_score: avgMatchRate
    };
    
    try {
      // 这里可以创建一个新的表来保存批量优化记录
      console.log('批量优化记录已准备保存');
    } catch (dbError) {
      console.error('保存批量优化记录失败:', dbError);
    }
    
    console.log(`批量优化完成，平均匹配率: ${avgMatchRate}%`);
    
    res.json({
      success: true,
      data: {
        batchResults: batchResults,
        avgMatchRate: avgMatchRate,
        successCount: successResults.length,
        totalCount: Object.keys(batchResults).length,
        timestamp: new Date().toISOString()
      },
      message: '批量优化完成'
    });
    
  } catch (error) {
    console.error('批量优化失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '批量优化失败'
    });
  }
});

/**
 * POST /api/optimize/suggestions
 * 获取简历优化建议
 */
router.post('/suggestions', express.json(), async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: '简历文本和岗位JD不能为空'
      });
    }
    
    console.log('开始生成优化建议');
    
    const suggestionsResult = await aiOptimizer.getOptimizationSuggestions(
      resumeText,
      jobDescription
    );
    
    res.json({
      success: true,
      data: suggestionsResult.data,
      aiSuccess: suggestionsResult.success,
      message: '优化建议生成完成'
    });
    
  } catch (error) {
    console.error('生成优化建议失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '生成优化建议失败'
    });
  }
});

module.exports = router;