using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using KutlanKocamanDemo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KutlanKocamanDemo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private UserManager<IdentityUser> _userManager;

        public AuthController(UserManager<IdentityUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet]
        [AllowAnonymous]
        public ActionResult<AuthInfo> AmILoggedIn()
        {
            return Ok(new AuthInfo
            {
                Authenticated = _userManager.GetUserId(User) != null
            });
        }

    }
}
