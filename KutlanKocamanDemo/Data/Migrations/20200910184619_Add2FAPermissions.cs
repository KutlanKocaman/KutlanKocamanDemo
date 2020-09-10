using Microsoft.EntityFrameworkCore.Migrations;

namespace KutlanKocamanDemo.Data.Migrations
{
    public partial class Add2FAPermissions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("GRANT INSERT ON dbo.AspNetUserTokens TO [KKDemoRole]");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("REVOKE INSERT ON dbo.AspNetUserTokens TO [KKDemoRole]");
        }
    }
}
