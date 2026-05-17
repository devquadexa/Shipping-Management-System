-- Create notifications table for SQL Server
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
  CREATE TABLE notifications (
    notificationId VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    relatedId VARCHAR(50),
    isRead BIT DEFAULT 0,
    createdDate DATETIME DEFAULT GETDATE(),
    readDate DATETIME NULL,
    
    FOREIGN KEY (userId) REFERENCES Users(UserId) ON DELETE CASCADE
  );
  
  -- Create indexes
  CREATE INDEX idx_userId ON notifications(userId);
  CREATE INDEX idx_isRead ON notifications(isRead);
  CREATE INDEX idx_userId_isRead ON notifications(userId, isRead);
  CREATE INDEX idx_createdDate ON notifications(createdDate);
  
  PRINT 'notifications table created successfully';
END
ELSE
BEGIN
  PRINT 'notifications table already exists';
END;
