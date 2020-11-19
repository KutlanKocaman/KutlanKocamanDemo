using AutoMapper;
using KutlanKocamanDemo.Dtos;
using KutlanKocamanDemo.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace KutlanKocamanDemo.Profiles
{
    public class KnuthMorrisPrattProfile : Profile
    {
        public KnuthMorrisPrattProfile()
        {
            CreateMap<KnuthMorrisPrattInput, KnuthMorrisPrattReadDto>().ReverseMap();
            CreateMap<KnuthMorrisPrattUpdateDto, KnuthMorrisPrattInput>();
        }
    }
}
