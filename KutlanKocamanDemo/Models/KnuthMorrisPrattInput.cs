using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace KutlanKocamanDemo.Models
{
    public class KnuthMorrisPrattInput
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int KnuthMorrisPrattInputId { get; set; }

        [Required]
        [StringLength(30, MinimumLength = 1)]
        public string Name { get; set; }

        [Required]
        [StringLength(18, MinimumLength = 1)]
        public string Needle { get; set; }

        [Required]
        [StringLength(200, MinimumLength = 1)]
        public string Haystack { get; set; }

        [Required]
        public bool CaseSensitive { get; set; }
    }
}
