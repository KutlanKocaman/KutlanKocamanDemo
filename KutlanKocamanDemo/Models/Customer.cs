using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel;
using Microsoft.AspNetCore.Identity;

namespace KutlanKocamanDemo.Models
{
    public class Customer
    {
        [DisplayName("Customer ID")]
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CustomerId { get; set; }

        [DisplayName("First Name")]
        [StringLength(30, MinimumLength = 1)]
        [Required]
        public string FirstName { get; set; }

        [DisplayName("Last Name")]
        [StringLength(30, MinimumLength = 1)]
        [Required]
        public string LastName { get; set; }

        [DisplayName("Date of Birth")]
        [DataType(DataType.Date)]
        [Required]
        public DateTime DateOfBirth {get;set;}

        [DisplayName("Address Line 1")]
        [StringLength(30, MinimumLength = 1)]
        [Required]
        public string AddressLine1 { get; set; }

        [DisplayName("Address Line 2")]
        [StringLength(30)]
        public string AddressLine2 { get; set; }

        [DisplayName("Address Line 3")]
        [StringLength(30)]
        public string AddressLine3 { get; set; }

        [DisplayName("Town/City")]
        [StringLength(30)]
        public string Locality { get; set; }

        [DisplayName("County")]
        [StringLength(30, MinimumLength = 1)]
        [Required]
        public string County { get; set; }

        [DisplayName("Postcode")]
        [RegularExpression(@"([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})", ErrorMessage = "Invalid format for a postcode.")]
        [Required]
        public string PostCode { get; set; }

        public IdentityUser Owner { get; set; }
    }
}
