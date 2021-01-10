using System;
using System.Collections.Generic;
using System.Text;
using KutlanKocamanDemo.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace KutlanKocamanDemo.Data
{
    public class ApplicationDbContext : IdentityDbContext
    {
        public DbSet<KnuthMorrisPrattInput> KnuthMorrisPrattInputs { get; set; }
        public DbSet<KnuthMorrisPrattInputOwner> KnuthMorrisPrattInputOwners { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<KnuthMorrisPrattInputOwner>().HasKey(p => new { p.AspNetUserId, p.KnuthMorrisPrattInputId });
            
            base.OnModelCreating(modelBuilder);
        }
    }
}
