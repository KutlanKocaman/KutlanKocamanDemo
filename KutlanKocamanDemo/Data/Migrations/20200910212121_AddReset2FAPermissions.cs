using Microsoft.EntityFrameworkCore.Migrations;

namespace KutlanKocamanDemo.Data.Migrations
{
    public partial class AddReset2FAPermissions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("GRANT UPDATE ON dbo.AspNetUserTokens TO [KKDemoRole]");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("REVOKE UPDATE ON dbo.AspNetUserTokens TO [KKDemoRole]");
        }
    }
}
