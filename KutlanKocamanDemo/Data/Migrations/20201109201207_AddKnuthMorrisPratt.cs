using Microsoft.EntityFrameworkCore.Migrations;

namespace KutlanKocamanDemo.Data.Migrations
{
    public partial class AddKnuthMorrisPratt : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KnuthMorrisPrattInputOwners",
                columns: table => new
                {
                    AspNetUserId = table.Column<string>(maxLength: 450, nullable: false),
                    KnuthMorrisPrattInputId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KnuthMorrisPrattInputOwners", x => new { x.AspNetUserId, x.KnuthMorrisPrattInputId });
                });

            migrationBuilder.Sql(@"GRANT SELECT ON dbo.KnuthMorrisPrattInputOwners TO KKDemoRole");
            migrationBuilder.Sql(@"GRANT INSERT ON dbo.KnuthMorrisPrattInputOwners TO KKDemoRole");

            migrationBuilder.CreateTable(
                name: "KnuthMorrisPrattInputs",
                columns: table => new
                {
                    KnuthMorrisPrattInputId = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(maxLength: 30, nullable: false),
                    Needle = table.Column<string>(maxLength: 18, nullable: false),
                    Haystack = table.Column<string>(maxLength: 200, nullable: false),
                    CaseSensitive = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KnuthMorrisPrattInputs", x => x.KnuthMorrisPrattInputId);
                });
            
            migrationBuilder.Sql(@"GRANT SELECT ON dbo.KnuthMorrisPrattInputs TO KKDemoRole");
            migrationBuilder.Sql(@"GRANT INSERT ON dbo.KnuthMorrisPrattInputs TO KKDemoRole");
            migrationBuilder.Sql(@"GRANT UPDATE ON dbo.KnuthMorrisPrattInputs TO KKDemoRole");
            migrationBuilder.Sql(@"GRANT DELETE ON dbo.KnuthMorrisPrattInputs TO KKDemoRole");

            migrationBuilder.Sql(@"ALTER TABLE dbo.KnuthMorrisPrattInputOwners
                                    ADD CONSTRAINT FK_KnuthMorrisPrattInputOwners_AspNetUsers_OwnerId FOREIGN KEY (AspNetUserId)
                                        REFERENCES dbo.AspNetUsers (Id)
                                        ON DELETE CASCADE");

            migrationBuilder.Sql(@"ALTER TABLE dbo.KnuthMorrisPrattInputOwners
                                    ADD CONSTRAINT FK_KnuthMorrisPrattInputOwners_KnuthMorrisPrattInputs_KnuthMorrisPrattInputId FOREIGN KEY (KnuthMorrisPrattInputId)
                                        REFERENCES dbo.KnuthMorrisPrattInputs (KnuthMorrisPrattInputId)
                                        ON DELETE CASCADE");

            //Insert example data.
            migrationBuilder.InsertData("KnuthMorrisPrattInputs",
                new[] { "Name", "Needle", "Haystack", "CaseSensitive" },
                new object[] { "Coconut Demo", "coconut", "I like cocoa and coconut flavours", false });

            migrationBuilder.InsertData("KnuthMorrisPrattInputs",
                new[] { "Name", "Needle", "Haystack", "CaseSensitive" },
                new object[] { "Naive Algorithm Worst Case", "aaaaaaaaaaaaaaaaab", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", false });

            migrationBuilder.InsertData("KnuthMorrisPrattInputs",
                new[] { "Name", "Needle", "Haystack", "CaseSensitive" },
                new object[] { "Repeating Pattern", "abcabcd", "abcabcabcabcabcabcdabcabcabcabcabcabcdabcabcabcabcabc", false });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KnuthMorrisPrattInputOwners");

            migrationBuilder.DropTable(
                name: "KnuthMorrisPrattInputs");
        }
    }
}
