const databaseService = require('./databaseService');
const vectorDatabaseService = require('./vectorDatabaseService');

class ResumeSearchService {
    async searchSimilarResumes(query, userId = null, limit = 5) {
        try {
            const results = await vectorDatabaseService.searchSimilarResumes(query, limit);
            
            if (results.ids.length === 0) {
                return { success: false, message: '未找到相似简历' };
            }
            
            const resumes = [];
            for (let i = 0; i < results.ids.length; i++) {
                const metadata = results.metadatas[i];
                const resumeId = metadata.resumeId;
                
                // 从数据库获取完整简历信息
                const resumeData = databaseService.getResumes(userId).find(r => r.id === resumeId);
                
                if (resumeData) {
                    resumes.push({
                        ...resumeData,
                        similarity: 1 - (results.distances[i] || 0),
                        content: results.documents[i]
                    });
                }
            }
            
            return {
                success: true,
                data: resumes.sort((a, b) => b.similarity - a.similarity)
            };
        } catch (error) {
            console.error('❌ 搜索相似简历失败:', error);
            return { success: false, error: error.message };
        }
    }

    async searchSimilarJobs(query, limit = 5) {
        try {
            const results = await vectorDatabaseService.searchSimilarJobs(query, limit);
            
            if (results.ids.length === 0) {
                return { success: false, message: '未找到相似职位' };
            }
            
            const jobs = [];
            for (let i = 0; i < results.ids.length; i++) {
                const metadata = results.metadatas[i];
                
                jobs.push({
                    ...metadata,
                    similarity: 1 - (results.distances[i] || 0),
                    description: results.documents[i]
                });
            }
            
            return {
                success: true,
                data: jobs.sort((a, b) => b.similarity - a.similarity)
            };
        } catch (error) {
            console.error('❌ 搜索相似职位失败:', error);
            return { success: false, error: error.message };
        }
    }

    async addJobDescription(jobId, description, metadata = {}) {
        try {
            const success = await vectorDatabaseService.addJobDescriptionVector(jobId, description, metadata);
            return { success };
        } catch (error) {
            console.error('❌ 添加职位描述失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getDatabaseStats() {
        try {
            const vectorStats = await vectorDatabaseService.getCollectionStats();
            const apiUsage = databaseService.getApiUsage(10);
            
            return {
                vectorDatabase: vectorStats,
                recentApiUsage: apiUsage,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ 获取数据库统计失败:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ResumeSearchService();