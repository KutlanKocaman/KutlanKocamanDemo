using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace KutlanKocamanDemo.Dtos
{
    public class KnuthMorrisPrattReadDto
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Needle { get; set; }

        public string Haystack { get; set; }

        public bool CaseSensitive { get; set; }

        public bool IsOwnedByUser { get; set; }
    }
}
