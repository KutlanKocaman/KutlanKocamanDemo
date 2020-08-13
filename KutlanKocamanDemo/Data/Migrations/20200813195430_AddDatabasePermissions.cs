using Microsoft.EntityFrameworkCore.Migrations;

namespace KutlanKocamanDemo.Data.Migrations
{
    public partial class AddDatabasePermissions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("GRANT SELECT ON dbo.AspNetUsers TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT INSERT ON dbo.AspNetUsers TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT UPDATE ON dbo.AspNetUsers TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT SELECT ON dbo.AspNetUserClaims TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT SELECT ON dbo.AspNetUserLogins TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT INSERT ON dbo.AspNetUserLogins TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT SELECT ON dbo.AspNetUserTokens TO [KKDemoRole]");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("REVOKE SELECT ON dbo.AspNetUsers TO [KKDemoRole]");
            migrationBuilder.Sql("REVOKE INSERT ON dbo.AspNetUsers TO [KKDemoRole]");
            migrationBuilder.Sql("REVOKE UPDATE ON dbo.AspNetUsers TO [KKDemoRole]");
            migrationBuilder.Sql("REVOKE SELECT ON dbo.AspNetUserClaims TO [KKDemoRole]");
            migrationBuilder.Sql("REVOKE SELECT ON dbo.AspNetUserLogins TO [KKDemoRole]");
            migrationBuilder.Sql("REVOKE INSERT ON dbo.AspNetUserLogins TO [KKDemoRole]");
            migrationBuilder.Sql("REVOKE SELECT ON dbo.AspNetUserTokens TO [KKDemoRole]");
        }
    }
}
