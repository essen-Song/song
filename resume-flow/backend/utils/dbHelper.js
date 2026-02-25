/**
 * 数据库助手工具
 * 提供数据库操作的便捷方法
 */

const { supabase } = require('./supabase');

class DatabaseHelper {
  /**
   * 插入简历优化记录
   */
  async insertResumeOptimization(data) {
    try {
      const { data: result, error } = await supabase
        .from('resume_optimizations')
        .insert([{
          user_id: data.user_id,
          resume_id: data.resume_id,
          job_description: data.job_description,
          original_text: data.original_text,
          optimized_versions: data.optimized_versions,
          missing_keywords: data.missing_keywords,
          optimization_score: data.optimization_score,
          type: data.type,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('插入简历优化记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户简历
   */
  async getResume(resumeId, userId) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取简历失败:', error);
      throw error;
    }
  }

  /**
   * 插入投递申请记录
   */
  async insertApplication(data) {
    try {
      const { data: result, error } = await supabase
        .from('applications')
        .insert([{
          user_id: data.user_id,
          resume_id: data.resume_id,
          platform: data.platform,
          job_title: data.job_title,
          company_name: data.company_name,
          status: data.status || 'pending',
          resume_data: data.resume_data,
          delivery_result: data.delivery_result,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('插入投递记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新投递状态
   */
  async updateApplicationStatus(applicationId, status, userId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('更新投递状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(userId) {
    try {
      // 获取简历数量
      const { count: resumeCount } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 获取投递数量
      const { count: applicationCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 获取面试邀请数量
      const { count: interviewCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'interview');

      return {
        resumeCount: resumeCount || 0,
        applicationCount: applicationCount || 0,
        interviewCount: interviewCount || 0
      };
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return {
        resumeCount: 0,
        applicationCount: 0,
        interviewCount: 0
      };
    }
  }

  /**
   * 获取用户简历列表
   */
  async getUserResumes(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取用户简历列表失败:', error);
      return [];
    }
  }

  /**
   * 获取投递历史
   */
  async getDeliveryHistory(userId, filters = {}) {
    try {
      let query = supabase
        .from('applications')
        .select(`
          *,
          resumes (name, file_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters.platform) {
        query = query.eq('platform', filters.platform);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取投递历史失败:', error);
      return [];
    }
  }

  /**
   * 插入面试会话
   */
  async insertInterviewSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert([{
          user_id: sessionData.userId,
          job_title: sessionData.jobTitle,
          interview_type: sessionData.interviewType,
          session_data: sessionData.sessionData,
          status: 'active',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('插入面试会话失败:', error);
      throw error;
    }
  }

  /**
   * 更新面试会话
   */
  async updateInterviewSession(sessionId, updateData) {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('更新面试会话失败:', error);
      throw error;
    }
  }

  /**
   * 插入面试回答
   */
  async insertInterviewAnswer(answerData) {
    try {
      const { data, error } = await supabase
        .from('interview_answers')
        .insert([{
          session_id: answerData.sessionId,
          question_id: answerData.questionId,
          question: answerData.question,
          user_answer: answerData.userAnswer,
          answer_type: answerData.answerType,
          voice_data: answerData.voiceData,
          evaluation: answerData.evaluation,
          feedback: answerData.feedback,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('插入面试回答失败:', error);
      throw error;
    }
  }

  /**
   * 获取面试历史
   */
  async getInterviewHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          interview_answers (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取面试历史失败:', error);
      return [];
    }
  }
}

module.exports = { DatabaseHelper };