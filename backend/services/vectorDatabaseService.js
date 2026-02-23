const { ChromaClient } = require('chromadb');
const path = require('path');

class VectorDatabaseService {
    constructor() {
        this.client = null;
        this.collections = {};
        this.init();
    }

    async init() {
        try {
            this.client = new ChromaClient({
                path: path.join(__dirname, '../data/chroma')
            });
            
            await this.createCollections();
            console.log('✅ Chroma 向量数据库初始化成功');
        } catch (error) {
            console.error('❌ Chroma 向量数据库初始化失败:', error);
        }
    }

    async createCollections() {
        const collections = [
            { name: 'resumes', metadata: { description: '简历向量存储' } },
            { name: 'job_descriptions', metadata: { description: '职位描述向量存储' } },
            { name: 'skills', metadata: { description: '技能向量存储' } }
        ];

        for (const collection of collections) {
            try {
                this.collections[collection.name] = await this.client.getOrCreateCollection({
                    name: collection.name,
                    metadata: collection.metadata
                });
            } catch (error) {
                console.error(`❌ 创建集合 ${collection.name} 失败:`, error);
            }
        }
    }

    async addResumeVector(resumeId, content, metadata = {}) {
        try {
            const collection = this.collections.resumes;
            if (!collection) {
                throw new Error('resumes 集合未初始化');
            }

            const id = `resume_${resumeId}`;
            const finalMetadata = {
                ...metadata,
                type: 'resume',
                resumeId: resumeId,
                createdAt: new Date().toISOString()
            };

            await collection.add({
                ids: [id],
                documents: [content],
                metadatas: [finalMetadata]
            });

            console.log(`✅ 简历向量已添加: ${id}`);
            return true;
        } catch (error) {
            console.error('❌ 添加简历向量失败:', error);
            return false;
        }
    }

    async addJobDescriptionVector(jobId, description, metadata = {}) {
        try {
            const collection = this.collections.job_descriptions;
            if (!collection) {
                throw new Error('job_descriptions 集合未初始化');
            }

            const id = `job_${jobId}`;
            const finalMetadata = {
                ...metadata,
                type: 'job_description',
                jobId: jobId,
                createdAt: new Date().toISOString()
            };

            await collection.add({
                ids: [id],
                documents: [description],
                metadatas: [finalMetadata]
            });

            console.log(`✅ 职位描述向量已添加: ${id}`);
            return true;
        } catch (error) {
            console.error('❌ 添加职位描述向量失败:', error);
            return false;
        }
    }

    async searchSimilarResumes(query, limit = 5) {
        try {
            const collection = this.collections.resumes;
            if (!collection) {
                throw new Error('resumes 集合未初始化');
            }

            const results = await collection.query({
                queryTexts: [query],
                nResults: limit
            });

            return {
                ids: results.ids[0] || [],
                documents: results.documents[0] || [],
                metadatas: results.metadatas[0] || [],
                distances: results.distances[0] || []
            };
        } catch (error) {
            console.error('❌ 搜索相似简历失败:', error);
            return { ids: [], documents: [], metadatas: [], distances: [] };
        }
    }

    async searchSimilarJobs(query, limit = 5) {
        try {
            const collection = this.collections.job_descriptions;
            if (!collection) {
                throw new Error('job_descriptions 集合未初始化');
            }

            const results = await collection.query({
                queryTexts: [query],
                nResults: limit
            });

            return {
                ids: results.ids[0] || [],
                documents: results.documents[0] || [],
                metadatas: results.metadatas[0] || [],
                distances: results.distances[0] || []
            };
        } catch (error) {
            console.error('❌ 搜索相似职位失败:', error);
            return { ids: [], documents: [], metadatas: [], distances: [] };
        }
    }

    async deleteResumeVector(resumeId) {
        try {
            const collection = this.collections.resumes;
            if (!collection) {
                throw new Error('resumes 集合未初始化');
            }

            const id = `resume_${resumeId}`;
            await collection.delete({
                ids: [id]
            });

            console.log(`✅ 简历向量已删除: ${id}`);
            return true;
        } catch (error) {
            console.error('❌ 删除简历向量失败:', error);
            return false;
        }
    }

    async deleteJobDescriptionVector(jobId) {
        try {
            const collection = this.collections.job_descriptions;
            if (!collection) {
                throw new Error('job_descriptions 集合未初始化');
            }

            const id = `job_${jobId}`;
            await collection.delete({
                ids: [id]
            });

            console.log(`✅ 职位描述向量已删除: ${id}`);
            return true;
        } catch (error) {
            console.error('❌ 删除职位描述向量失败:', error);
            return false;
        }
    }

    async getCollectionStats() {
        try {
            const stats = {};
            for (const [name, collection] of Object.entries(this.collections)) {
                const count = await collection.count();
                stats[name] = count;
            }
            return stats;
        } catch (error) {
            console.error('❌ 获取集合统计失败:', error);
            return {};
        }
    }

    async resetCollection(collectionName) {
        try {
            const collection = this.collections[collectionName];
            if (!collection) {
                throw new Error(`${collectionName} 集合未初始化`);
            }

            await collection.delete();
            console.log(`✅ 集合 ${collectionName} 已重置`);
            return true;
        } catch (error) {
            console.error(`❌ 重置集合 ${collectionName} 失败:`, error);
            return false;
        }
    }
}

module.exports = new VectorDatabaseService();