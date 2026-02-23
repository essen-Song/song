/**
 * 投递状态管理服务
 * 负责管理和跟踪所有平台的投递状态
 */
class DeliveryStatusManager {
  constructor() {
    this.statuses = new Map(); // 存储投递状态
    this.errorHandlers = new Map(); // 存储错误处理函数
    this.retryAttempts = new Map(); // 存储重试次数
    this.maxRetries = 3; // 最大重试次数
    this.retryDelay = 5000; // 重试延迟（毫秒）
  }

  /**
   * 初始化投递状态
   * @param {String} deliveryId - 投递ID
   * @param {Object} deliveryData - 投递数据
   */
  initDeliveryStatus(deliveryId, deliveryData) {
    this.statuses.set(deliveryId, {
      id: deliveryId,
      status: 'pending', // pending, processing, success, failed, cancelled
      progress: 0,
      totalJobs: deliveryData.totalJobs || 0,
      completedJobs: 0,
      failedJobs: 0,
      platformStatuses: {},
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      deliveryData: deliveryData,
      errors: [],
      warnings: []
    });

    // 初始化平台状态
    if (deliveryData.platforms) {
      deliveryData.platforms.forEach(platform => {
        this.statuses.get(deliveryId).platformStatuses[platform] = {
          status: 'pending',
          progress: 0,
          totalJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          errors: []
        };
      });
    }

    console.log(`初始化投递状态: ${deliveryId}`);
  }

  /**
   * 更新投递状态
   * @param {String} deliveryId - 投递ID
   * @param {String} status - 状态
   * @param {Object} updates - 更新数据
   */
  updateDeliveryStatus(deliveryId, status, updates = {}) {
    const currentStatus = this.statuses.get(deliveryId);
    if (!currentStatus) {
      console.warn(`投递状态不存在: ${deliveryId}`);
      return;
    }

    const updatedStatus = {
      ...currentStatus,
      status,
      lastUpdate: new Date().toISOString(),
      ...updates
    };

    // 更新进度
    if (updatedStatus.totalJobs > 0) {
      updatedStatus.progress = Math.round(
        (updatedStatus.completedJobs / updatedStatus.totalJobs) * 100
      );
    }

    this.statuses.set(deliveryId, updatedStatus);
    console.log(`更新投递状态: ${deliveryId} -> ${status}`);
  }

  /**
   * 更新平台状态
   * @param {String} deliveryId - 投递ID
   * @param {String} platform - 平台
   * @param {String} status - 状态
   * @param {Object} updates - 更新数据
   */
  updatePlatformStatus(deliveryId, platform, status, updates = {}) {
    const currentStatus = this.statuses.get(deliveryId);
    if (!currentStatus) {
      console.warn(`投递状态不存在: ${deliveryId}`);
      return;
    }

    const platformStatus = currentStatus.platformStatuses[platform] || {
      status: 'pending',
      progress: 0,
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      errors: []
    };

    const updatedPlatformStatus = {
      ...platformStatus,
      status,
      ...updates
    };

    // 更新平台进度
    if (updatedPlatformStatus.totalJobs > 0) {
      updatedPlatformStatus.progress = Math.round(
        (updatedPlatformStatus.completedJobs / updatedPlatformStatus.totalJobs) * 100
      );
    }

    currentStatus.platformStatuses[platform] = updatedPlatformStatus;
    this.statuses.set(deliveryId, currentStatus);
    console.log(`更新平台状态: ${platform} -> ${status}`);

    // 重新计算整体进度
    this.recalculateProgress(deliveryId);
  }

  /**
   * 重新计算整体进度
   * @param {String} deliveryId - 投递ID
   */
  recalculateProgress(deliveryId) {
    const currentStatus = this.statuses.get(deliveryId);
    if (!currentStatus) return;

    let totalJobs = 0;
    let completedJobs = 0;
    let failedJobs = 0;

    // 计算所有平台的总任务数
    Object.values(currentStatus.platformStatuses).forEach(platformStatus => {
      totalJobs += platformStatus.totalJobs;
      completedJobs += platformStatus.completedJobs;
      failedJobs += platformStatus.failedJobs;
    });

    currentStatus.totalJobs = totalJobs;
    currentStatus.completedJobs = completedJobs;
    currentStatus.failedJobs = failedJobs;

    if (totalJobs > 0) {
      currentStatus.progress = Math.round((completedJobs / totalJobs) * 100);
    }

    // 更新整体状态
    if (completedJobs === totalJobs && totalJobs > 0) {
      currentStatus.status = failedJobs > 0 ? 'partial_success' : 'success';
    }

    this.statuses.set(deliveryId, currentStatus);
  }

  /**
   * 记录投递错误
   * @param {String} deliveryId - 投递ID
   * @param {String} platform - 平台
   * @param {Error|String} error - 错误
   * @param {Object} context - 错误上下文
   */
  recordError(deliveryId, platform, error, context = {}) {
    const currentStatus = this.statuses.get(deliveryId);
    if (!currentStatus) {
      console.warn(`投递状态不存在: ${deliveryId}`);
      return;
    }

    const errorMessage = error instanceof Error ? error.message : error;
    const errorData = {
      timestamp: new Date().toISOString(),
      platform,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : null,
      context
    };

    // 添加到全局错误列表
    currentStatus.errors.push(errorData);

    // 添加到平台错误列表
    if (currentStatus.platformStatuses[platform]) {
      currentStatus.platformStatuses[platform].errors.push(errorData);
    }

    this.statuses.set(deliveryId, currentStatus);
    console.error(`投递错误 [${platform}]: ${errorMessage}`, context);

    // 处理错误
    this.handleError(deliveryId, platform, error, context);
  }

  /**
   * 记录投递警告
   * @param {String} deliveryId - 投递ID
   * @param {String} platform - 平台
   * @param {String} warning - 警告信息
   * @param {Object} context - 警告上下文
   */
  recordWarning(deliveryId, platform, warning, context = {}) {
    const currentStatus = this.statuses.get(deliveryId);
    if (!currentStatus) {
      console.warn(`投递状态不存在: ${deliveryId}`);
      return;
    }

    const warningData = {
      timestamp: new Date().toISOString(),
      platform,
      warning,
      context
    };

    currentStatus.warnings.push(warningData);
    this.statuses.set(deliveryId, currentStatus);
    console.warn(`投递警告 [${platform}]: ${warning}`, context);
  }

  /**
   * 处理错误
   * @param {String} deliveryId - 投递ID
   * @param {String} platform - 平台
   * @param {Error|String} error - 错误
   * @param {Object} context - 错误上下文
   */
  handleError(deliveryId, platform, error, context = {}) {
    // 检查是否有平台特定的错误处理器
    const platformErrorHandler = this.errorHandlers.get(platform);
    if (platformErrorHandler) {
      try {
        platformErrorHandler(error, context);
      } catch (handlerError) {
        console.error(`错误处理器执行失败: ${handlerError.message}`);
      }
    }

    // 尝试重试
    this.attemptRetry(deliveryId, platform, error, context);
  }

  /**
   * 尝试重试
   * @param {String} deliveryId - 投递ID
   * @param {String} platform - 平台
   * @param {Error|String} error - 错误
   * @param {Object} context - 错误上下文
   */
  async attemptRetry(deliveryId, platform, error, context = {}) {
    const currentAttempts = this.retryAttempts.get(`${deliveryId}:${platform}`) || 0;

    if (currentAttempts < this.maxRetries) {
      console.log(`尝试重试 [${platform}]: ${currentAttempts + 1}/${this.maxRetries}`);

      // 增加重试计数
      this.retryAttempts.set(`${deliveryId}:${platform}`, currentAttempts + 1);

      // 延迟重试
      setTimeout(async () => {
        try {
          // 调用重试回调
          if (context.retryCallback) {
            await context.retryCallback();
            console.log(`重试成功 [${platform}]`);
          }
        } catch (retryError) {
          console.error(`重试失败 [${platform}]: ${retryError.message}`);
          this.recordError(deliveryId, platform, retryError, context);
        }
      }, this.retryDelay * (currentAttempts + 1));
    } else {
      console.error(`达到最大重试次数 [${platform}]`);
      this.updatePlatformStatus(deliveryId, platform, 'failed');
    }
  }

  /**
   * 注册平台错误处理器
   * @param {String} platform - 平台
   * @param {Function} handler - 错误处理函数
   */
  registerErrorHandler(platform, handler) {
    this.errorHandlers.set(platform, handler);
    console.log(`注册平台错误处理器: ${platform}`);
  }

  /**
   * 获取投递状态
   * @param {String} deliveryId - 投递ID
   * @returns {Object} 投递状态
   */
  getDeliveryStatus(deliveryId) {
    return this.statuses.get(deliveryId);
  }

  /**
   * 获取所有投递状态
   * @returns {Array} 投递状态列表
   */
  getAllDeliveryStatuses() {
    return Array.from(this.statuses.values());
  }

  /**
   * 清理过期的投递状态
   * @param {Number} maxAge - 最大年龄（毫秒）
   */
  cleanupExpiredStatuses(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
    const now = new Date().getTime();
    const expiredIds = [];

    this.statuses.forEach((status, deliveryId) => {
      const startTime = new Date(status.startTime).getTime();
      if (now - startTime > maxAge) {
        expiredIds.push(deliveryId);
      }
    });

    expiredIds.forEach(id => {
      this.statuses.delete(id);
      this.retryAttempts.delete(id);
      console.log(`清理过期投递状态: ${id}`);
    });

    return expiredIds.length;
  }

  /**
   * 取消投递
   * @param {String} deliveryId - 投递ID
   * @returns {Boolean} 是否取消成功
   */
  cancelDelivery(deliveryId) {
    const currentStatus = this.statuses.get(deliveryId);
    if (!currentStatus) {
      console.warn(`投递状态不存在: ${deliveryId}`);
      return false;
    }

    currentStatus.status = 'cancelled';
    currentStatus.lastUpdate = new Date().toISOString();
    this.statuses.set(deliveryId, currentStatus);

    // 取消所有平台的投递
    Object.keys(currentStatus.platformStatuses).forEach(platform => {
      currentStatus.platformStatuses[platform].status = 'cancelled';
    });

    console.log(`取消投递: ${deliveryId}`);
    return true;
  }

  /**
   * 设置最大重试次数
   * @param {Number} maxRetries - 最大重试次数
   */
  setMaxRetries(maxRetries) {
    this.maxRetries = maxRetries;
  }

  /**
   * 设置重试延迟
   * @param {Number} retryDelay - 重试延迟（毫秒）
   */
  setRetryDelay(retryDelay) {
    this.retryDelay = retryDelay;
  }

  /**
   * 获取投递统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const statuses = Array.from(this.statuses.values());
    const stats = {
      totalDeliveries: statuses.length,
      statusCounts: {
        pending: 0,
        processing: 0,
        success: 0,
        partial_success: 0,
        failed: 0,
        cancelled: 0
      },
      platformStats: {},
      averageDuration: 0,
      successRate: 0
    };

    // 计算状态统计
    statuses.forEach(status => {
      stats.statusCounts[status.status] = (stats.statusCounts[status.status] || 0) + 1;

      // 计算平台统计
      Object.keys(status.platformStatuses).forEach(platform => {
        if (!stats.platformStats[platform]) {
          stats.platformStats[platform] = {
            total: 0,
            success: 0,
            failed: 0
          };
        }

        stats.platformStats[platform].total++;
        const platformStatus = status.platformStatuses[platform].status;
        if (platformStatus === 'success') {
          stats.platformStats[platform].success++;
        } else if (platformStatus === 'failed') {
          stats.platformStats[platform].failed++;
        }
      });
    });

    // 计算平均持续时间
    const completedDeliveries = statuses.filter(s => 
      s.status === 'success' || s.status === 'failed' || s.status === 'cancelled'
    );

    if (completedDeliveries.length > 0) {
      const totalDuration = completedDeliveries.reduce((sum, status) => {
        const startTime = new Date(status.startTime).getTime();
        const lastUpdate = new Date(status.lastUpdate).getTime();
        return sum + (lastUpdate - startTime);
      }, 0);

      stats.averageDuration = totalDuration / completedDeliveries.length;
    }

    // 计算成功率
    const successfulDeliveries = statuses.filter(s => 
      s.status === 'success' || s.status === 'partial_success'
    );

    if (statuses.length > 0) {
      stats.successRate = (successfulDeliveries.length / statuses.length) * 100;
    }

    return stats;
  }

  /**
   * 导出投递状态
   * @param {String} deliveryId - 投递ID
   * @returns {Object} 投递状态（可序列化）
   */
  exportDeliveryStatus(deliveryId) {
    const status = this.getDeliveryStatus(deliveryId);
    if (!status) return null;

    return {
      ...status,
      // 确保所有数据都是可序列化的
      platformStatuses: JSON.parse(JSON.stringify(status.platformStatuses)),
      errors: status.errors.map(error => ({
        ...error,
        stack: error.stack ? error.stack.substring(0, 1000) : null // 限制堆栈大小
      }))
    };
  }

  /**
   * 导入投递状态
   * @param {Object} statusData - 投递状态数据
   */
  importDeliveryStatus(statusData) {
    this.statuses.set(statusData.id, statusData);
    console.log(`导入投递状态: ${statusData.id}`);
  }
}

module.exports = DeliveryStatusManager;