const fs = require('fs').promises;
const path = require('path');
const mySQLService = require('../services/mySQLService');

class ResumeDatasetService {
    constructor() {
        this.datasetPath = path.join(__dirname, '../datasets');
        this.ensureDatasetDirectory();
    }

    async ensureDatasetDirectory() {
        try {
            await fs.mkdir(this.datasetPath, { recursive: true });
        } catch (error) {
            console.error('❌ 创建数据集目录失败:', error);
        }
    }

    async createResumeDataset(resumeTexts, parsedResults) {
        const dataset = {
            version: '1.0',
            created_at: new Date().toISOString(),
            total_samples: resumeTexts.length,
            samples: []
        };

        for (let i = 0; i < resumeTexts.length; i++) {
            const resumeText = resumeTexts[i];
            const parsedResult = parsedResults[i];
            
            const sample = {
                id: i + 1,
                input: {
                    resume_text: resumeText,
                    instruction: '请解析以下简历，提取结构化信息'
                },
                output: {
                    personal_info: parsedResult.personal_info || {},
                    education: parsedResult.education || [],
                    work_experience: parsedResult.work_experience || [],
                    skills: parsedResult.skills || [],
                    projects: parsedResult.projects || [],
                    certifications: parsedResult.certifications || []
                },
                metadata: {
                    source: 'manual_annotation',
                    quality_score: this.calculateQualityScore(parsedResult),
                    annotation_date: new Date().toISOString()
                }
            };
            
            dataset.samples.push(sample);
        }

        const datasetName = `resume_dataset_${Date.now()}`;
        const saved = await mySQLService.saveTrainingDataset(datasetName, dataset, {
            type: 'resume_parsing',
            samples_count: resumeTexts.length,
            avg_quality_score: dataset.samples.reduce((sum, s) => sum + s.metadata.quality_score, 0) / dataset.samples.length
        });

        if (saved) {
            await this.saveDatasetToFile(datasetName, dataset);
        }

        return { success: true, datasetId: saved, datasetName };
    }

    calculateQualityScore(parsedResult) {
        let score = 0;
        let maxScore = 0;

        if (parsedResult.personal_info && Object.keys(parsedResult.personal_info).length > 0) {
            score += 1;
        }
        maxScore += 1;

        if (parsedResult.education && parsedResult.education.length > 0) {
            score += 1;
        }
        maxScore += 1;

        if (parsedResult.work_experience && parsedResult.work_experience.length > 0) {
            score += 1;
        }
        maxScore += 1;

        if (parsedResult.skills && parsedResult.skills.length > 0) {
            score += 1;
        }
        maxScore += 1;

        return maxScore > 0 ? (score / maxScore) * 100 : 0;
    }

    async saveDatasetToFile(datasetName, dataset) {
        try {
            const filePath = path.join(this.datasetPath, `${datasetName}.json`);
            await fs.writeFile(filePath, JSON.stringify(dataset, null, 2));
            console.log(`✅ 数据集已保存到文件: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ 保存数据集文件失败:', error);
            return false;
        }
    }

    async loadDatasetFromFile(datasetName) {
        try {
            const filePath = path.join(this.datasetPath, `${datasetName}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ 加载数据集文件失败:', error);
            return null;
        }
    }

    async generateTrainingPrompts(dataset) {
        const prompts = [];
        
        for (const sample of dataset.samples) {
            const prompt = {
                input: `你是一个专业的简历解析专家。请从以下简历文本中提取结构化信息，包括个人信息、教育背景、工作经验、技能、项目经验和证书。只返回简历中实际存在的内容，不要编造任何信息。\n\n简历内容：\n${sample.input.resume_text}`,
                output: JSON.stringify(sample.output, null, 2),
                instruction: sample.input.instruction
            };
            prompts.push(prompt);
        }
        
        return prompts;
    }

    async validateDataset(dataset) {
        const validation = {
            total_samples: dataset.samples.length,
            valid_samples: 0,
            invalid_samples: 0,
            issues: []
        };

        for (let i = 0; i < dataset.samples.length; i++) {
            const sample = dataset.samples[i];
            const sampleIssues = [];

            if (!sample.input.resume_text || sample.input.resume_text.trim().length === 0) {
                sampleIssues.push('简历文本为空');
            }

            if (!sample.output || Object.keys(sample.output).length === 0) {
                sampleIssues.push('解析结果为空');
            }

            if (sampleIssues.length > 0) {
                validation.invalid_samples++;
                validation.issues.push({
                    sample_id: sample.id,
                    issues: sampleIssues
                });
            } else {
                validation.valid_samples++;
            }
        }

        validation.validation_rate = (validation.valid_samples / validation.total_samples) * 100;
        return validation;
    }

    async splitDataset(dataset, trainRatio = 0.8, valRatio = 0.1) {
        const shuffled = [...dataset.samples].sort(() => Math.random() - 0.5);
        const total = shuffled.length;
        
        const trainSize = Math.floor(total * trainRatio);
        const valSize = Math.floor(total * valRatio);
        
        return {
            train: {
                ...dataset,
                samples: shuffled.slice(0, trainSize),
                split_type: 'train'
            },
            validation: {
                ...dataset,
                samples: shuffled.slice(trainSize, trainSize + valSize),
                split_type: 'validation'
            },
            test: {
                ...dataset,
                samples: shuffled.slice(trainSize + valSize),
                split_type: 'test'
            }
        };
    }
}

module.exports = new ResumeDatasetService();