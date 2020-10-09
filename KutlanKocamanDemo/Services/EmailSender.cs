using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using System;
using System.IO;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace KutlanKocamanDemo.Services
{
    public class EmailSender
    {
        public AuthMessageSenderOptions Options { get; }
        private IWebHostEnvironment _webHostEnvironment;

        public EmailSender(IOptions<AuthMessageSenderOptions> optionsAccessor,
            IWebHostEnvironment webHostEnvironment)
        {
            //Get options from config.
            Options = optionsAccessor.Value;
            _webHostEnvironment = webHostEnvironment;
        }

        public Task SendAccountConfirmEmail(string recipient, string callbackUrl)
        {
            var client = new SendGridClient(Options.SendGridApiKey);

            string htmlMessage =
                @"<div align=""center""><img height=""120"" src=""cid:KutlanCoder"" /></div>
                <br />
                <div style=""font-family: &quot;Segoe UI&quot;; text-align: center"">Thanks for registering with KutlanCoder.com.</div>
                <div style=""font-family: &quot;Segoe UI&quot;; text-align: center"">To confirm your email and activate your account, please click the link below.</div>
                <br />
                <div align=""center"" bgcolor=""#1338d3"" style=""border-radius:6px; font-size:16px; text-align:center; background-color:inherit;"">
                  <a href={0}><img height=""40"" src=""cid:ConfirmButton"" /></a>
                </div>";
            var msg = new SendGridMessage()
            {
                From = new EmailAddress(Options.SendGridFromEmail, Options.SendGridFromName),
                Subject = "Confirm your email",
                PlainTextContent = $"Thanks for registering with KutlanCoder.com. Please confirm your email address using the following link. {HtmlEncoder.Default.Encode(callbackUrl)}",
                HtmlContent = String.Format(htmlMessage, HtmlEncoder.Default.Encode(callbackUrl))
            };
            msg.AddTo(new EmailAddress(recipient));

            //Add KutlanCoder logo inline attachment with a content id, in order to embed the image into the email.
            Byte[] bytes = File.ReadAllBytes(Path.Combine(_webHostEnvironment.WebRootPath, "Images\\KutlanCoder.png"));
            String base64 = Convert.ToBase64String(bytes);
            msg.AddAttachment(new Attachment()
            {
                Content = base64,
                Type = "image/png",
                Filename = "KutlanCoder.png",
                Disposition = "inline",
                ContentId = "KutlanCoder" //Must match the cid in the html.
            });

            //Add "Confirm Your Email" button inline attachment with a content id, in order to embed the image into the email.
            bytes = File.ReadAllBytes(Path.Combine(_webHostEnvironment.WebRootPath, "Images\\ConfirmYourEmailButton.png"));
            base64 = Convert.ToBase64String(bytes);
            msg.AddAttachment(new Attachment()
            {
                Content = base64,
                Type = "image/png",
                Filename = "ConfirmYourEmailButton.png",
                Disposition = "inline",
                ContentId = "ConfirmButton" //Must match the cid in the html.
            });

            // Disable click tracking.
            msg.SetClickTracking(false, false);

            return client.SendEmailAsync(msg);
        }

        public Task SendResetPasswordEmail(string recipient, string callbackUrl)
        {
            var client = new SendGridClient(Options.SendGridApiKey);

            string htmlMessage =
                @"<div align=""center""><img height=""120"" src=""cid:KutlanCoder"" /></div>
                <br />
                <div style=""font-family: &quot;Segoe UI&quot;; text-align: center"">You can reset your password by clicking the link below.</div>
                <div style=""font-family: &quot;Segoe UI&quot;; text-align: center"">If you didn't request a password reset, please discard this email.</div>
                <br />
                <div align=""center"" bgcolor=""#1338d3"" style=""border-radius:6px; font-size:16px; text-align:center; background-color:inherit;"">
                  <a href={0}><img height=""40"" src=""cid:ResetButton"" /></a>
                </div>";
            var msg = new SendGridMessage()
            {
                From = new EmailAddress(Options.SendGridFromEmail, Options.SendGridFromName),
                Subject = "Reset Your Password",
                PlainTextContent = $"You can reset your password by clicking the following link. {HtmlEncoder.Default.Encode(callbackUrl)} If you didn't request a password reset, please discard this email.",
                HtmlContent = String.Format(htmlMessage, HtmlEncoder.Default.Encode(callbackUrl))
            };
            msg.AddTo(new EmailAddress(recipient));

            //Add KutlanCoder logo inline attachment with a content id, in order to embed the image into the email.
            Byte[] bytes = File.ReadAllBytes(Path.Combine(_webHostEnvironment.WebRootPath, "Images\\KutlanCoder.png"));
            String base64 = Convert.ToBase64String(bytes);
            msg.AddAttachment(new Attachment()
            {
                Content = base64,
                Type = "image/png",
                Filename = "KutlanCoder.png",
                Disposition = "inline",
                ContentId = "KutlanCoder" //Must match the cid in the html.
            });

            //Add "Confirm Your Email" button inline attachment with a content id, in order to embed the image into the email.
            bytes = File.ReadAllBytes(Path.Combine(_webHostEnvironment.WebRootPath, "Images\\ResetYourPasswordButton.png"));
            base64 = Convert.ToBase64String(bytes);
            msg.AddAttachment(new Attachment()
            {
                Content = base64,
                Type = "image/png",
                Filename = "ResetYourPasswordButton.png",
                Disposition = "inline",
                ContentId = "ResetButton" //Must match the cid in the html.
            });

            // Disable click tracking.
            msg.SetClickTracking(false, false);

            return client.SendEmailAsync(msg);
        }
    }
}
