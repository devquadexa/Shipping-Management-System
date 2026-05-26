/**
 * MSSQL Notification Repository
 * Handles all notification data access operations
 */
const Notification = require('../../domain/entities/Notification');

class MSSQLNotificationRepository {
  constructor(getConnection, sql) {
    this.getConnection = getConnection;
    this.sql = sql;
  }

  async generateNextId() {
    const pool = await this.getConnection();
    const result = await pool.request()
      .query(`
        SELECT ISNULL(MAX(CAST(SUBSTRING(notificationId, 6, LEN(notificationId)) AS INT)), 0) + 1 as nextId
        FROM Notifications
        WHERE notificationId LIKE 'NOTIF%'
      `);
    
    const nextId = result.recordset[0].nextId;
    return `NOTIF${String(nextId).padStart(5, '0')}`;
  }

  async create(notification) {
    const pool = await this.getConnection();
    
    const result = await pool.request()
      .input('notificationId', this.sql.VarChar, notification.notificationId)
      .input('userId', this.sql.VarChar, notification.userId)
      .input('type', this.sql.VarChar, notification.type)
      .input('title', this.sql.NVarChar, notification.title)
      .input('message', this.sql.NVarChar, notification.message)
      .input('relatedId', this.sql.VarChar, notification.relatedId)
      .input('relatedType', this.sql.VarChar, notification.relatedType)
      .input('isRead', this.sql.Bit, notification.isRead ? 1 : 0)
      .input('readDate', this.sql.DateTime, notification.readDate)
      .input('metadata', this.sql.NVarChar, JSON.stringify(notification.metadata))
      .input('createdDate', this.sql.DateTime, notification.createdDate)
      .input('createdBy', this.sql.VarChar, notification.createdBy)
      .query(`
        INSERT INTO Notifications (
          notificationId, userId, type, title, message, relatedId, relatedType,
          isRead, readDate, metadata, createdDate, createdBy
        )
        VALUES (
          @notificationId, @userId, @type, @title, @message, @relatedId, @relatedType,
          @isRead, @readDate, @metadata, @createdDate, @createdBy
        )
      `);
    
    return notification;
  }

  async findById(notificationId) {
    const pool = await this.getConnection();
    
    const result = await pool.request()
      .input('notificationId', this.sql.VarChar, notificationId)
      .query(`
        SELECT * FROM Notifications
        WHERE notificationId = @notificationId
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findByUserId(userId, limit = 50, offset = 0) {
    const pool = await this.getConnection();
    
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .input('limit', this.sql.Int, limit)
      .input('offset', this.sql.Int, offset)
      .query(`
        SELECT * FROM Notifications
        WHERE userId = @userId
        ORDER BY createdDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findUnreadByUserId(userId, limit = 50, offset = 0) {
    const pool = await this.getConnection();
    
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .input('limit', this.sql.Int, limit)
      .input('offset', this.sql.Int, offset)
      .query(`
        SELECT * FROM Notifications
        WHERE userId = @userId AND isRead = 0
        ORDER BY createdDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async getUnreadCount(userId) {
    const pool = await this.getConnection();
    
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query(`
        SELECT COUNT(*) as unreadCount FROM Notifications
        WHERE userId = @userId AND isRead = 0
      `);
    
    return result.recordset[0].unreadCount;
  }

  async findByRelatedId(relatedId) {
    const pool = await this.getConnection();
    
    const result = await pool.request()
      .input('relatedId', this.sql.VarChar, relatedId)
      .query(`
        SELECT * FROM Notifications
        WHERE relatedId = @relatedId
        ORDER BY createdDate DESC
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByType(type, limit = 50, offset = 0) {
    const pool = await this.getConnection();
    
    const result = await pool.request()
      .input('type', this.sql.VarChar, type)
      .input('limit', this.sql.Int, limit)
      .input('offset', this.sql.Int, offset)
      .query(`
        SELECT * FROM Notifications
        WHERE type = @type
        ORDER BY createdDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async markAsRead(notificationId) {
    const pool = await this.getConnection();
    
    await pool.request()
      .input('notificationId', this.sql.VarChar, notificationId)
      .input('readDate', this.sql.DateTime, new Date())
      .query(`
        UPDATE Notifications
        SET isRead = 1, readDate = @readDate
        WHERE notificationId = @notificationId
      `);
    
    return this.findById(notificationId);
  }

  async markAsUnread(notificationId) {
    const pool = await this.getConnection();
    
    await pool.request()
      .input('notificationId', this.sql.VarChar, notificationId)
      .query(`
        UPDATE Notifications
        SET isRead = 0, readDate = NULL
        WHERE notificationId = @notificationId
      `);
    
    return this.findById(notificationId);
  }

  async markAllAsRead(userId) {
    const pool = await this.getConnection();
    
    await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .input('readDate', this.sql.DateTime, new Date())
      .query(`
        UPDATE Notifications
        SET isRead = 1, readDate = @readDate
        WHERE userId = @userId AND isRead = 0
      `);
    
    return { success: true };
  }

  async delete(notificationId) {
    const pool = await this.getConnection();
    
    await pool.request()
      .input('notificationId', this.sql.VarChar, notificationId)
      .query(`
        DELETE FROM Notifications
        WHERE notificationId = @notificationId
      `);
    
    return { success: true };
  }

  async deleteByUserId(userId) {
    const pool = await this.getConnection();
    
    await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query(`
        DELETE FROM Notifications
        WHERE userId = @userId
      `);
    
    return { success: true };
  }

  async deleteOldNotifications(daysOld = 30) {
    const pool = await this.getConnection();
    
    const result = await pool.request()
      .input('daysOld', this.sql.Int, daysOld)
      .query(`
        DELETE FROM Notifications
        WHERE createdDate < DATEADD(day, -@daysOld, GETDATE())
      `);
    
    return { deletedCount: result.rowsAffected[0] };
  }

  mapToEntity(row) {
    return new Notification({
      notificationId: row.notificationId,
      userId: row.userId,
      type: row.type,
      title: row.title,
      message: row.message,
      relatedId: row.relatedId,
      relatedType: row.relatedType,
      isRead: row.isRead === 1 || row.isRead === true,
      readDate: row.readDate,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdDate: row.createdDate,
      createdBy: row.createdBy
    });
  }
}

module.exports = MSSQLNotificationRepository;
