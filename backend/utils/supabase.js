const { createClient } = require('@supabase/supabase-js');

// 创建Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase配置缺失，请检查环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 数据库操作工具类
class DatabaseHelper {
  constructor() {
    this.client = supabase;
  }
  
  /**
   * 插入简历数据
   */
  async insertResume(resumeData) {
    try {
      const { data, error } = await this.client
        .from('resumes')
        .insert([resumeData])
        .select()
        .single();
      
      if (error) {
        console.error('插入简历数据失败:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取简历详情
   */
  async getResume(resumeId, userId = null) {
    try {
      let query = this.client
        .from('resumes')
        .select('*')
        .eq('id', resumeId);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('简历不存在');
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('获取简历失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户简历列表
   */
  async getUserResumes(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await this.client
        .from('resumes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      return {
        data: data || [],
        count: count || 0,
        hasMore: count > offset + limit
      };
    } catch (error) {
      console.error('获取用户简历失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新简历数据
   */
  async updateResume(resumeId, updateData, userId = null) {
    try {
      let query = this.client
        .from('resumes')
        .update(updateData)
        .eq('id', resumeId);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.select().single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('更新简历失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除简历
   */
  async deleteResume(resumeId, userId = null) {
    try {
      let query = this.client
        .from('resumes')
        .delete()
        .eq('id', resumeId);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { error } = await query;
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('删除简历失败:', error);
      throw error;
    }
  }
  
  /**
   * 插入投递记录
   */
  async insertApplication(applicationData) {
    try {
      const { data, error } = await this.client
        .from('applications')
        .insert([applicationData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('插入投递记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户投递记录
   */
  async getUserApplications(userId, limit = 100, offset = 0) {
    try {
      const { data, error, count } = await this.client
        .from('applications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      return {
        data: data || [],
        count: count || 0,
        hasMore: count > offset + limit
      };
    } catch (error) {
      console.error('获取投递记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新投递状态
   */
  async updateApplicationStatus(applicationId, status, userId = null) {
    try {
      let query = this.client
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.select().single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('更新投递状态失败:', error);
      throw error;
    }
  }
  
  /**
   * 插入面试记录
   */
  async insertInterviewLog(interviewData) {
    try {
      const { data, error } = await this.client
        .from('interview_logs')
        .insert([interviewData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('插入面试记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户面试记录
   */
  async getUserInterviewLogs(userId, limit = 100, offset = 0) {
    try {
      const { data, error } = await this.client
        .from('interview_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('获取面试记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 插入简历优化记录
   */
  async insertResumeOptimization(optimizationData) {
    try {
      const { data, error } = await this.client
        .from('resume_optimizations')
        .insert([optimizationData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('插入优化记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户设置
   */
  async getUserSettings(userId) {
    try {
      const { data, error } = await this.client
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('获取用户设置失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新或创建用户设置
   */
  async upsertUserSettings(userId, settings) {
    try {
      const { data, error } = await this.client
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('更新用户设置失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户完整档案
   */
  async getUserProfile(userId) {
    try {
      // 使用存储过程获取完整档案
      const { data, error } = await this.client
        .rpc('get_user_profile', { user_id_param: userId });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('获取用户档案失败:', error);
      throw error;
    }
  }
  
  /**
   * 统计用户数据
   */
  async getUserStats(userId) {
    try {
      // 获取简历数量
      const { count: resumeCount } = await this.client
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // 获取投递数量
      const { count: applicationCount } = await this.client
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // 获取面试记录数量
      const { count: interviewCount } = await this.client
        .from('interview_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      return {
        resumeCount: resumeCount || 0,
        applicationCount: applicationCount || 0,
        interviewCount: interviewCount || 0
      };
    } catch (error) {
      console.error('获取用户统计失败:', error);
      throw error;
    }
  }
}

module.exports = {
  supabase,
  DatabaseHelper
};