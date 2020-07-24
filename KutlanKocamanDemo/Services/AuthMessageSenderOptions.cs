using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace KutlanKocamanDemo.Services
{
    public class AuthMessageSenderOptions
    {
        public string SendGridFromName { get; set; }
        public string SendGridFromEmail { get; set; }
        public string SendGridApiKey { get; set; }
    }
}
