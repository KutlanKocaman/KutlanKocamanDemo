using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using KutlanKocamanDemo.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace KutlanKocamanDemo.Areas.Identity.Pages.Account.Manage
{
    public class DeletePersonalDataModel : PageModel
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly ILogger<DeletePersonalDataModel> _logger;
        private readonly ApplicationDbContext _dbContext;

        public DeletePersonalDataModel(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            ILogger<DeletePersonalDataModel> logger,
            ApplicationDbContext dbContext)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = logger;
            _dbContext = dbContext;
        }

        [BindProperty]
        public InputModel Input { get; set; }

        public class InputModel
        {
            [Required]
            [DataType(DataType.Password)]
            public string Password { get; set; }
        }

        public bool RequirePassword { get; set; }

        public async Task<IActionResult> OnGet()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Unable to load user with ID '{_userManager.GetUserId(User)}'.");
            }

            RequirePassword = await _userManager.HasPasswordAsync(user);
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Unable to load user with ID '{_userManager.GetUserId(User)}'.");
            }

            RequirePassword = await _userManager.HasPasswordAsync(user);
            if (RequirePassword)
            {
                if (!await _userManager.CheckPasswordAsync(user, Input.Password))
                {
                    ModelState.AddModelError(string.Empty, "Incorrect password.");
                    return Page();
                }
            }

            var userId = await _userManager.GetUserIdAsync(user);

            //Delete the user and all related information in a single database transaction.
            using (var transaction = _dbContext.Database.BeginTransaction())
            {
                try
                {
                    //Delete KnuthMorrisPratt input sets owned by the user.
                    var knuthMorrisPrattInputs =
                        from input in _dbContext.KnuthMorrisPrattInputs
                        join owner in _dbContext.KnuthMorrisPrattInputOwners on input.KnuthMorrisPrattInputId equals owner.KnuthMorrisPrattInputId into inputs
                        from i in inputs.DefaultIfEmpty()
                        where i.AspNetUserId == _userManager.GetUserId(User)
                        select input;
                    _dbContext.KnuthMorrisPrattInputs.RemoveRange(knuthMorrisPrattInputs);
                    _dbContext.SaveChanges();

                    //Now delete the user.
                    var result = await _userManager.DeleteAsync(user);
                    if (result.Succeeded)
                    {
                        transaction.Commit();

                        await _signInManager.SignOutAsync();

                        _logger.LogInformation("User with ID '{UserId}' deleted themselves.", userId);

                        return Redirect("~/");
                    }
                    else
                    {
                        throw new Exception();
                    }
                }
                catch (Exception)
                {
                    transaction.Rollback();
                    throw new InvalidOperationException($"Unexpected error occurred deleting user with ID '{userId}'.");
                }
            }
        }
    }
}
