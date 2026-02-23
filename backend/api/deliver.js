const express = require('express');
const AutoDeliveryService = require('../utils/autoDelivery');
const { supabase, DatabaseHelper } = require('../utils/supabase');

const router = express.Router();
const deliveryService = new AutoDeliveryService();
const dbHelper = new DatabaseHelper();

/**
 * POST /api/deliver/auto
 * 自动投递简历
 */
router.post('/auto', express.json(), async (req, res) => {
  try {
    const {
      userId,
      resumeId,
      jobFilters,
      userCredentials,
      platforms = ['boss', 'zhilian', '51job']
    } = req.body;
    
    // 参数验证
    if (!userId || !resumeId || !jobFilters) {
      return res.status(400).json({
        success: false,
        error: '用户ID、简历ID和职位筛选条件不能为空'
      });
    }
    
    if (!jobFilters.keywords) {
      return res.status(400).json({
        success: false,
        error: '职位关键词不能为空'
      });
    }
    
    console.log(`开始自动投递，用户: ${userId}, 简历: ${resumeId}`);
    
    // 获取简历数据
    const resumeData = await dbHelper.getResume(resumeId, userId);
    if (!resumeData) {
      return res.status(404).json({
        success: false,
        error: '简历不存在或无权限访问'
      });
    }
    
    // 设置启用的平台
    Object.keys(deliveryService.platforms).forEach(platformKey => {
      deliveryService.platforms[platformKey].enabled = platforms.includes(platformKey);
    });
    
    // 执行自动投递
    const deliveryResult = await deliveryService.autoDeliver(
      resumeData,
      jobFilters,
      userCredentials || {}
    );
    
    // 保存投递记录
    for (const [platformKey, result] of Object.entries(deliveryResult.results)) {
      if (result.details && result.details.appliedJobs) {
        for (const job of result.details.appliedJobs) {
          try {
            await dbHelper.insertApplication({
              user_id: userId,
              resume_id: resumeId,
              platform: platformKey,
              job_title: job.jobTitle,
              company_name: job.company,
              status: job.success ? 'sent' : 'failed',
              resume_data: resumeData,
              delivery_result: result
            });
          } catch (dbError) {
            console.error('保存投递记录失败:', dbError);
          }
        }
      }
    }
    
    console.log(`自动投递完成，成功率: ${deliveryResult.stats.successRate}%`);
    
    res.json({
      success: true,
      data: deliveryResult,
      message: `自动投递完成，共投递${deliveryResult.stats.total}个职位`
    });
    
  } catch (error) {
    console.error('自动投递失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '自动投递失败'
    });
  }
});

/**
 * GET /api/deliver/status/:applicationId
 * 获取投递状态
 */
router.get('/status/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID不能为空'
      });
    }
    
    // 查询投递记录
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw new Error('投递记录不存在');
    }
    
    // 尝试获取最新状态（如果平台支持）
    let currentStatus = data.status;
    let statusDetails = data.delivery_result;
    
    try {
      const statusResult = await deliveryService.getDeliveryStatus(userId, data.platform);
      if (statusResult.success && statusResult.status !== currentStatus) {
        currentStatus = statusResult.status;
        
        // 更新数据库状态
        await dbHelper.updateApplicationStatus(applicationId, currentStatus, userId);
      }
    } catch (statusError) {
      console.warn('获取最新状态失败:', statusError);
    }
    
    res.json({
      success: true,
      data: {
        ...data,
        current_status: currentStatus,
        status_details: statusDetails
      }
    });
    
  } catch (error) {
    console.error('获取投递状态失败:', error);
    res.status(404).json({
      success: false,
      error: error.message || '投递记录不存在'
    });
  }
});

/**
 * GET /api/deliver/history/:userId
 * 获取投递历史
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      platform, 
      status, 
      limit = 50, 
      offset = 0,
      startDate,
      endDate
    } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID不能为空'
      });
    }
    
    // 构建查询条件
    let query = supabase
      .from('applications')
      .select(`
        *,
        resumes (name, file_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (platform) {
      query = query.eq('platform', platform);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error('获取投递历史失败');
    }
    
    // 统计信息
    const stats = await calculateDeliveryStats(userId, { platform, status, startDate, endDate });
    
    res.json({
      success: true,
      data: data || [],
      count: data ? data.length : 0,
      total: count || 0,
      stats: stats,
      hasMore: data && data.length === limit
    });
    
  } catch (error) {
    console.error('获取投递历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取投递历史失败'
    });
  }
});

/**
 * POST /api/deliver/cancel/:applicationId
 * 取消投递
 */
router.post('/cancel/:applicationId', express.json(), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID不能为空'
      });
    }
    
    // 更新投递状态为已取消
    const { data, error } = await supabase
      .from('applications')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error('取消投递失败');
    }
    
    res.json({
      success: true,
      data: data,
      message: '投递已取消'
    });
    
  } catch (error) {
    console.error('取消投递失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '取消投递失败'
    });
  }
});

/**
 * GET /api/deliver/stats/:userId
 * 获取投递统计
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID不能为空'
      });
    }
    
    const stats = await calculateDeliveryStats(userId, { startDate, endDate });
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('获取投递统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取投递统计失败'
    });
  }
});

/**
 * GET /api/deliver/platforms
 * 获取支持的投递平台
 */
router.get('/platforms', (req, res) => {
  try {
    const platforms = Object.entries(deliveryService.platforms).map(([key, platform]) => ({
      key: key,
      name: platform.name,
      enabled: platform.enabled,
      description: getPlatformDescription(key)
    }));
    
    res.json({
      success: true,
      data: platforms
    });
    
  } catch (error) {
    console.error('获取平台信息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取平台信息失败'
    });
  }
});

/**
 * 计算投递统计
 */
async function calculateDeliveryStats(userId, filters = {}) {
  try {
    let query = supabase
      .from('applications')
      .select('status, platform, created_at', { count: 'exact' })
      .eq('user_id', userId);
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    if (filters.platform) {
      query = query.eq('platform', filters.platform);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    const total = data.length;
    const byStatus = {};
    const byPlatform = {};
    
    data.forEach(app => {
      // 按状态统计
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
      
      // 按平台统计
      byPlatform[app.platform] = (byPlatform[app.platform] || 0) + 1;
    });
    
    const sent = byStatus.sent || 0;
    const viewed = byStatus.viewed || 0;
    const interview = byStatus.interview || 0;
    const rejected = byStatus.rejected || 0;
    
    return {
      total: total,
      sent: sent,
      viewed: viewed,
      interview: interview,
      rejected: rejected,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      interviewRate: sent > 0 ? Math.round((interview / sent) * 100) : 0,
      byStatus: byStatus,
      byPlatform: byPlatform
    };
    
  } catch (error) {
    console.error('计算投递统计失败:', error);
    throw error;
  }
}

/**
 * 获取平台描述
 */
function getPlatformDescription(platformKey) {
  const descriptions = {
    boss: 'BOSS直聘 - 直接与老板沟通的招聘平台',
    zhilian: '智联招聘 - 综合性招聘网站',
    '51job': '前程无忧 - 老牌招聘平台'
  };
  
  return descriptions[platformKey] || '未知平台';
}

module.exports = router;