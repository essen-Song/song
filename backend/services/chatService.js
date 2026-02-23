const fs = require('fs');
const path = require('path');

const MESSAGES_FILE = path.join(__dirname, '../messages.json');
const USERS_FILE = path.join(__dirname, '../chat-users.json');

const DEFAULT_USERS = [
  { id: 1, name: '豆包', role: 'ai', avatar: '🤖', online: true, lastSeen: null }
];

const MAX_MESSAGES = 1000;
const MAX_MESSAGE_LENGTH = 5000;

function initFiles() {
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2));
  }
}
initFiles();

function readMessages() {
  try {
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_USERS;
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function trimMessages(messages) {
  if (messages.length > MAX_MESSAGES) {
    return messages.slice(-MAX_MESSAGES);
  }
  return messages;
}

function getMessageStats() {
  const messages = readMessages();
  const totalSize = JSON.stringify(messages).length;
  return {
    count: messages.length,
    totalSize: totalSize,
    totalSizeKB: Math.round(totalSize / 1024),
    maxSizeKB: Math.round(MAX_MESSAGES * 500 / 1024),
    usagePercent: Math.round((messages.length / MAX_MESSAGES) * 100)
  };
}

class ChatService {
  getMessages(userId = null, options = {}) {
    let messages = readMessages();
    
    if (userId) {
      messages = messages.filter(m => 
        m.toUserId === userId || 
        m.toUserId === 'all' || 
        m.fromUserId === userId
      );
    }
    
    if (options.since) {
      messages = messages.filter(m => new Date(m.createdAt) > new Date(options.since));
    }
    
    return messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getUnreadCount(userId) {
    const messages = readMessages();
    return messages.filter(m => 
      (m.toUserId === userId || m.toUserId === 'all') && 
      !m.readBy?.includes(userId)
    ).length;
  }

  sendMessage(fromUserId, toUserId, content, mention = null) {
    const messages = readMessages();
    const users = readUsers();
    
    if (content.length > MAX_MESSAGE_LENGTH) {
      content = content.substring(0, MAX_MESSAGE_LENGTH) + '...';
    }
    
    const fromUser = users.find(u => u.id === parseInt(fromUserId));
    const toUser = users.find(u => u.id === parseInt(toUserId));
    
    const message = {
      id: Date.now().toString(),
      fromUserId: parseInt(fromUserId),
      fromUserName: fromUser?.name || '未知用户',
      fromUserAvatar: fromUser?.avatar || '👤',
      toUserId: toUserId === 'all' ? 'all' : parseInt(toUserId),
      toUserName: toUserId === 'all' ? '所有人' : (toUser?.name || '未知用户'),
      content,
      mention,
      readBy: [parseInt(fromUserId)],
      createdAt: new Date().toISOString()
    };
    
    messages.push(message);
    const trimmedMessages = trimMessages(messages);
    saveMessages(trimmedMessages);
    
    return message;
  }

  markAsRead(messageId, userId) {
    const messages = readMessages();
    const message = messages.find(m => m.id === messageId);
    
    if (message) {
      if (!message.readBy) message.readBy = [];
      if (!message.readBy.includes(parseInt(userId))) {
        message.readBy.push(parseInt(userId));
        saveMessages(messages);
      }
    }
    
    return message;
  }

  markAllAsRead(userId) {
    const messages = readMessages();
    let updated = 0;
    
    messages.forEach(m => {
      if ((m.toUserId === userId || m.toUserId === 'all') && !m.readBy?.includes(parseInt(userId))) {
        if (!m.readBy) m.readBy = [];
        m.readBy.push(parseInt(userId));
        updated++;
      }
    });
    
    saveMessages(messages);
    return updated;
  }

  getUsers() {
    return readUsers();
  }

  setOnline(userId, online = true) {
    const users = readUsers();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (user) {
      user.online = online;
      user.lastSeen = new Date().toISOString();
      saveUsers(users);
    }
    
    return user;
  }

  getOnlineUsers() {
    const users = readUsers();
    return users.filter(u => u.online);
  }

  deleteMessage(messageId, userId) {
    const messages = readMessages();
    const index = messages.findIndex(m => m.id === messageId && m.fromUserId === parseInt(userId));
    
    if (index > -1) {
      messages.splice(index, 1);
      saveMessages(messages);
      return true;
    }
    
    return false;
  }

  getStats() {
    return getMessageStats();
  }

  clearOldMessages(keepCount = 100) {
    const messages = readMessages();
    if (messages.length > keepCount) {
      const trimmed = messages.slice(-keepCount);
      saveMessages(trimmed);
      return messages.length - keepCount;
    }
    return 0;
  }

  addUser(name, role = 'user', avatar = '👤') {
    const users = readUsers();
    
    const existingUser = users.find(u => u.name === name);
    if (existingUser) {
      return { success: false, error: '用户名已存在', user: existingUser };
    }
    
    const maxId = users.reduce((max, u) => Math.max(max, u.id), 0);
    const newUser = {
      id: maxId + 1,
      name,
      role,
      avatar,
      online: false,
      lastSeen: null
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return { success: true, user: newUser };
  }

  removeUser(userId) {
    const users = readUsers();
    const index = users.findIndex(u => u.id === parseInt(userId));
    
    if (index > -1) {
      const removed = users.splice(index, 1);
      saveUsers(users);
      return { success: true, user: removed[0] };
    }
    
    return { success: false, error: '用户不存在' };
  }

  updateUser(userId, updates) {
    const users = readUsers();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (user) {
      Object.assign(user, updates);
      saveUsers(users);
      return { success: true, user };
    }
    
    return { success: false, error: '用户不存在' };
  }
}

module.exports = new ChatService();
