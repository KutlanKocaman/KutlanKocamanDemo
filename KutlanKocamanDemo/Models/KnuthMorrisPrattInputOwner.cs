using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace KutlanKocamanDemo.Models
{
    public class KnuthMorrisPrattInputOwner
    {
        [Required]
        [MaxLength(450)]
        public string AspNetUserId { get; set; }

        [Required]
        public int KnuthMorrisPrattInputId { get; set; }
    }
}
