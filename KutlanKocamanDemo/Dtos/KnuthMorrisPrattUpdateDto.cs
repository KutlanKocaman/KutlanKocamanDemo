using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace KutlanKocamanDemo.Dtos
{
    public class KnuthMorrisPrattUpdateDto
    {
        public string Name { get; set; }

        public string Needle { get; set; }

        public string Haystack { get; set; }

        public bool CaseSensitive { get; set; }
    }
}
