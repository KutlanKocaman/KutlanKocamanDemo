﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KutlanKocamanDemo.Controllers
{
    [AllowAnonymous]
    public class SPAController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
