const mySQLService = require('../services/mySQLService');
const resumeDatasetService = require('../services/resumeDatasetService');
const modelEvaluationService = require('../services/modelEvaluationService');
const databaseService = require('../services/databaseService');
const vectorDatabaseService = require('../services/vectorDatabaseService');
const apiConfigService = require('../services/apiConfigService');

class DataFlowOrchestrator {
    constructor() {
        this.dataFlowSequence = null;
        this.initializeDataFlow();
    }

    async initializeDataFlow() {
        this.dataFlowSequence = await mySQLService.getDataFlowSequence();
        console.log('🔄 数据流程已初始化:', this.dataFlowSequence);
    }

    async processResumeUpload(resumeText, fileName, userId) {
        try {
            console.log('📤 开始处理简历上传...');
            
            const flowSteps = this.dataFlowSequence.split('→');
            const processResult = {
                success: false,
                step: 0,
                data: {},
                errors: []
            };

            for (let i = 0; i < flowSteps.length; i++) {
                const step = flowSteps[i].trim();
                processResult.step = i + 1;
                
                console.log(`🔄 执行步骤 ${i + 1}: ${step}`);
                
                try {
                    switch (step) {
                        case '简历上传':
                            processResult.data.uploadInfo = {
                                fileName,
                                userId,
                                timestamp: new Date().toISOString()
                            };
                            break;
                            
                        case '解析':
                            const freeModelService = require('../ai-cluster/FreeModelService');
                            const parseResult = await freeModelService.parseResume(resumeText, fileName, userId);
                            processResult.data.parseResult = parseResult;
                            
                            if (!parseResult.success) {
                                processResult.errors.push(`解析失败: ${parseResult.error}`);
                            }
                            break;
                            
                        case '存储':
                            if (!processResult.data.parseResult) {
                                throw new Error('解析结果不存在，无法存储');
                            }
                            
                            const resumeId = databaseService.saveResume(userId, fileName, resumeText, processResult.data.parseResult.data);
                            processResult.data.storageInfo = {
                                resumeId,
                                timestamp: new Date().toISOString()
                            };
                            break;
                            
                        case '向量化':
                            if (!processResult.data.storageInfo?.resumeId) {
                                throw new Error('存储信息不存在，无法向量化');
                            }
                            
                            const vectorSuccess = await vectorDatabaseService.addResumeVector(
                                processResult.data.storageInfo.resumeId,
                                resumeText,
                                {
                                    fileName,
                                    userId,
                                    model: processResult.data.parseResult.model || 'unknown'
                                }
                            );
                            
                            processResult.data.vectorInfo = {
                                success: vectorSuccess,
                                timestamp: new Date().toISOString()
                            };
                            break;
                            
                        case '搜索':
                            processResult.data.searchResults = await this.performSimilaritySearch(resumeText);
                            break;
                            
                        case '匹配':
                            processResult.data.matchResults = await this.performJobMatching(processResult.data.parseResult.data);
                            break;
                            
                        case '评估':
                            if (processResult.data.parseResult) {
                                processResult.data.evaluationResult = await this.evaluateModelPerformance(
                                    processResult.data.parseResult.model
                                );
                            }
                            break;
                            
                        case '反馈':
                            processResult.data.feedbackResult = await this.collectFeedback(
                                processResult.data.storageInfo?.resumeId,
                                userId
                            );
                            break;
                            
                        default:
                            console.log(`⚠️ 未知步骤: ${step}`);
                    }
                } catch (error) {
                    processResult.errors.push(`步骤 ${step} 执行失败: ${error.message}`);
                    console.error(`❌ 步骤 ${step} 执行失败:`, error);
                }
            }

            processResult.success = processResult.errors.length === 0;
            processResult.completedSteps = flowSteps.length;
            
            console.log(`✅ 简历处理完成: ${processResult.success ? '成功' : '失败'}`);
            return processResult;
            
        } catch (error) {
            console.error('❌ 简历处理流程异常:', error);
            return {
                success: false,
                step: 0,
                data: {},
                errors: [error.message]
            };
        }
    }

    async performSimilaritySearch(resumeText) {
        try {
            const results = await vectorDatabaseService.searchSimilarResumes(resumeText, 5);
            return {
                success: true,
                results: results,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async performJobMatching(parsedResume) {
        try {
            const resumeSkills = parsedResume.skills || [];
            const resumeExperience = parsedResume.work_experience || [];
            
            const searchQuery = resumeSkills.join(' ') + ' ' + 
                resumeExperience.map(exp => exp.position || '').join(' ');
            
            const jobResults = await vectorDatabaseService.searchSimilarJobs(searchQuery, 5);
            
            const matches = jobResults.ids.map((jobId, index) => ({
                jobId,
                similarity: 1 - (jobResults.distances[index] || 0),
                jobDescription: jobResults.documents[index],
                metadata: jobResults.metadatas[index]
            }));
            
            return {
                success: true,
                matches: matches.sort((a, b) => b.similarity - a.similarity),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async evaluateModelPerformance(modelName) {
        try {
            const testDataset = await resumeDatasetService.loadDatasetFromFile('test_dataset');
            
            if (!testDataset) {
                return {
                    success: false,
                    error: '测试数据集不存在',
                    timestamp: new Date().toISOString()
                };
            }
            
            const evaluation = await modelEvaluationService.evaluateResumeParsing(modelName, testDataset);
            
            return {
                success: true,
                evaluation: evaluation,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async collectFeedback(resumeId, userId) {
        try {
            const feedback = await databaseService.getFeedback(resumeId, userId);
            
            return {
                success: true,
                feedback: feedback || [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async getFlowStatus() {
        return {
            dataFlowSequence: this.dataFlowSequence,
            activeSteps: this.dataFlowSequence.split('→').map(step => step.trim()),
            lastUpdated: new Date().toISOString()
        };
    }

    async updateFlowSequence(newSequence) {
        try {
            await mySQLService.setConfig('ai_trainer', 'data_flow_sequence', newSequence, '数据流程顺序');
            this.dataFlowSequence = newSequence;
            
            console.log('✅ 数据流程已更新:', newSequence);
            return { success: true, sequence: newSequence };
        } catch (error) {
            console.error('❌ 更新数据流程失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getFlowMetrics() {
        try {
            const stats = await vectorDatabaseService.getCollectionStats();
            const apiUsage = databaseService.getApiUsage(10);
            const configs = await mySQLService.getAITrainerConfig();
            
            return {
                vectorDatabase: stats,
                recentApiUsage: apiUsage,
                systemConfigs: configs,
                flowSequence: this.dataFlowSequence,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ 获取流程指标失败:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new DataFlowOrchestrator();