const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ResumeParser = require('../utils/resumeParser');
const PDFResumeParser = require('../utils/pdfParser');
const WordResumeParser = require('../utils/wordParser');
const { supabase } = require('../utils/supabase');
const { ValidationHelper } = require('../utils/validationHelper');
const { SecurityHelper } = require('../utils/securityHelper');
const { DatabaseHelper } = require('../utils/dbHelper');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持PDF和Word文档格式'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 简历解析器实例
const resumeParser = new ResumeParser();
const pdfParser = new PDFResumeParser();
const wordParser = new WordResumeParser();
const dbHelper = new DatabaseHelper();

/**
 * POST /api/resume/upload
 * 上传并解析简历
 */
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传简历文件'
      });
    }
    
    const file = req.file;
    const userId = req.body.userId || uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    
    // 验证文件上传安全性
    const fileValidation = SecurityHelper.validateFileUpload(file);
    if (!fileValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: fileValidation.errors.join(', ')
      });
    }
    
    console.log(`开始解析简历: ${file.originalname}, 用户: ${userId}`);
    
    let parseResult;
    let extractedText = '';
    
    // 根据文件类型选择解析器
    if (ext === '.pdf') {
      const pdfResult = await pdfParser.extractText(file.path);
      if (!pdfResult.success) {
        throw new Error(`PDF解析失败: ${pdfResult.error}`);
      }
      extractedText = pdfResult.text;
    } else if (ext === '.docx') {
      const wordResult = await wordParser.extractText(file.path);
      if (!wordResult.success) {
        throw new Error(`Word解析失败: ${wordResult.error}`);
      }
      extractedText = wordResult.text;
    }
    
    // 使用简历解析器提取结构化信息
    parseResult = resumeParser.parse(extractedText);
    
    // 验证解析结果
    const validation = resumeParser.validateResult(parseResult);
    
    // 验证简历数据格式
    const dataValidation = resumeParser.validateResumeData(parseResult);
    if (!dataValidation.isValid) {
      console.warn('简历数据格式验证失败:', dataValidation.errors);
    }
    
    if (!validation.isValid) {
      console.warn(`简历解析准确率较低: ${validation.accuracy}%`);
    }
    
    // 上传到Supabase Storage
    const fileName = `${userId}/${uuidv4()}-${file.originalname}`;
    const fileBuffer = fs.readFileSync(file.path);
    
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('resumes')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });
    
    if (storageError) {
      console.error('文件上传失败:', storageError);
      throw new Error('文件上传失败');
    }
    
    // 获取公开URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('resumes')
      .getPublicUrl(fileName);
    
    // 保存解析结果到数据库
    const resumeData = {
      user_id: userId,
      name: parseResult.name || '未知',
      email: parseResult.email,
      phone: parseResult.phone,
      education: JSON.stringify(parseResult.education || []),
      work_experience: JSON.stringify(parseResult.workExperience || []),
      projects: JSON.stringify(parseResult.projects || []),
      skills: parseResult.skills || [],
      file_url: publicUrl,
      file_name: file.originalname,
      parsed_data: parseResult
    };
    
    const { data: dbData, error: dbError } = await supabase
      .from('resumes')
      .insert([resumeData])
      .select()
      .single();
    
    if (dbError) {
      console.error('数据库保存失败:', dbError);
      throw new Error('简历信息保存失败');
    }
    
    // 清理临时文件
    fs.unlinkSync(file.path);
    
    console.log(`简历解析完成，准确率: ${validation.accuracy}%`);
    
    res.json({
      success: true,
      data: {
        resumeId: dbData.id,
        userId: userId,
        fileName: file.originalname,
        fileUrl: publicUrl,
        parsedData: parseResult,
        accuracy: validation.accuracy,
        validation: validation,
        dataValidation: dataValidation
      },
      message: '简历上传和解析成功'
    });
    
  } catch (error) {
    console.error('简历处理失败:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // 创建安全的错误响应
    const safeError = SecurityHelper.createSafeErrorResponse(error, process.env.NODE_ENV);
    res.status(500).json(safeError);
  }
});

/**
 * GET /api/resume/:resumeId
 * 获取简历详情
 */
router.get('/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (error) {
      throw new Error('简历不存在');
    }
    
    // 解析JSON字段
    const resumeData = {
      ...data,
      education: JSON.parse(data.education || '[]'),
      work_experience: JSON.parse(data.work_experience || '[]'),
      projects: JSON.parse(data.projects || '[]'),
      skills: data.skills || [],
      parsed_data: data.parsed_data || {}
    };
    
    res.json({
      success: true,
      data: resumeData
    });
    
  } catch (error) {
    console.error('获取简历失败:', error);
    res.status(404).json({
      success: false,
      error: error.message || '简历不存在'
    });
  }
});

/**
 * GET /api/resume/user/:userId
 * 获取用户所有简历
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('resumes')
      .select('id, name, email, file_name, file_url, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error('获取简历列表失败');
    }
    
    res.json({
      success: true,
      data: data || [],
      count: data ? data.length : 0
    });
    
  } catch (error) {
    console.error('获取用户简历失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取简历列表失败'
    });
  }
});

/**
 * DELETE /api/resume/:resumeId
 * 删除简历
 */
router.delete('/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.body.userId;
    
    // 首先获取简历信息
    const { data: resumeData, error: fetchError } = await supabase
      .from('resumes')
      .select('file_url')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      throw new Error('简历不存在或无权限删除');
    }
    
    // 从Storage删除文件
    if (resumeData.file_url) {
      const fileName = resumeData.file_url.split('/').pop();
      const { error: storageError } = await supabase
        .storage
        .from('resumes')
        .remove([fileName]);
      
      if (storageError) {
        console.warn('文件删除失败:', storageError);
      }
    }
    
    // 从数据库删除记录
    const { error: dbError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', userId);
    
    if (dbError) {
      throw new Error('删除简历失败');
    }
    
    res.json({
      success: true,
      message: '简历删除成功'
    });
    
  } catch (error) {
    console.error('删除简历失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '删除简历失败'
    });
  }
});

/**
 * POST /api/resume/parse-text
 * 直接解析简历文本（不保存文件）
 */
router.post('/parse-text', express.json(), async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的简历文本'
      });
    }
    
    // 清理输入文本
    const sanitizedText = ValidationHelper.sanitizeInput(text);
    
    // 解析简历文本
    const parseResult = resumeParser.parse(sanitizedText);
    const validation = resumeParser.validateResult(parseResult);
    
    // 验证解析结果数据格式
    const dataValidation = resumeParser.validateResumeData(parseResult);
    
    res.json({
      success: true,
      data: {
        parsedData: parseResult,
        accuracy: validation.accuracy,
        validation: validation,
        dataValidation: dataValidation
      },
      message: '简历文本解析成功'
    });
    
  } catch (error) {
    console.error('简历文本解析失败:', error);
    const safeError = SecurityHelper.createSafeErrorResponse(error, process.env.NODE_ENV);
    res.status(500).json(safeError);
  }
});

module.exports = router;