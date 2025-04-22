CREATE DATABASE DummyAzureDB;
GO

USE DummyAzureDB;

-- Create BusinessUnits table
CREATE TABLE BusinessUnits (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL
);

-- Insert dummy data into BusinessUnits
INSERT INTO BusinessUnits (name) VALUES ('CCS'), ('JMSL');

-- Create UseCases table
CREATE TABLE UseCases (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL,
    businessUnitId INT NOT NULL FOREIGN KEY REFERENCES BusinessUnits(id)
);

-- Insert dummy data into UseCases
INSERT INTO UseCases (name, businessUnitId) VALUES 
('Distribution Efficiency', 1),
('MT Promo', 1),
('Dry Sales', 2);

-- Create Metrics table
CREATE TABLE Metrics (
    rowKey NVARCHAR(50) PRIMARY KEY,
    value NVARCHAR(50),
    mode NVARCHAR(50)
);

-- Insert dummy data into Metrics
INSERT INTO Metrics (rowKey, value, mode) VALUES
-- Mode 1 data
('alertTime', '15:42 UTC', 'mode1'),
('runtimeCount', '142', 'mode1'),
('alertKeeper', 'Kalpa (kalpa@keells.com)', 'mode1'),
('kstest', '0.42', 'mode1'),
('wasserstein', '1.85', 'mode1'),
('mseRef', '0.12', 'mode1'),
('mseCurrent', '0.18', 'mode1'),
('status', 'Warning', 'mode1'),
('accuracy', '0.95', 'mode1'),
('precision', '0.93', 'mode1'),
('recall', '0.91', 'mode1'),
('f1', '0.92', 'mode1'),
('mape', '0.12', 'mode1'),
('r2', '0.89', 'mode1'),
('drift_score', '0.15', 'mode1'),
('data_quality', '0.98', 'mode1'),

-- Mode 2 data
('alertTime', '09:15 UTC', 'mode2'),
('runtimeCount', '87', 'mode2'),
('alertKeeper', 'Nimal (nimal@keells.com)', 'mode2'),
('kstest', '0.38', 'mode2'),
('wasserstein', '1.42', 'mode2'),
('mseRef', '0.15', 'mode2'),
('mseCurrent', '0.22', 'mode2'),
('status', 'Normal', 'mode2'),

-- Mode 3 data
('alertTime', '11:30 UTC', 'mode3'),
('runtimeCount', '56', 'mode3'),
('alertKeeper', 'Sunil (sunil@keells.com)', 'mode3'),
('kstest', '0.51', 'mode3'),
('wasserstein', '1.78', 'mode3'),
('mseRef', '0.09', 'mode3'),
('mseCurrent', '0.14', 'mode3'),
('status', 'Critical', 'mode3'),

-- Mode 4 data
('alertTime', '14:05 UTC', 'mode4'),
('runtimeCount', '112', 'mode4'),
('alertKeeper', 'Kamal (kamal@keells.com)', 'mode4'),
('kstest', '0.29', 'mode4'),
('wasserstein', '1.12', 'mode4'),
('mseRef', '0.11', 'mode4'),
('mseCurrent', '0.13', 'mode4'),
('status', 'Warning', 'mode4');

-- Create Errors table
CREATE TABLE Errors (
    id INT PRIMARY KEY IDENTITY(1,1),
    timePeriod NVARCHAR(50),
    meanPrediction FLOAT,
    error FLOAT,
    exceedsThreshold BIT
);

-- Create XAIResults table
CREATE TABLE XAIResults (
    id INT PRIMARY KEY IDENTITY(1,1),
    mode NVARCHAR(50),
    precisionChange FLOAT,
    recallChange FLOAT,
    f1Change FLOAT,
    confusionMatrix NVARCHAR(MAX)
);

-- Insert dummy XAI data
INSERT INTO XAIResults (mode, precisionChange, recallChange, f1Change, confusionMatrix) VALUES
('mode1', -8.2, -8.7, -8.0, '{"classA": {"predictedAsA": 85, "predictedAsB": 12}, "classB": {"predictedAsA": 8, "predictedAsB": 92}}'),
('mode1', 0.02, 0.03, 0.025, '{"classA": {"predictedAsA": 450, "predictedAsB": 50}, "classB": {"predictedAsA": 30, "predictedAsB": 470}}');

-- Enhanced error data with percentage error
INSERT INTO Errors (timePeriod, meanPrediction, error, exceedsThreshold, mode) VALUES
('2025-01', 1250, -90, 1, 'mode1'),
('2025-01', 980, -65, 1, 'mode1'),
('2025-02', 1100, -42, 0, 'mode1'),
('2025-02', 870, -120, 1, 'mode1'),
('2025-03', 950, -30, 0, 'mode1'),
('2025-03', 1100, -45, 0, 'mode1'),
('2025-04', 1300, -150, 1, 'mode1'),
('2025-04', 1050, -75, 1, 'mode1'),
('2025-05', 1150, -55, 0, 'mode1');
