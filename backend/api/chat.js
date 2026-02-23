const chatService = require('../services/chatService');

function setupChatRoutes(app) {
  app.get('/api/v1/chat/messages', (req, res) => {
    try {
      const { userId, since } = req.query;
      const messages = chatService.getMessages(userId ? parseInt(userId) : null, { since });
      res.json({ success: true, data: { messages } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/chat/unread', (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      const count = chatService.getUnreadCount(parseInt(userId));
      res.json({ success: true, data: { count } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/chat/send', (req, res) => {
    try {
      const { fromUserId, toUserId, content, mention } = req.body;
      
      if (!fromUserId || !content) {
        return res.status(400).json({ success: false, error: 'fromUserId and content are required' });
      }
      
      const message = chatService.sendMessage(fromUserId, toUserId || 'all', content, mention);
      res.json({ success: true, data: { message } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/chat/read', (req, res) => {
    try {
      const { messageId, userId } = req.body;
      
      if (!messageId || !userId) {
        return res.status(400).json({ success: false, error: 'messageId and userId are required' });
      }
      
      const message = chatService.markAsRead(messageId, userId);
      res.json({ success: true, data: { message } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/chat/read-all', (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      
      const count = chatService.markAllAsRead(userId);
      res.json({ success: true, data: { markedCount: count } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/chat/users', (req, res) => {
    try {
      const users = chatService.getUsers();
      res.json({ success: true, data: { users } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/chat/online', (req, res) => {
    try {
      const { userId, online } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      
      const user = chatService.setOnline(userId, online !== false);
      res.json({ success: true, data: { user } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/chat/online-users', (req, res) => {
    try {
      const users = chatService.getOnlineUsers();
      res.json({ success: true, data: { users } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/v1/chat/message/:messageId', (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      
      const deleted = chatService.deleteMessage(messageId, userId);
      res.json({ success: deleted, data: { deleted } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = { setupChatRoutes };
