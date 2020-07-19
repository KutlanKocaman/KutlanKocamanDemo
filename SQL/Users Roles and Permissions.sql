--This script sets up the contained database user.
--Enter a password for the user, then run the script.
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

--Grant permissions to KKDemoRole.
GRANT SELECT ON dbo.AspNetUsers TO [KKDemoRole]
GRANT INSERT ON dbo.AspNetUsers TO [KKDemoRole]
GRANT UPDATE ON dbo.AspNetUsers TO [KKDemoRole]
GRANT SELECT ON dbo.AspNetUserClaims TO [KKDemoRole]