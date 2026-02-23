const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// 设置端口
const PORT = 3002;

// 通话记录数据文件路径
const CALL_RECORDS_FILE = path.join(__dirname, 'call-records.json');

// 初始化通话记录数据文件
function initCallRecordsFile() {
    if (!fs.existsSync(CALL_RECORDS_FILE)) {
        fs.writeFileSync(CALL_RECORDS_FILE, JSON.stringify([], null, 2));
    }
}
initCallRecordsFile();

// 读取通话记录
function readCallRecords() {
    try {
        const data = fs.readFileSync(CALL_RECORDS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取通话记录失败:', error);
        return [];
    }
}

// 保存通话记录
function saveCallRecords(records) {
    try {
        fs.writeFileSync(CALL_RECORDS_FILE, JSON.stringify(records, null, 2));
        return true;
    } catch (error) {
        console.error('保存通话记录失败:', error);
        return false;
    }
}

// 增强的AI优化器
class SimpleAIOptimizer {
  optimizeResume(resumeText, jobDescription, requestType = '') {
    // 简单的关键词提取和匹配
    const jobKeywords = this.extractKeywords(jobDescription);
    const resumeKeywords = this.extractKeywords(resumeText);
    
    const matchedKeywords = jobKeywords.filter(keyword => 
      resumeKeywords.some(resumeKeyword => 
        resumeKeyword.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(resumeKeyword.toLowerCase())
      )
    );
    
    const matchRate = Math.round((matchedKeywords.length / jobKeywords.length) * 100);
    
    // 生成详细的整改措施
    const suggestions = this.generateDetailedSuggestions(resumeText, jobDescription, jobKeywords, matchedKeywords, requestType);
    
    return {
      success: true,
      data: {
        versions: [
          {
            id: 'version_1',
            title: '标准版',
            content: resumeText,
            score: matchRate
          }
        ],
        missingKeywords: jobKeywords.filter(keyword => 
          !matchedKeywords.includes(keyword)
        ).slice(0, 5),
        keywordMatchRate: matchRate,
        analysis: {
          total: jobKeywords.length,
          matched: matchedKeywords.length,
          missing: jobKeywords.length - matchedKeywords.length,
          matchRate: matchRate
        },
        suggestions: suggestions,
       整改措施: suggestions.filter(s => s.type === '整改措施'),
        detailedAnalysis: this.generateDetailedAnalysis(resumeText, jobDescription, jobKeywords, resumeKeywords, matchedKeywords)
      }
    };
  }
  
  extractKeywords(text) {
    const keywords = [];
    
    // 技术关键词
    const techKeywords = [
      'JavaScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'Go',
      'HTML', 'CSS', 'TypeScript', 'jQuery', 'Bootstrap', 'SASS', 'LESS',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'Linux', 'Nginx', 'Webpack'
    ];
    
    // 软技能关键词
    const softSkills = [
      '沟通能力', '团队协作', '项目管理', '领导力', '解决问题', '学习能力',
      '责任心', '抗压能力', '创新思维', '分析能力', '执行力', '协调能力'
    ];
    
    // 行业关键词
    const industryKeywords = [
      '前端开发', '后端开发', '全栈开发', '移动开发', '数据分析', '机器学习',
      '人工智能', '云计算', '大数据', '微服务', '分布式', '高并发'
    ];
    
    const allKeywords = [...techKeywords, ...softSkills, ...industryKeywords];
    const textLower = text.toLowerCase();
    
    allKeywords.forEach(keyword => {
      if (textLower.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    });
    
    return [...new Set(keywords)];
  }
  
  // 生成详细的整改措施
  generateDetailedSuggestions(resumeText, jobDescription, jobKeywords, matchedKeywords, requestType) {
    const suggestions = [];
    
    // 关键词建议
    const missingKeywords = jobKeywords.filter(keyword => 
      !matchedKeywords.includes(keyword)
    );
    
    if (missingKeywords.length > 0) {
      suggestions.push({
        type: 'keyword',
        priority: 'high',
        content: `建议添加以下关键词：${missingKeywords.slice(0, 3).join('、')}`,
        reason: '提高与职位JD的匹配度',
        具体信息: `职位描述中包含但简历中缺失的关键词：${missingKeywords.slice(0, 5).join('、')}`,
        优化内容: `在简历的技能部分或工作经验描述中添加这些关键词，确保自然融入，不要生硬堆砌。`,
        整改思路: `1. 分析职位描述中的核心关键词\n2. 识别简历中缺失的关键词\n3. 在相关部分自然融入这些关键词\n4. 确保关键词与实际技能和经验相符`
      });
    }
    
    // 结构建议
    suggestions.push({
      type: 'structure',
      priority: 'medium',
      content: '建议使用STAR法则描述工作经历',
      reason: '让经历描述更具体有说服力',
      具体信息: '当前工作经历描述可能过于简单，缺乏具体的情境、任务、行动和结果',
      优化内容: `使用STAR法则结构：\n- Situation（情境）：描述工作背景\n- Task（任务）：说明你的职责\n- Action（行动）：详述你采取的具体措施\n- Result（结果）：量化你的工作成果`,
      整改思路: `1. 选择3-5个最具代表性的工作成就\n2. 为每个成就应用STAR法则结构\n3. 确保包含具体的数据和结果\n4. 突出你的核心能力和贡献`
    });
    
    // 如果请求详细整改措施，添加更多具体建议
    if (requestType.includes('整改措施') || requestType.includes('detailed')) {
      // 基于简历内容的具体整改措施
      const resumeSections = this.extractResumeSections(resumeText);
      
      // 基本信息整改措施
      if (!resumeSections.basicInfo) {
        suggestions.push({
          type: '整改措施',
          priority: 'high',
          content: '添加完整的基本信息，包括姓名、电话、邮箱、LinkedIn等联系方式',
          reason: '让招聘方能够方便地联系你',
          具体信息: '简历中缺少基本联系信息',
          优化内容: `在简历顶部添加以下信息：\n- 姓名：[你的姓名]\n- 电话：[你的电话]\n- 邮箱：[你的邮箱]\n- 所在城市：[你的城市]\n- LinkedIn：[你的LinkedIn链接]（如果有）\n- GitHub：[你的GitHub链接]（如果有，针对技术岗位）`,
          整改思路: `1. 确保所有联系信息准确无误\n2. 选择专业的邮箱地址\n3. 只包含必要的联系信息\n4. 将联系信息放在简历顶部显眼位置`
        });
      }
      
      // 教育背景整改措施
      if (!resumeSections.education) {
        suggestions.push({
          type: '整改措施',
          priority: 'medium',
          content: '详细描述教育背景，包括学校名称、专业、学位、毕业时间、GPA（如果较高）',
          reason: '教育背景是招聘方评估候选人的重要依据',
          具体信息: '简历中缺少教育背景信息',
          优化内容: `添加教育背景部分：\n- 学校名称：[学校全称]\n- 专业：[专业名称]\n- 学位：[学位类型]\n- 毕业时间：[毕业年月]\n- GPA：[GPA值]（如果≥3.0或同等水平）\n- 相关课程：[列出2-3门与职位相关的核心课程]（可选）`,
          整改思路: `1. 按时间倒序排列教育经历\n2. 只包含高中以上的教育经历（除非高中特别知名）\n3. 突出与职位相关的学术成就\n4. 对于有工作经验的候选人，教育背景部分可适当简化`
        });
      }
      
      // 工作经验整改措施
      if (!resumeSections.workExperience) {
        suggestions.push({
          type: '整改措施',
          priority: 'high',
          content: '详细描述工作经验，包括公司名称、职位、工作时间、具体职责和成就',
          reason: '工作经验是招聘方最看重的部分，需要详细具体',
          具体信息: '简历中缺少工作经验信息',
          优化内容: `添加工作经验部分：\n- 公司名称：[公司全称]\n- 职位：[职位名称]\n- 工作时间：[开始日期] - [结束日期]\n- 公司简介：[简要描述公司规模和业务，1-2句]（可选）\n- 主要职责：[列出3-5条核心职责]\n- 工作成就：[使用STAR法则描述2-3个具体成就，包含量化结果]`,
          整改思路: `1. 按时间倒序排列工作经历\n2. 突出与目标职位相关的经验\n3. 使用action verbs开始每个职责描述\n4. 量化工作成果，使用具体数据\n5. 避免使用过于笼统的描述`
        });
      } else {
        suggestions.push({
          type: '整改措施',
          priority: 'medium',
          content: '使用量化数据描述工作成就，例如："提高系统性能30%"、"管理10人团队"',
          reason: '量化数据能够更直观地展示你的能力和成就',
          具体信息: '工作经验描述中缺乏量化的数据和具体的成果',
          优化内容: `将笼统的描述改为量化的成果：\n- 错误示例："负责网站优化"\n- 正确示例："优化网站加载速度，页面加载时间从3.5秒减少到1.2秒，提升用户体验满意度25%"\n\n- 错误示例："参与项目管理"\n- 正确示例："主导3个跨部门项目，管理10人团队，按时交付率100%，项目预算控制在计划内"`,
          整改思路: `1. 回顾每个工作岗位的主要成就\n2. 识别可量化的指标（时间、成本、效率、数量等）\n3. 计算具体的改进百分比或数值\n4. 使用STAR法则结构化描述成就\n5. 确保数据真实可信`
        });
      }
      
      // 技能整改措施
      if (!resumeSections.skills) {
        suggestions.push({
          type: '整改措施',
          priority: 'medium',
          content: '列出相关技能，包括技术技能、软技能和工具熟练度',
          reason: '技能列表能够快速展示你的能力范围',
          具体信息: '简历中缺少技能部分',
          优化内容: `添加技能部分，按类别组织：\n- 技术技能：[列出与职位相关的技术，如编程语言、框架、数据库等]\n- 软技能：[列出你的核心软技能，如沟通能力、团队协作、领导力等]\n- 工具熟练度：[列出你熟悉的工具和软件，如Office、设计工具、开发工具等]\n- 语言能力：[列出你的语言能力和熟练度]（如果有）`,
          整改思路: `1. 分析职位描述中的技能要求\n2. 列出你的所有相关技能\n3. 按类别组织技能列表\n4. 为每个技能标注熟练度（如：精通、熟练、了解）\n5. 只包含与职位相关的技能，避免列出过多无关技能`
        });
      } else {
        suggestions.push({
          type: '整改措施',
          priority: 'low',
          content: '对技能进行分类并标注熟练度，例如："JavaScript: 精通"、"Python: 熟练"',
          reason: '技能分类和熟练度标注能够更清晰地展示你的能力水平',
          具体信息: '技能列表缺乏分类和熟练度标注',
          优化内容: `对技能进行分类并标注熟练度：\n- 技术技能：\n  * JavaScript: 精通\n  * React: 熟练\n  * Python: 了解\n- 软技能：\n  * 沟通能力：优秀\n  * 团队协作：优秀\n  * 项目管理：熟练`,
          整改思路: `1. 将技能分为技术技能、软技能等类别\n2. 为每个技能标注适当的熟练度\n3. 按熟练度或相关性排序技能\n4. 确保熟练度与实际能力相符\n5. 突出与目标职位最相关的技能`
        });
      }
      
      // 项目经验整改措施
      if (!resumeSections.projects) {
        suggestions.push({
          type: '整改措施',
          priority: 'medium',
          content: '添加项目经验，包括项目名称、角色、职责、使用的技术栈和项目成果',
          reason: '项目经验能够展示你的实际工作能力和技术应用',
          具体信息: '简历中缺少项目经验部分',
          优化内容: `添加项目经验部分：\n- 项目名称：[项目名称]\n- 项目时间：[开始日期] - [结束日期]\n- 角色：[你的角色]\n- 项目描述：[项目简要描述，1-2句]\n- 技术栈：[使用的技术和工具]\n- 主要职责：[列出2-3条核心职责]\n- 项目成果：[描述项目的成功指标和你的贡献]`,
          整改思路: `1. 选择2-4个最具代表性的项目\n2. 优先选择与目标职位相关的项目\n3. 使用STAR法则描述项目成就\n4. 突出你的技术能力和解决问题的能力\n5. 包含具体的项目成果和影响`
        });
      }
      
      // 简历格式整改措施
      suggestions.push({
        type: '整改措施',
        priority: 'low',
        content: '保持简历格式一致，使用简洁清晰的布局，控制在1-2页',
        reason: '良好的简历格式能够提高可读性，给招聘方留下专业的印象',
        具体信息: '简历格式可能不一致，布局不够清晰',
        优化内容: `优化简历格式：\n- 使用统一的字体和字号（建议：正文10-12pt，标题14-16pt）\n- 保持一致的行距和间距\n- 使用清晰的标题和分节\n- 采用简洁的bullet points格式\n- 控制简历长度在1-2页\n- 使用白色背景和黑色文字，避免使用过多颜色和图形\n- 确保简历在不同设备上显示一致`,
        整改思路: `1. 选择一个专业的简历模板\n2. 统一字体、字号和格式\n3. 合理组织内容结构\n4. 突出重要信息\n5. 检查拼写和语法错误\n6. 确保简历长度适当\n7. 保存为PDF格式，确保格式一致性`
      });
      
      // 针对职位JD的具体整改措施
      if (jobDescription.includes('团队协作')) {
        suggestions.push({
          type: '整改措施',
          priority: 'medium',
          content: '在工作经验或项目经验中添加团队协作的具体例子',
          reason: '职位JD强调团队协作能力，需要展示相关经验',
          具体信息: '简历中缺乏团队协作的具体例子',
          优化内容: `添加团队协作的具体例子：\n- "作为5人开发团队的核心成员，协作完成了公司官网的重构项目，按时交付并超出客户期望"\n- "主导跨部门合作项目，协调产品、设计和开发团队，成功推出新功能，用户满意度提升20%"\n- "在团队面临挑战时，主动组织头脑风暴会议，收集并整合团队意见，找到创新解决方案"`,
          整改思路: `1. 回忆你参与的团队项目和合作经历\n2. 识别你在团队中的具体角色和贡献\n3. 描述你如何与团队成员沟通和协作\n4. 突出团队合作带来的积极成果\n5. 使用具体的例子和数据支持你的描述`
        });
      }
      
      if (jobDescription.includes('领导力')) {
        suggestions.push({
          type: '整改措施',
          priority: 'medium',
          content: '添加领导项目或团队的具体例子，包括领导的人数和取得的成果',
          reason: '职位JD强调领导力，需要展示相关经验',
          具体信息: '简历中缺乏领导力的具体例子',
          优化内容: `添加领导力的具体例子：\n- "领导8人开发团队，制定项目计划和技术路线，成功交付3个关键项目，按时完成率100%"\n- "担任团队组长，负责新成员培训和绩效评估，团队整体 productivity 提升30%"\n- "主导流程优化项目，识别并解决团队工作中的瓶颈，工作效率提升25%"`,
          整改思路: `1. 识别你曾经担任过的领导角色\n2. 描述你如何设定目标和激励团队\n3. 详述你如何解决团队冲突和挑战\n4. 量化领导成果，使用具体数据\n5. 突出你的决策能力和战略思维`
        });
      }
      
      if (jobDescription.includes('解决问题')) {
        suggestions.push({
          type: '整改措施',
          priority: 'medium',
          content: '添加解决复杂问题的具体例子，包括问题描述、解决方案和结果',
          reason: '职位JD强调解决问题能力，需要展示相关经验',
          具体信息: '简历中缺乏解决问题的具体例子',
          优化内容: `添加解决问题的具体例子：\n- "识别并解决系统性能瓶颈，通过优化数据库查询和缓存策略，系统响应时间减少60%"\n- "解决团队沟通障碍，建立每周站会和项目管理工具，提高团队协作效率40%"\n- "应对突发技术故障，带领团队在4小时内恢复服务，减少业务损失"`,
          整改思路: `1. 选择2-3个你成功解决的复杂问题\n2. 描述问题的背景和挑战\n3. 详述你采取的具体解决方案\n4. 量化问题解决带来的积极结果\n5. 突出你的分析能力和创新思维`
        });
      }
      
      // 技术技能整改措施
      const techSkillsInJD = jobKeywords.filter(keyword => 
        ['JavaScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'Go',
         'HTML', 'CSS', 'TypeScript', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes']
          .includes(keyword)
      );
      
      if (techSkillsInJD.length > 0) {
        suggestions.push({
          type: '整改措施',
          priority: 'high',
          content: `重点突出与职位相关的技术技能：${techSkillsInJD.slice(0, 5).join('、')}`,
          reason: '技术技能是招聘方评估候选人是否符合职位要求的重要依据',
          具体信息: `职位描述中强调以下技术技能：${techSkillsInJD.slice(0, 5).join('、')}`,
          优化内容: `在简历中重点突出这些技术技能：\n1. 在技能部分将这些技能放在显眼位置\n2. 在工作经验或项目经验中展示这些技能的实际应用\n3. 描述你如何使用这些技能解决具体问题\n4. 如有相关认证或培训，也一并提及`,
          整改思路: `1. 识别职位描述中的核心技术技能\n2. 评估你在这些技能上的实际水平\n3. 在简历中突出展示相关技能\n4. 提供具体例子证明你的技能应用\n5. 确保技能描述与实际能力相符`
        });
      }
    }
    
    return suggestions;
  }
  
  // 提取简历 sections
  extractResumeSections(resumeText) {
    const sections = {
      basicInfo: false,
      education: false,
      workExperience: false,
      skills: false,
      projects: false
    };
    
    const textLower = resumeText.toLowerCase();
    
    if (textLower.includes('姓名') || textLower.includes('电话') || textLower.includes('邮箱')) {
      sections.basicInfo = true;
    }
    
    if (textLower.includes('教育') || textLower.includes('学校') || textLower.includes('学历')) {
      sections.education = true;
    }
    
    if (textLower.includes('工作') || textLower.includes('实习') || textLower.includes('经验')) {
      sections.workExperience = true;
    }
    
    if (textLower.includes('技能') || textLower.includes('技术') || textLower.includes('能力')) {
      sections.skills = true;
    }
    
    if (textLower.includes('项目') || textLower.includes('project')) {
      sections.projects = true;
    }
    
    return sections;
  }
  
  // 生成详细分析
  generateDetailedAnalysis(resumeText, jobDescription, jobKeywords, resumeKeywords, matchedKeywords) {
    const missingKeywords = jobKeywords.filter(keyword => 
      !matchedKeywords.includes(keyword)
    );
    
    return {
      resumeLength: resumeText.length,
      jobDescriptionLength: jobDescription.length,
      resumeKeywordsCount: resumeKeywords.length,
      jobKeywordsCount: jobKeywords.length,
      matchedKeywordsCount: matchedKeywords.length,
      missingKeywordsCount: missingKeywords.length,
      matchRate: Math.round((matchedKeywords.length / jobKeywords.length) * 100),
      strengthAreas: this.identifyStrengthAreas(resumeKeywords, jobKeywords),
      improvementAreas: this.identifyImprovementAreas(missingKeywords),
      recommendedSkills: missingKeywords.slice(0, 5)
    };
  }
  
  // 识别优势领域
  identifyStrengthAreas(resumeKeywords, jobKeywords) {
    const strengthAreas = [];
    
    // 技术技能匹配
    const techKeywords = ['JavaScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'Go',
                         'HTML', 'CSS', 'TypeScript', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes'];
    
    const matchedTechSkills = resumeKeywords.filter(skill => 
      techKeywords.includes(skill) && jobKeywords.includes(skill)
    );
    
    if (matchedTechSkills.length > 0) {
      strengthAreas.push(`技术技能匹配度高: ${matchedTechSkills.slice(0, 3).join('、')}`);
    }
    
    // 软技能匹配
    const softSkills = ['沟通能力', '团队协作', '项目管理', '领导力', '解决问题', '学习能力',
                        '责任心', '抗压能力', '创新思维', '分析能力', '执行力', '协调能力'];
    
    const matchedSoftSkills = resumeKeywords.filter(skill => 
      softSkills.includes(skill) && jobKeywords.includes(skill)
    );
    
    if (matchedSoftSkills.length > 0) {
      strengthAreas.push(`软技能匹配度高: ${matchedSoftSkills.slice(0, 3).join('、')}`);
    }
    
    return strengthAreas.length > 0 ? strengthAreas : ['简历整体结构良好'];
  }
  
  // 识别改进领域
  identifyImprovementAreas(missingKeywords) {
    const improvementAreas = [];
    
    if (missingKeywords.length > 0) {
      improvementAreas.push(`缺少关键技能: ${missingKeywords.slice(0, 3).join('、')}`);
    }
    
    return improvementAreas.length > 0 ? improvementAreas : ['简历整体质量良好'];
  }
}

// 处理简历优化
async function handleResumeOptimization(res, body) {
  try {
    console.log('📩 收到简历优化请求:', body.substring(0, 100) + '...');
    
    // 验证请求体
    if (!body) {
      console.error('❌ 请求体为空');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '请求体为空',
        details: '请提供简历文本和职位JD'
      }));
      return;
    }
    
    // 验证JSON格式
    let data;
    try {
      data = JSON.parse(body);
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'JSON格式错误',
        details: error.message,
        example: '{"resumeText": "你的简历", "jobDescription": "职位JD", "requestType": "detailed整改措施"}'
      }));
      return;
    }
    
    // 验证必填参数
    const { resumeText, jobDescription, requestType } = data;
    
    if (!resumeText) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '缺少简历文本',
        details: '请提供resumeText参数'
      }));
      return;
    }
    
    if (!jobDescription) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '缺少职位JD',
        details: '请提供jobDescription参数'
      }));
      return;
    }
    
    // 验证内容长度
    if (resumeText.trim().length < 10) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '简历内容过短',
        details: '请提供至少10个字符的简历内容'
      }));
      return;
    }
    
    console.log('🤖 开始AI简历优化...');
    console.log('📋 请求类型:', requestType || '默认');
    
    const optimizer = new SimpleAIOptimizer();
    const result = optimizer.optimizeResume(resumeText, jobDescription, requestType);
    
    console.log(`✅ AI优化完成，匹配率: ${result.data.keywordMatchRate}%`);
    console.log(`📋 生成了 ${result.data.suggestions.length} 条建议，其中 ${result.data['整改措施'] ? result.data['整改措施'].length : 0} 条整改措施`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: result.data,
      message: 'AI简历优化完成，已生成详细整改措施'
    }));
    
  } catch (error) {
    console.error(`❌ AI优化失败: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

// 处理API状态检查
function handleStatusCheck(res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'API服务运行正常',
    serverTime: new Date().toISOString(),
    version: '1.0.0'
  }));
}

// 简历库模拟数据
let resumeDatabase = [];

// 添加模拟简历数据
function addMockResumes() {
  const mockResumes = [
    {
      id: 'resume_1',
      fileName: '张三简历.pdf',
      fileSize: 2048000,
      fileType: 'application/pdf',
      parsedData: {
        name: '张三',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        education: [{ institution: '北京大学', degree: '本科', major: '计算机科学与技术' }],
        workExperience: [{ company: '阿里巴巴', position: '前端开发工程师', duration: '2020-2023' }],
        skills: ['JavaScript', 'React', 'Vue.js', 'Node.js']
      },
      parseQuality: { score: 95 },
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_2',
      fileName: '李四简历.docx',
      fileSize: 1536000,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      parsedData: {
        name: '李四',
        phone: '13900139002',
        email: 'lisi@example.com',
        education: [{ institution: '清华大学', degree: '硕士', major: '软件工程' }],
        workExperience: [{ company: '腾讯', position: '后端开发工程师', duration: '2019-2023' }],
        skills: ['Java', 'Spring Boot', 'MySQL', 'Redis']
      },
      parseQuality: { score: 92 },
      uploadedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_3',
      fileName: '王五简历.pdf',
      fileSize: 1843200,
      fileType: 'application/pdf',
      parsedData: {
        name: '王五',
        phone: '13700137003',
        email: 'wangwu@example.com',
        education: [{ institution: '复旦大学', degree: '本科', major: '产品设计' }],
        workExperience: [{ company: '字节跳动', position: '产品经理', duration: '2021-2023' }],
        skills: ['产品设计', '用户研究', '数据分析', '项目管理']
      },
      parseQuality: { score: 88 },
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_4',
      fileName: '赵六简历.docx',
      fileSize: 1638400,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      parsedData: {
        name: '赵六',
        phone: '13600136004',
        email: 'zhaoliu@example.com',
        education: [{ institution: '浙江大学', degree: '本科', major: 'UI设计' }],
        workExperience: [{ company: '百度', position: 'UI设计师', duration: '2020-2023' }],
        skills: ['UI设计', 'Figma', 'Photoshop', 'Illustrator']
      },
      parseQuality: { score: 85 },
      uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_5',
      fileName: '孙七简历.pdf',
      fileSize: 1966080,
      fileType: 'application/pdf',
      parsedData: {
        name: '孙七',
        phone: '13500135005',
        email: 'sunqi@example.com',
        education: [{ institution: '华中科技大学', degree: '硕士', major: '数据科学' }],
        workExperience: [{ company: '美团', position: '数据分析师', duration: '2021-2023' }],
        skills: ['Python', 'SQL', '数据分析', '机器学习']
      },
      parseQuality: { score: 90 },
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_6',
      fileName: '周八简历.docx',
      fileSize: 1740800,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      parsedData: {
        name: '周八',
        phone: '13400134006',
        email: 'zhouba@example.com',
        education: [{ institution: '西安交通大学', degree: '本科', major: '市场营销' }],
        workExperience: [{ company: '京东', position: '运营专员', duration: '2020-2023' }],
        skills: ['市场营销', '用户运营', '活动策划', '数据分析']
      },
      parseQuality: { score: 82 },
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_7',
      fileName: '吴九简历.pdf',
      fileSize: 2129920,
      fileType: 'application/pdf',
      parsedData: {
        name: '吴九',
        phone: '13300133007',
        email: 'wujiu@example.com',
        education: [{ institution: '哈尔滨工业大学', degree: '硕士', major: '计算机科学与技术' }],
        workExperience: [{ company: '小米', position: '后端开发工程师', duration: '2019-2023' }],
        skills: ['Java', 'Spring Cloud', 'MySQL', 'Redis', 'Docker']
      },
      parseQuality: { score: 93 },
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_8',
      fileName: '郑十简历.docx',
      fileSize: 1433600,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      parsedData: {
        name: '郑十',
        phone: '13200132008',
        email: 'zhengshi@example.com',
        education: [{ institution: '上海交通大学', degree: '本科', major: '通信工程' }],
        workExperience: [{ company: '华为', position: '通信工程师', duration: '2020-2023' }],
        skills: ['通信工程', '网络协议', '嵌入式开发', 'C++']
      },
      parseQuality: { score: 87 },
      uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_9',
      fileName: '王一一简历.pdf',
      fileSize: 2228224,
      fileType: 'application/pdf',
      parsedData: {
        name: '王一一',
        phone: '13100131009',
        email: 'wangyiyi@example.com',
        education: [{ institution: '南京大学', degree: '硕士', major: '人工智能' }],
        workExperience: [{ company: '旷视科技', position: '算法工程师', duration: '2021-2023' }],
        skills: ['Python', 'TensorFlow', 'PyTorch', '机器学习', '深度学习']
      },
      parseQuality: { score: 96 },
      uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'resume_10',
      fileName: '陈二二简历.docx',
      fileSize: 1310720,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      parsedData: {
        name: '陈二二',
        phone: '13000130010',
        email: 'chenerer@example.com',
        education: [{ institution: '中国科学技术大学', degree: '本科', major: '电子工程' }],
        workExperience: [{ company: '大疆创新', position: '硬件工程师', duration: '2020-2023' }],
        skills: ['电子工程', '硬件设计', '电路分析', '嵌入式系统']
      },
      parseQuality: { score: 89 },
      uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  resumeDatabase = mockResumes;
  console.log(`📊 添加了 ${mockResumes.length} 份模拟简历数据`);
}

// 初始化模拟数据
addMockResumes();

// 处理简历上传
async function handleResumeUpload(res, body) {
  try {
    console.log('📩 收到简历上传请求:', body.substring(0, 100) + '...');
    
    // 验证请求体
    if (!body) {
      console.error('❌ 请求体为空');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '请求体为空',
        details: '请提供文件信息和内容'
      }));
      return;
    }
    
    // 验证JSON格式
    let data;
    try {
      data = JSON.parse(body);
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'JSON格式错误',
        details: error.message
      }));
      return;
    }
    
    // 验证必填参数
    const { fileName, fileSize, fileType, fileContent } = data;
    
    if (!fileName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '缺少文件名',
        details: '请提供fileName参数'
      }));
      return;
    }
    
    if (!fileContent) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '缺少文件内容',
        details: '请提供fileContent参数'
      }));
      return;
    }
    
    console.log('📁 处理文件上传:', fileName, fileType, fileSize);
    
    // 简单的文件解析逻辑 - 根据文件类型处理
    let parsedData;
    
    if (fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      // PDF文件处理 - 使用模拟数据
      parsedData = {
        name: extractNameFromFileName(fileName),
        phone: '13800138000',
        email: 'user@example.com',
        education: [{ institution: '北京大学', degree: '本科', major: '计算机科学与技术' }],
        workExperience: [{ company: '阿里巴巴', position: '软件工程师', duration: '2020-2023' }],
        skills: ['JavaScript', 'Python', 'Java', 'C++']
      };
    } else if (fileType.includes('word') || fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')) {
      // Word文件处理 - 使用模拟数据
      parsedData = {
        name: extractNameFromFileName(fileName),
        phone: '13900139000',
        email: 'user@example.com',
        education: [{ institution: '清华大学', degree: '硕士', major: '软件工程' }],
        workExperience: [{ company: '腾讯', position: '前端开发工程师', duration: '2019-2023' }],
        skills: ['JavaScript', 'React', 'Vue.js', 'Node.js']
      };
    } else {
      // 其他文件类型 - 使用模拟数据
      parsedData = {
        name: extractNameFromFileName(fileName),
        phone: '13700137000',
        email: 'user@example.com',
        education: [{ institution: '复旦大学', degree: '本科', major: '计算机科学' }],
        workExperience: [{ company: '百度', position: '后端开发工程师', duration: '2021-2023' }],
        skills: ['Java', 'Spring Boot', 'MySQL', 'Redis']
      };
    }
    
    // 计算解析质量
    const parseQuality = {
      score: calculateParseQuality(parsedData),
      details: {
        name: !!parsedData.name,
        contact: !!(parsedData.phone || parsedData.email),
        education: parsedData.education.length > 0,
        workExperience: parsedData.workExperience.length > 0,
        skills: parsedData.skills.length > 0
      }
    };
    
    // 保存到数据库（模拟）
    const resumeId = 'resume_' + Date.now();
    const resumeData = {
      id: resumeId,
      fileName: fileName,
      fileSize: fileSize,
      fileType: fileType,
      parsedData: parsedData,
      parseQuality: parseQuality,
      uploadedAt: new Date().toISOString()
    };
    
    // 添加到简历库
    resumeDatabase.push(resumeData);
    
    console.log(`✅ 文件解析完成，质量评分: ${parseQuality.score}%`);
    console.log(`📊 简历库当前数量: ${resumeDatabase.length}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        id: resumeId,
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        parsedData: parsedData,
        parseQuality: parseQuality,
        fileInfo: {
          fileName: fileName,
          fileSize: fileSize,
          fileType: fileType
        }
      },
      message: '简历上传和解析成功'
    }));
    
  } catch (error) {
    console.error(`❌ 文件上传失败: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

// 处理简历状态检查
function handleResumeCheck(res) {
  try {
    console.log('🔍 检查简历状态');
    
    const hasResumes = resumeDatabase.length > 0;
    const hasUploaded = resumeDatabase.length > 0;
    
    console.log(`📊 简历库状态: ${hasResumes ? '有简历' : '无简历'} (${resumeDatabase.length}份)`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        hasResumes: hasResumes,
        hasUploaded: hasUploaded,
        resumeCount: resumeDatabase.length,
        lastUploaded: resumeDatabase.length > 0 ? resumeDatabase[resumeDatabase.length - 1].uploadedAt : null
      },
      message: '简历状态检查完成'
    }));
    
  } catch (error) {
    console.error(`❌ 简历检查失败: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

// 处理简历文本解析
async function handleParseResumeText(res, body) {
  try {
    console.log('📝 解析简历文本');
    
    const { text } = JSON.parse(body);
    
    if (!text || typeof text !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '请提供有效的简历文本'
      }));
      return;
    }
    
    // 使用简历解析器
    const ResumeParser = require('./utils/resumeParser');
    const resumeParser = new ResumeParser();
    
    const parseResult = resumeParser.parse(text);
    const validation = resumeParser.validateResult(parseResult);
    
    console.log(`✅ 简历文本解析完成，准确率: ${validation.accuracy}%`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        parsedData: parseResult,
        accuracy: validation.accuracy,
        validation: validation
      },
      message: '简历文本解析成功'
    }));
    
  } catch (error) {
    console.error('❌ 简历文本解析失败:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '简历文本解析失败'
    }));
  }
}

// 处理简历列表获取
function handleResumeList(res) {
  try {
    console.log('📋 获取简历列表');
    
    console.log(`📊 简历库当前数量: ${resumeDatabase.length}`);
    
    // 转换简历数据格式，适配前端需求
    const formattedResumes = resumeDatabase.map(resume => ({
      id: resume.id,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      fileType: resume.fileType,
      uploadDate: resume.uploadedAt,
      parseQuality: resume.parseQuality.score,
      parsedData: resume.parsedData
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: formattedResumes,
      message: '获取简历列表成功'
    }));
    
  } catch (error) {
    console.error(`❌ 获取简历列表失败: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

// 辅助函数：从文件名提取姓名
function extractNameFromFileName(fileName) {
  // 简单的文件名处理
  const nameMatch = fileName.match(/^([^.]+)\.(pdf|doc|docx)$/i);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  return '待确认';
}

// 辅助函数：计算解析质量
function calculateParseQuality(parsedData) {
  let score = 0;
  
  if (parsedData.name && parsedData.name !== '待确认') score += 20;
  if (parsedData.phone && parsedData.phone !== '未识别') score += 15;
  if (parsedData.email && parsedData.email !== '未识别') score += 15;
  if (parsedData.education.length > 0) score += 20;
  if (parsedData.workExperience.length > 0) score += 20;
  if (parsedData.skills.length > 0) score += 10;
  
  return Math.min(100, score);
}

// 处理静态文件
function handleStaticFile(res, filePath) {
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };
  
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT') {
        fs.readFile(path.join(__dirname, '../frontend', '404.html'), (error, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
        res.end(); 
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// 创建服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const urlParsed = url.parse(req.url, true);
  const pathname = urlParsed.pathname;
  const method = req.method;
  
  console.log(`[${new Date().toLocaleTimeString()}] ${method} ${pathname}`);
  
  // 处理API端点
  if (pathname === '/api/status') {
    handleStatusCheck(res);
    return;
  }
  
  if (method === 'POST' && (pathname === '/api/resume/optimize' || pathname === '/api/optimize/resume')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      await handleResumeOptimization(res, body);
    });
    return;
  }
  
  if (method === 'POST' && (pathname === '/api/resume/upload' || pathname === '/api/upload/resume')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      await handleResumeUpload(res, body);
    });
    return;
  }
  
  if (method === 'GET' && (pathname === '/api/resume/check' || pathname === '/api/check/resume')) {
    handleResumeCheck(res);
    return;
  }
  
  if (method === 'POST' && pathname === '/api/resume/parse-text') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      handleParseResumeText(res, body);
    });
    return;
  }
  
  if (method === 'GET' && (pathname === '/api/resume/list' || pathname === '/api/list/resume')) {
    handleResumeList(res);
    return;
  }
  
  // 通话记录API
  if (method === 'GET' && pathname === '/api/call-records') {
    handleGetCallRecords(res);
    return;
  }
  
  if (method === 'POST' && pathname === '/api/call-records') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      handleSaveCallRecord(res, body);
    });
    return;
  }
  
  if (method === 'DELETE' && pathname.startsWith('/api/call-records/')) {
    const recordId = pathname.replace('/api/call-records/', '');
    handleDeleteCallRecord(res, recordId);
    return;
  }
  
  // 聊天API路由
  const chatService = require('./services/chatService');
  
  if (method === 'GET' && pathname === '/api/v1/chat/messages') {
    const userId = urlParsed.query.userId;
    const since = urlParsed.query.since;
    const messages = chatService.getMessages(userId ? parseInt(userId) : null, { since });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { messages } }));
    return;
  }
  
  if (method === 'GET' && pathname === '/api/v1/chat/unread') {
    const userId = urlParsed.query.userId;
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'userId is required' }));
      return;
    }
    const count = chatService.getUnreadCount(parseInt(userId));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { count } }));
    return;
  }
  
  if (method === 'GET' && pathname === '/api/v1/chat/users') {
    const users = chatService.getUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { users } }));
    return;
  }
  
  if (method === 'GET' && pathname === '/api/v1/chat/online-users') {
    const users = chatService.getOnlineUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { users } }));
    return;
  }
  
  if (method === 'POST' && pathname === '/api/v1/chat/send') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { fromUserId, toUserId, content, mention } = JSON.parse(body);
        if (!fromUserId || !content) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'fromUserId and content are required' }));
          return;
        }
        const message = chatService.sendMessage(fromUserId, toUserId || 'all', content, mention);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { message } }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  if (method === 'POST' && pathname === '/api/v1/chat/read') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { messageId, userId } = JSON.parse(body);
        if (!messageId || !userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'messageId and userId are required' }));
          return;
        }
        const message = chatService.markAsRead(messageId, userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { message } }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  if (method === 'POST' && pathname === '/api/v1/chat/read-all') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { userId } = JSON.parse(body);
        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'userId is required' }));
          return;
        }
        const count = chatService.markAllAsRead(userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { markedCount: count } }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  if (method === 'POST' && pathname === '/api/v1/chat/online') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { userId, online } = JSON.parse(body);
        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'userId is required' }));
          return;
        }
        const user = chatService.setOnline(userId, online !== false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { user } }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  if (method === 'DELETE' && pathname.startsWith('/api/v1/chat/message/')) {
    const messageId = pathname.replace('/api/v1/chat/message/', '');
    const userId = urlParsed.query.userId;
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'userId is required' }));
      return;
    }
    const deleted = chatService.deleteMessage(messageId, userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: deleted, data: { deleted } }));
    return;
  }
  
  if (method === 'GET' && pathname === '/api/v1/chat/stats') {
    const stats = chatService.getStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { stats } }));
    return;
  }
  
  if (method === 'POST' && pathname === '/api/v1/chat/clear') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { keepCount } = JSON.parse(body);
        const cleared = chatService.clearOldMessages(keepCount || 100);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { cleared } }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  if (method === 'POST' && pathname === '/api/v1/chat/user/add') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { name, role, avatar } = JSON.parse(body);
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'name is required' }));
          return;
        }
        const result = chatService.addUser(name, role, avatar);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  if (method === 'DELETE' && pathname.startsWith('/api/v1/chat/user/')) {
    const userId = pathname.replace('/api/v1/chat/user/', '');
    const result = chatService.removeUser(userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }
  
  if (method === 'PUT' && pathname.startsWith('/api/v1/chat/user/')) {
    const userId = pathname.replace('/api/v1/chat/user/', '');
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const result = chatService.updateUser(userId, updates);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  // API配置路由
  const apiConfigService = require('./services/apiConfigService');
  
  if (method === 'GET' && pathname === '/api/v1/api-configs') {
    const configs = apiConfigService.getConfigs();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { configs } }));
    return;
  }
  
  if (method === 'POST' && pathname === '/api/v1/api-configs') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        const result = apiConfigService.addConfig(config);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  if (method === 'PUT' && pathname.startsWith('/api/v1/api-configs/')) {
    const configId = pathname.replace('/api/v1/api-configs/', '');
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const result = apiConfigService.updateConfig(configId, updates);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  if (method === 'DELETE' && pathname.startsWith('/api/v1/api-configs/')) {
    const configId = pathname.replace('/api/v1/api-configs/', '');
    const result = apiConfigService.deleteConfig(configId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }
  
  if (method === 'POST' && pathname === '/api/v1/api-configs/call') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { configId, messages, options } = JSON.parse(body);
        const result = await apiConfigService.callAPI(configId, messages, options);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  // 处理静态文件
  if (pathname === '/' || pathname === '/index.html') {
    handleStaticFile(res, path.join(__dirname, '../frontend', 'real-app-final.html'));
    return;
  }
  
  if (pathname === '/real-app-final.html') {
    handleStaticFile(res, path.join(__dirname, '../frontend', 'real-app-final.html'));
    return;
  }
  
  if (pathname === '/enterprise-app.html') {
    handleStaticFile(res, path.join(__dirname, '../frontend', 'enterprise-app.html'));
    return;
  }
  
  if (pathname === '/interview-video.html') {
    handleStaticFile(res, path.join(__dirname, '../frontend', 'interview-video.html'));
    return;
  }
  
  if (pathname === '/interview-coach.html') {
    handleStaticFile(res, path.join(__dirname, '../frontend', 'interview-coach.html'));
    return;
  }
  
  // 处理其他静态文件
  const staticFilePath = path.join(__dirname, '../frontend', pathname);
  if (fs.existsSync(staticFilePath) && fs.statSync(staticFilePath).isFile()) {
    handleStaticFile(res, staticFilePath);
    return;
  }
  
  // 默认404响应
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: 'API 端点不存在'
  }));
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 简化版后端服务器启动成功！`);
  console.log(`📋 服务器地址: http://0.0.0.0:${PORT}`);
  console.log(`🔧 核心功能:`);
  console.log(`   ✅ API状态检查 (/api/status)`);
  console.log(`   ✅ 简历优化 (/api/resume/optimize)`);
  console.log(`   ✅ 简历上传 (/api/resume/upload)`);
  console.log(`   ✅ 简历文本解析 (/api/resume/parse-text)`);
  console.log(`   ✅ 简历状态检查 (/api/resume/check)`);
  console.log(`   ✅ 通话记录管理 (/api/call-records)`);
  console.log(`   ✅ 面试教练页面 (/interview-coach.html)`);
  console.log(`   ✅ 视频面试页面 (/interview-video.html)`);
  console.log(`   ✅ 静态文件服务`);
  console.log(`💡 提示: 这是一个简化版服务器，专注于核心功能！`);
});

// 处理获取通话记录
function handleGetCallRecords(res) {
    try {
        const records = readCallRecords();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            data: records
        }));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: '获取通话记录失败'
        }));
    }
}

// 处理保存通话记录
function handleSaveCallRecord(res, body) {
    try {
        const newRecord = JSON.parse(body);
        const records = readCallRecords();
        
        // 生成唯一ID
        if (!newRecord.id) {
            newRecord.id = Date.now().toString();
        }
        
        // 检查是否已存在（更新）或新增
        const existingIndex = records.findIndex(r => r.id === newRecord.id);
        if (existingIndex >= 0) {
            records[existingIndex] = newRecord;
        } else {
            records.unshift(newRecord);
        }
        
        if (saveCallRecords(records)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: newRecord,
                message: '通话记录保存成功'
            }));
        } else {
            throw new Error('保存失败');
        }
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: '保存通话记录失败: ' + error.message
        }));
    }
}

// 处理删除通话记录
function handleDeleteCallRecord(res, recordId) {
    try {
        const records = readCallRecords();
        const filteredRecords = records.filter(r => r.id !== recordId);
        
        if (records.length === filteredRecords.length) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: '通话记录不存在'
            }));
            return;
        }
        
        if (saveCallRecords(filteredRecords)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: '通话记录删除成功'
            }));
        } else {
            throw new Error('删除失败');
        }
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: '删除通话记录失败: ' + error.message
        }));
    }
}

// 错误处理
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`);
    process.exit(1);
  }
  console.error(`❌ 服务器启动失败: ${error.message}`);
  process.exit(1);
});
