# Prompt Engineering优化方案

> 日期：2026-02-23
> 执行人：AI训练师兼AI产品经理 马丁

---

## 一、优化目标

适配本地Ollama模型（gpt-oss:20b），提升以下场景效果：
1. 简历解析
2. 面试问答
3. 职位匹配

---

## 二、优化原则

| 原则 | 说明 |
|------|------|
| 简洁明确 | 提示词要简洁，避免冗余 |
| 结构清晰 | 使用JSON格式输出 |
| 角色设定 | 明确AI角色和任务 |
| 示例引导 | 提供输出示例 |

---

## 三、优化后的提示词

### 3.1 简历解析提示词

```
你是简历解析专家。请从简历中提取信息，返回JSON格式。

简历内容：
{{resumeText}}

返回格式（基于JSON Resume Schema标准）：
{
  "basics": {
    "name": "姓名",
    "label": "职位标签",
    "image": "头像URL",
    "email": "邮箱",
    "phone": "电话",
    "age": "年龄",
    "url": "个人网站",
    "summary": "个人简介",
    "location": {
      "address": "地址",
      "city": "城市",
      "region": "省份",
      "postalCode": "邮编",
      "countryCode": "国家代码"
    },
    "profiles": [{
      "network": "平台名称",
      "username": "用户名",
      "url": "链接"
    }]
  },
  "work": [{
    "name": "公司名称",
    "position": "职位",
    "url": "公司网站",
    "startDate": "开始日期",
    "endDate": "结束日期",
    "summary": "工作概述",
    "highlights": ["亮点1", "亮点2"]
  }],
  "volunteer": [{
    "organization": "组织名称",
    "position": "职位",
    "url": "组织网站",
    "startDate": "开始日期",
    "endDate": "结束日期",
    "summary": "概述",
    "highlights": ["亮点1", "亮点2"]
  }],
  "education": [{
    "institution": "学校名称",
    "url": "学校网站",
    "area": "专业领域",
    "studyType": "学历类型",
    "startDate": "开始日期",
    "endDate": "结束日期",
    "score": "GPA",
    "courses": ["课程1", "课程2"]
  }],
  "awards": [{
    "title": "奖项名称",
    "date": "获奖日期",
    "awarder": "颁发机构",
    "summary": "奖项描述"
  }],
  "certificates": [{
    "name": "证书名称",
    "date": "获得日期",
    "issuer": "颁发机构",
    "url": "证书链接"
  }],
  "publications": [{
    "name": "出版物名称",
    "publisher": "出版商",
    "releaseDate": "发布日期",
    "url": "链接",
    "summary": "描述"
  }],
  "skills": [{
    "name": "技能名称",
    "level": "熟练程度",
    "keywords": ["关键词1", "关键词2"]
  }],
  "languages": [{
    "language": "语言",
    "fluency": "流利程度"
  }],
  "interests": [{
    "name": "兴趣名称",
    "keywords": ["关键词1", "关键词2"]
  }],
  "references": [{
    "name": "推荐人姓名",
    "reference": "推荐语"
  }],
  "projects": [{
    "name": "项目名称",
    "description": "项目描述",
    "highlights": ["亮点1", "亮点2"],
    "keywords": ["关键词1", "关键词2"],
    "startDate": "开始日期",
    "endDate": "结束日期",
    "url": "项目链接",
    "roles": ["角色1", "角色2"],
    "entity": "所属组织",
    "type": "项目类型"
  }],
  "meta": {
    "canonical": "简历来源URL",
    "version": "版本号",
    "lastModified": "最后修改日期"
  }
}

只返回JSON，不要其他内容。
```

### 3.2 面试问题生成提示词

```
你是面试官。根据职位生成面试问题。

职位：{{position}}
技能要求：{{skills}}

返回格式：
{
  "questions": [
    {"type": "技术", "question": "问题内容"},
    {"type": "行为", "question": "问题内容"}
  ]
}

生成5个问题，只返回JSON。
```

### 3.3 面试评估提示词

```
你是面试评估专家。用STAR方法评估回答。

问题：{{question}}
回答：{{answer}}

返回格式：
{
  "score": 85,
  "star": {
    "situation": "情境描述评分",
    "task": "任务描述评分",
    "action": "行动描述评分",
    "result": "结果描述评分"
  },
  "feedback": "改进建议"
}

只返回JSON。
```

### 3.4 职位匹配提示词

```
你是招聘专家。评估简历与职位的匹配度。

简历：{{resume}}
职位要求：{{jobRequirement}}

返回格式：
{
  "matchScore": 85,
  "matchedSkills": ["匹配的技能"],
  "missingSkills": ["缺失的技能"],
  "suggestions": ["改进建议"]
}

只返回JSON。
```

---

## 四、实施步骤

| 步骤 | 内容 | 时间 |
|------|------|------|
| 1 | 更新PromptEngineeringService.js | 0.5天 |
| 2 | 测试各场景提示词效果 | 0.5天 |
| 3 | 根据测试结果迭代优化 | 持续 |

---

## 五、预期效果

| 场景 | 优化前 | 优化后 |
|------|--------|--------|
| 简历解析 | 输出不稳定 | JSON格式稳定 |
| 面试问答 | 问题质量一般 | 专业且有针对性 |
| 职位匹配 | 匹配度不准 | 量化评分+建议 |

---

**方案完成，开始执行！**
