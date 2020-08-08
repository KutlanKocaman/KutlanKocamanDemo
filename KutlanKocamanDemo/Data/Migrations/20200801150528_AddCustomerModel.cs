using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KutlanKocamanDemo.Data.Migrations
{
    public partial class AddCustomerModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    CustomerId = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(maxLength: 30, nullable: false),
                    LastName = table.Column<string>(maxLength: 30, nullable: false),
                    DateOfBirth = table.Column<DateTime>(nullable: false),
                    AddressLine1 = table.Column<string>(maxLength: 30, nullable: false),
                    AddressLine2 = table.Column<string>(maxLength: 30, nullable: true),
                    AddressLine3 = table.Column<string>(maxLength: 30, nullable: true),
                    Locality = table.Column<string>(maxLength: 30, nullable: true),
                    County = table.Column<string>(maxLength: 30, nullable: false),
                    PostCode = table.Column<string>(maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.CustomerId);
                });

            migrationBuilder.Sql("GRANT SELECT ON dbo.Customers TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT INSERT ON dbo.Customers TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT UPDATE ON dbo.Customers TO [KKDemoRole]");
            migrationBuilder.Sql("GRANT DELETE ON dbo.Customers TO [KKDemoRole]");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Customers");
        }
    }
}
