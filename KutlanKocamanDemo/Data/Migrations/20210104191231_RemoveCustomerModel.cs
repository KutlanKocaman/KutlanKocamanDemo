using Microsoft.EntityFrameworkCore.Migrations;

namespace KutlanKocamanDemo.Data.Migrations
{
    public partial class RemoveCustomerModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("Customers", "dbo");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
