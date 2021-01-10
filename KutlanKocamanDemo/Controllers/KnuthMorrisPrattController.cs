using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using KutlanKocamanDemo.Data;
using KutlanKocamanDemo.Dtos;
using KutlanKocamanDemo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KutlanKocamanDemo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [ValidateAntiForgeryToken]
    public class KnuthMorrisPrattController : ControllerBase
    {
        private ApplicationDbContext _dbContext;
        private UserManager<IdentityUser> _userManager;
        private IMapper _mapper;

        public KnuthMorrisPrattController(ApplicationDbContext dbContext, UserManager<IdentityUser> userManager, IMapper mapper)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _mapper = mapper;
        }

        [HttpGet]
        [AllowAnonymous]
        public ActionResult<IEnumerable<KnuthMorrisPrattReadDto>> Get()
        {
            var result = from input in _dbContext.KnuthMorrisPrattInputs
                         join owner in _dbContext.KnuthMorrisPrattInputOwners on input.KnuthMorrisPrattInputId equals owner.KnuthMorrisPrattInputId into inputs
                         from i in inputs.DefaultIfEmpty()
                         where i.AspNetUserId == null || (i.AspNetUserId == _userManager.GetUserId(User))
                         select new KnuthMorrisPrattReadDto
                         {
                             Id = input.KnuthMorrisPrattInputId,
                             Name = input.Name,
                             Needle = input.Needle,
                             Haystack = input.Haystack,
                             CaseSensitive = input.CaseSensitive,
                             IsOwnedByUser = i.AspNetUserId != null
                         };

            return Ok(result.ToList());
        }

        [HttpGet("{id}")]
        public ActionResult<KnuthMorrisPrattReadDto> GetById(int id)
        {
            var result = (from input in _dbContext.KnuthMorrisPrattInputs
                         join owner in _dbContext.KnuthMorrisPrattInputOwners on input.KnuthMorrisPrattInputId equals owner.KnuthMorrisPrattInputId into inputs
                         from i in inputs.DefaultIfEmpty()
                         where (i.AspNetUserId == null || (i.AspNetUserId == _userManager.GetUserId(User))) && i.KnuthMorrisPrattInputId == id
                         select new KnuthMorrisPrattReadDto
                         {
                             Id = input.KnuthMorrisPrattInputId,
                             Name = input.Name,
                             Needle = input.Needle,
                             Haystack = input.Haystack,
                             CaseSensitive = input.CaseSensitive,
                             IsOwnedByUser = i.AspNetUserId != null
                         }).FirstOrDefault();

            return Ok(result);
        }

        [HttpPost]
        public ActionResult Create([FromBody] KnuthMorrisPrattUpdateDto knuthMorrisPrattUpdateDto)
        {
            var knuthMorrisPrattInput = _mapper.Map<KnuthMorrisPrattInput>(knuthMorrisPrattUpdateDto);

            //Check that the user is not trying to create an input set with a name that already exists for the user.
            var inputSetWithNameExists = (from input in _dbContext.KnuthMorrisPrattInputs
                join owner in _dbContext.KnuthMorrisPrattInputOwners on input.KnuthMorrisPrattInputId equals owner.KnuthMorrisPrattInputId into inputs
                from i in inputs
                where i.AspNetUserId == _userManager.GetUserId(User) && input.Name == knuthMorrisPrattInput.Name
                select i).Any();

            if (inputSetWithNameExists)
            {
                return StatusCode(405); //Wrong method for updating an existing input set - use PUT.
            }

            //Check that the user does not already have 10 input sets saved.
            var kmpInputCount = _dbContext.KnuthMorrisPrattInputOwners.Where(o => o.AspNetUserId == _userManager.GetUserId(User)).Count();
            if (kmpInputCount >= 10)
            {
                return StatusCode(403);
            }

            //Try to add the input set.
            var transaction = _dbContext.Database.BeginTransaction();
            try
            {
                _dbContext.KnuthMorrisPrattInputs.Add(knuthMorrisPrattInput);
                _dbContext.SaveChanges();

                _dbContext.KnuthMorrisPrattInputOwners.Add(new KnuthMorrisPrattInputOwner()
                {
                    AspNetUserId = _userManager.GetUserId(User),
                    KnuthMorrisPrattInputId = knuthMorrisPrattInput.KnuthMorrisPrattInputId
                });
                _dbContext.SaveChanges();

                transaction.Commit();
            }
            catch
            {
                return StatusCode(500);
            }

            var knuthMorrisPrattReadDto = _mapper.Map<KnuthMorrisPrattReadDto>(knuthMorrisPrattInput);
            knuthMorrisPrattReadDto.IsOwnedByUser = true;

            return CreatedAtAction(nameof(GetById), knuthMorrisPrattReadDto);
        }

        [HttpPut("{id}")]
        public ActionResult Update(int id, [FromBody] KnuthMorrisPrattUpdateDto knuthMorrisPrattUpdateDto)
        {
            if (!IsInputSetOwnedByUser(id))
            {
                return Forbid();
            }

            var existingKmpInput = _dbContext.KnuthMorrisPrattInputs.First(k => k.KnuthMorrisPrattInputId == id);
            _dbContext.Entry(existingKmpInput).CurrentValues.SetValues(knuthMorrisPrattUpdateDto);
            _dbContext.SaveChanges();
            
            return Ok();
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(int id)
        {
            if (!IsInputSetOwnedByUser(id))
            {
                return Forbid();
            }

            var kmpInput = _dbContext.KnuthMorrisPrattInputs.First(k => k.KnuthMorrisPrattInputId == id);
            _dbContext.KnuthMorrisPrattInputs.Remove(kmpInput);
            _dbContext.SaveChanges();

            return Ok();
        }

        private bool IsInputSetOwnedByUser(int KnuthMorrisPrattInputId)
        {
            if (_dbContext.KnuthMorrisPrattInputOwners.Any(o => o.KnuthMorrisPrattInputId == KnuthMorrisPrattInputId && o.AspNetUserId == _userManager.GetUserId(User)))
            {
                return true;
            }
            return false;
        }
    }
}
