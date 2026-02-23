const mySQLService = require('../services/mySQLService');
const resumeDatasetService = require('../services/resumeDatasetService');

class ModelEvaluationService {
    constructor() {
        this.metrics = mySQLService.getEvaluationMetrics();
        this.initializeMetrics();
    }

    async initializeMetrics() {
        this.evaluationMetrics = {
            accuracy: {
                name: '准确率',
                description: '正确解析的字段比例',
                calculation: '正确字段数 / 总字段数',
                weight: 0.3
            },
            recall: {
                name: '召回率',
                description: '成功提取的信息比例',
                calculation: '提取信息数 / 实际信息数',
                weight: 0.25
            },
            f1_score: {
                name: 'F1分数',
                description: '准确率和召回率的调和平均',
                calculation: '2 * (准确率 * 召回率) / (准确率 + 召回率)',
                weight: 0.25
            },
            response_time: {
                name: '响应时间',
                description: '模型处理时间（毫秒）',
                calculation: '结束时间 - 开始时间',
                weight: 0.1
            },
            cost_efficiency: {
                name: '成本效益',
                description: '每千token的成本',
                calculation: '总成本 / (token数 / 1000)',
                weight: 0.1
            }
        };
    }

    async evaluateResumeParsing(modelName, testDataset) {
        const evaluation = {
            model_name: modelName,
            evaluation_date: new Date().toISOString(),
            total_samples: testDataset.samples.length,
            results: [],
            metrics: {}
        };

        let totalAccuracy = 0;
        let totalRecall = 0;
        let totalF1 = 0;
        let totalResponseTime = 0;
        let totalCost = 0;

        for (const sample of testDataset.samples) {
            const startTime = Date.now();
            
            const result = await this.runModelInference(sample.input.resume_text, modelName);
            const endTime = Date.now();
            
            const responseTime = endTime - startTime;
            const sampleMetrics = this.calculateSampleMetrics(sample.output, result.output);
            
            evaluation.results.push({
                sample_id: sample.id,
                expected: sample.output,
                actual: result.output,
                metrics: sampleMetrics,
                response_time: responseTime,
                cost: result.cost || 0
            });

            totalAccuracy += sampleMetrics.accuracy;
            totalRecall += sampleMetrics.recall;
            totalF1 += sampleMetrics.f1_score;
            totalResponseTime += responseTime;
            totalCost += result.cost || 0;
        }

        evaluation.metrics = {
            accuracy: {
                value: totalAccuracy / testDataset.samples.length,
                description: '平均准确率'
            },
            recall: {
                value: totalRecall / testDataset.samples.length,
                description: '平均召回率'
            },
            f1_score: {
                value: totalF1 / testDataset.samples.length,
                description: '平均F1分数'
            },
            response_time: {
                value: totalResponseTime / testDataset.samples.length,
                description: '平均响应时间（毫秒）'
            },
            cost_efficiency: {
                value: totalCost / testDataset.samples.length,
                description: '平均每次调用成本'
            }
        };

        evaluation.overall_score = this.calculateOverallScore(evaluation.metrics);
        
        await mySQLService.saveModelEvaluation(modelName, evaluation.metrics, {
            total_samples: evaluation.total_samples,
            overall_score: evaluation.overall_score
        });

        return evaluation;
    }

    calculateSampleMetrics(expected, actual) {
        const fields = ['personal_info', 'education', 'work_experience', 'skills', 'projects', 'certifications'];
        let totalFields = 0;
        let correctFields = 0;
        let totalExpectedItems = 0;
        let totalActualItems = 0;
        let correctItems = 0;

        for (const field of fields) {
            const expectedValue = expected[field];
            const actualValue = actual[field];
            
            if (expectedValue !== undefined && expectedValue !== null) {
                totalFields++;
                
                if (this.deepEqual(expectedValue, actualValue)) {
                    correctFields++;
                }
            }

            if (Array.isArray(expectedValue)) {
                totalExpectedItems += expectedValue.length;
            }
            if (Array.isArray(actualValue)) {
                totalActualItems += actualValue.length;
            }
        }

        const precision = totalActualItems > 0 ? correctItems / totalActualItems : 0;
        const recall = totalExpectedItems > 0 ? correctItems / totalExpectedItems : 0;
        const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

        return {
            accuracy: totalFields > 0 ? correctFields / totalFields : 0,
            precision: precision,
            recall: recall,
            f1_score: f1
        };
    }

    deepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;
        if (obj1 == null || obj2 == null) return false;
        if (typeof obj1 !== typeof obj2) return false;

        if (typeof obj1 !== 'object') return obj1 === obj2;

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        for (const key of keys1) {
            if (!keys2.includes(key)) return false;
            if (!this.deepEqual(obj1[key], obj2[key])) return false;
        }

        return true;
    }

    calculateOverallScore(metrics) {
        let totalScore = 0;
        let totalWeight = 0;

        for (const [metricName, metricData] of Object.entries(this.evaluationMetrics)) {
            const metricValue = metrics[metricName]?.value || 0;
            const weight = metricData.weight;
            
            totalScore += metricValue * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    async runModelInference(resumeText, modelName) {
        try {
            const apiConfigService = require('../services/apiConfigService');
            const messages = [
                {
                    role: 'system',
                    content: '你是一个专业的简历解析专家，请准确提取简历中的结构化信息。只返回简历中实际存在的内容，不要编造任何信息。'
                },
                {
                    role: 'user',
                    content: `请解析以下简历：\n\n${resumeText}`
                }
            ];

            const result = await apiConfigService.callSpecificModel(modelName, messages, { temperature: 0.3 });
            
            if (result.success) {
                const parsedResult = this.parseAIResponse(result.content);
                return {
                    output: parsedResult,
                    cost: result.cost,
                    model: modelName
                };
            } else {
                return {
                    output: {},
                    cost: 0,
                    model: modelName,
                    error: result.error
                };
            }
        } catch (error) {
            return {
                output: {},
                cost: 0,
                model: modelName,
                error: error.message
            };
        }
    }

    parseAIResponse(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            console.error('❌ 解析AI响应失败:', error);
            return {};
        }
    }

    async compareModels(modelNames, testDataset) {
        const comparison = {
            models: [],
            winner: null,
            comparison_date: new Date().toISOString()
        };

        for (const modelName of modelNames) {
            const evaluation = await this.evaluateResumeParsing(modelName, testDataset);
            comparison.models.push({
                name: modelName,
                overall_score: evaluation.overall_score,
                metrics: evaluation.metrics
            });
        }

        comparison.models.sort((a, b) => b.overall_score - a.overall_score);
        comparison.winner = comparison.models[0];

        return comparison;
    }

    async generateEvaluationReport(evaluation) {
        const report = {
            title: `模型评估报告 - ${evaluation.model_name}`,
            date: evaluation.evaluation_date,
            summary: {
                overall_score: evaluation.overall_score,
                total_samples: evaluation.total_samples
            },
            metrics: evaluation.metrics,
            recommendations: this.generateRecommendations(evaluation)
        };

        return report;
    }

    generateRecommendations(evaluation) {
        const recommendations = [];

        if (evaluation.metrics.accuracy?.value < 0.8) {
            recommendations.push({
                metric: '准确率',
                current_value: evaluation.metrics.accuracy.value,
                target_value: 0.8,
                suggestion: '增加训练数据量，改进提示词设计'
            });
        }

        if (evaluation.metrics.response_time?.value > 5000) {
            recommendations.push({
                metric: '响应时间',
                current_value: evaluation.metrics.response_time.value,
                target_value: 5000,
                suggestion: '优化模型推理过程，考虑模型量化'
            });
        }

        if (evaluation.metrics.cost_efficiency?.value > 0.1) {
            recommendations.push({
                metric: '成本效益',
                current_value: evaluation.metrics.cost_efficiency.value,
                target_value: 0.1,
                suggestion: '使用更高效的模型或优化token使用'
            });
        }

        return recommendations;
    }
}

module.exports = new ModelEvaluationService();