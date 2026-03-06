-- Create PayItemTemplates table for default pay items per category
CREATE TABLE PayItemTemplates (
    templateId INT IDENTITY(1,1) PRIMARY KEY,
    shipmentCategory NVARCHAR(50) NOT NULL,
    itemName NVARCHAR(200) NOT NULL,
    itemOrder INT NOT NULL DEFAULT 0,
    isActive BIT NOT NULL DEFAULT 1,
    createdDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_PayItemTemplate UNIQUE (shipmentCategory, itemName)
);

-- Insert default pay items for LCL
INSERT INTO PayItemTemplates (shipmentCategory, itemName, itemOrder) VALUES
('LCL', 'Port Charges', 1),
('LCL', 'Documentation Fee', 2),
('LCL', 'Handling Charges', 3),
('LCL', 'Customs Clearance', 4),
('LCL', 'Delivery Charges', 5),
('LCL', 'Storage Charges', 6);

-- Insert default pay items for FCL
INSERT INTO PayItemTemplates (shipmentCategory, itemName, itemOrder) VALUES
('FCL', 'Container Charges', 1),
('FCL', 'Port Charges', 2),
('FCL', 'Documentation Fee', 3),
('FCL', 'Customs Clearance', 4),
('FCL', 'Transport Charges', 5),
('FCL', 'Detention Charges', 6),
('FCL', 'Demurrage Charges', 7);

-- Insert default pay items for Air Freight
INSERT INTO PayItemTemplates (shipmentCategory, itemName, itemOrder) VALUES
('Air Freight', 'Air Freight Charges', 1),
('Air Freight', 'Airport Handling', 2),
('Air Freight', 'Documentation Fee', 3),
('Air Freight', 'Customs Clearance', 4),
('Air Freight', 'Delivery Charges', 5),
('Air Freight', 'Storage Charges', 6);

-- Insert default pay items for BOI
INSERT INTO PayItemTemplates (shipmentCategory, itemName, itemOrder) VALUES
('BOI', 'BOI Processing Fee', 1),
('BOI', 'Port Charges', 2),
('BOI', 'Documentation Fee', 3),
('BOI', 'Customs Clearance', 4),
('BOI', 'Transport Charges', 5),
('BOI', 'Handling Charges', 6);

-- Insert default pay items for Vehicle
INSERT INTO PayItemTemplates (shipmentCategory, itemName, itemOrder) VALUES
('Vehicle', 'Vehicle Import Fee', 1),
('Vehicle', 'Port Charges', 2),
('Vehicle', 'Documentation Fee', 3),
('Vehicle', 'Customs Clearance', 4),
('Vehicle', 'RMV Registration', 5),
('Vehicle', 'Transport Charges', 6),
('Vehicle', 'Inspection Fee', 7);

-- Insert default pay items for TIEP
INSERT INTO PayItemTemplates (shipmentCategory, itemName, itemOrder) VALUES
('TIEP', 'TIEP Processing Fee', 1),
('TIEP', 'Port Charges', 2),
('TIEP', 'Documentation Fee', 3),
('TIEP', 'Customs Clearance', 4),
('TIEP', 'Bond Charges', 5),
('TIEP', 'Transport Charges', 6);

-- Modify Bills table to add reference to template (optional)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'shipmentCategory')
BEGIN
    ALTER TABLE Bills ADD shipmentCategory NVARCHAR(50);
END

-- Modify PayItems table to track if it's a custom item
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItems') AND name = 'isCustomItem')
BEGIN
    ALTER TABLE PayItems ADD isCustomItem BIT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItems') AND name = 'actualCost')
BEGIN
    ALTER TABLE PayItems ADD actualCost DECIMAL(18, 2) NOT NULL DEFAULT 0;
END

-- Add index for better performance
CREATE INDEX IX_PayItemTemplates_Category ON PayItemTemplates(shipmentCategory, itemOrder);

PRINT 'Pay Items Settings tables created and default data inserted successfully!';
