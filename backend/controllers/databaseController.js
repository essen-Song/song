const databaseService = require('../services/databaseService');
const vectorDatabaseService = require('../services/vectorDatabaseService');
const resumeSearchService = require('../services/resumeSearchService');

async function handleResumeUpload(req, res) {
    try {
        const { file } = req;
        const { userId, email, name } = req.body;
        
        if (!file) {
            return res.status(400).json({ success: false, error: '未上传文件' });
        }
        
        // 保存用户信息
        const savedUserId = databaseService.saveUser(email || 'anonymous', name || '');
        
        // 解析简历内容
        const resumeText = file.buffer.toString('utf8');
        
        // 使用 FreeModelService 解析简历
        const freeModelService = require('../ai-cluster/FreeModelService');
        const parseResult = await freeModelService.parseResume(resumeText, file.originalname, savedUserId);
        
        if (parseResult.success) {
            res.json({
                success: true,
                data: parseResult.data,
                model: parseResult.model,
                cost: parseResult.cost,
                responseTime: parseResult.responseTime
            });
        } else {
            res.status(500).json({
                success: false,
                error: parseResult.error,
                fallback: parseResult.fallback
            });
        }
    } catch (error) {
        console.error('❌ 简历上传处理失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function handleResumeSearch(req, res) {
    try {
        const { query, userId, limit = 5 } = req.query;
        
        if (!query) {
            return res.status(400).json({ success: false, error: '搜索关键词不能为空' });
        }
        
        const searchResult = await resumeSearchService.searchSimilarResumes(query, userId, parseInt(limit));
        
        if (searchResult.success) {
            res.json({
                success: true,
                data: searchResult.data
            });
        } else {
            res.status(404).json(searchResult);
        }
    } catch (error) {
        console.error('❌ 简历搜索处理失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function handleJobSearch(req, res) {
    try {
        const { query, limit = 5 } = req.query;
        
        if (!query) {
            return res.status(400).json({ success: false, error: '搜索关键词不能为空' });
        }
        
        const searchResult = await resumeSearchService.searchSimilarJobs(query, parseInt(limit));
        
        if (searchResult.success) {
            res.json({
                success: true,
                data: searchResult.data
            });
        } else {
            res.status(404).json(searchResult);
        }
    } catch (error) {
        console.error('❌ 职位搜索处理失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function handleJobDescriptionAdd(req, res) {
    try {
        const { jobId, description, company, position, location } = req.body;
        
        if (!jobId || !description) {
            return res.status(400).json({ 
                success: false, 
                error: '职位ID和描述不能为空' 
            });
        }
        
        const result = await resumeSearchService.addJobDescription(jobId, description, {
            company,
            position,
            location
        });
        
        if (result.success) {
            res.json({ success: true, message: '职位描述添加成功' });
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('❌ 职位描述添加失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function handleGetUserResumes(req, res) {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: '用户ID不能为空' });
        }
        
        const resumes = databaseService.getResumes(parseInt(userId));
        
        res.json({
            success: true,
            data: resumes
        });
    } catch (error) {
        console.error('❌ 获取用户简历失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function handleGetApiUsage(req, res) {
    try {
        const { limit = 100 } = req.query;
        
        const usage = databaseService.getApiUsage(parseInt(limit));
        
        res.json({
            success: true,
            data: usage
        });
    } catch (error) {
        console.error('❌ 获取API使用记录失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function handleGetDatabaseStats(req, res) {
    try {
        const stats = await resumeSearchService.getDatabaseStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ 获取数据库统计失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    handleResumeUpload,
    handleResumeSearch,
    handleJobSearch,
    handleJobDescriptionAdd,
    handleGetUserResumes,
    handleGetApiUsage,
    handleGetDatabaseStats
};