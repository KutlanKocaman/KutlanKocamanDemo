--This script sets up the contained database, user and role.
--Enter a password for the user, then run the script.

USE [master]

--Allow contained databases.
EXEC sp_configure 'contained database authentication', 1;
GO
RECONFIGURE;
GO

--Create the database.
IF NOT EXISTS (SELECT  1 FROM sys.databases WHERE [name] = 'KutlanKocamanDemo')
BEGIN
	CREATE DATABASE [KutlanKocamanDemo]
	CONTAINMENT = PARTIAL
END
GO

USE [KutlanKocamanDemo]

--Create KKDemoUser.
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'KKDemoUser' AND type = 'S')
BEGIN
	CREATE USER [KKDemoUser] WITH PASSWORD = ''
END

--Create KKDemoRole.
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'KKDemoRole' AND type = 'R')
BEGIN
	CREATE ROLE [KKDemoRole]
END

--Add KKDemoUser to KKDemoRole.
ALTER ROLE [KKDemoRole] ADD MEMBER [KKDemoUser]