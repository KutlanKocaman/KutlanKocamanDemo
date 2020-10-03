using Microsoft.EntityFrameworkCore.Migrations;

namespace KutlanKocamanDemo.Data.Migrations
{
    public partial class EnableAccountDelete : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("GRANT DELETE ON dbo.AspNetUsers TO [KKDemoRole]");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("REVOKE DELETE ON dbo.AspNetUsers TO [KKDemoRole]");
        }
    }
}
