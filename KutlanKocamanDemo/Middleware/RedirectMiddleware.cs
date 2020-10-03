using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace KutlanKocamanDemo.Middleware
{
    public class RedirectMiddleware
    {
        private readonly RequestDelegate _next;

        public RedirectMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            //If the user is trying to get to kutlankocamandemo.azurewebsites.net then redirect them to kutlancoder.com.
            if (httpContext.Request.Host.Value == "kutlankocamandemo.azurewebsites.net")
            {
                httpContext.Response.Redirect("https://www.kutlancoder.com" + httpContext.Request.Path, true);
            }

            await _next(httpContext);
        }
    }
}
