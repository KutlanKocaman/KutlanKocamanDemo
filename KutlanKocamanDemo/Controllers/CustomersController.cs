using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using KutlanKocamanDemo.Data;
using KutlanKocamanDemo.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using SendGrid.Helpers.Errors.Model;

namespace KutlanKocamanDemo.Controllers
{
    public class CustomersController : Controller
    {
        private readonly ApplicationDbContext _context;
        private UserManager<IdentityUser> _userManager;
        private int _customerCountLimit = 5;

        public CustomersController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: Customers
        public async Task<IActionResult> Index()
        {
            var result = _context.Customers
                .Where(c => c.Owner.Id.Equals(_userManager.GetUserId(User))) //Return only customers owned by this user.
                .OrderBy(c => c.LastName);

            return View(await result.ToListAsync());
        }

        // GET: Customers/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            //Can only view customers owned by the current user.
            var customer = await GetCustomerById((int)id);
            if (customer == null)
            {
                return NotFound();
            }

            return View(customer);
        }

        // GET: Customers/Create
        public IActionResult Create()
        {
            ViewData["CustomerLimitReached"] = GetCustomerCount().Result >= _customerCountLimit;
            ViewData["CustomerLimit"] = _customerCountLimit;

            return View();
        }

        // POST: Customers/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("CustomerId,FirstName,LastName,DateOfBirth,AddressLine1,AddressLine2,AddressLine3,Locality,County,PostCode")] Customer customer)
        {
            //Check that the user has not reached their customer limit.
            int customerCount = await GetCustomerCount();
            if (customerCount >= _customerCountLimit)
            {
                return StatusCode(403, "Customer limit reached");
            }

            if (ModelState.IsValid)
            {
                customer.Owner = await _userManager.GetUserAsync(User); //The owner of customer will be the current user.
                _context.Add(customer);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(customer);
        }

        // GET: Customers/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }
            
            //The customer must be owned by the current user.
            var customer = await GetCustomerById((int)id);
            if (customer == null)
            {
                return NotFound();
            }

            return View(customer);
        }

        // POST: Customers/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("CustomerId,FirstName,LastName,DateOfBirth,AddressLine1,AddressLine2,AddressLine3,Locality,County,PostCode")] Customer customer)
        {
            if (id != customer.CustomerId)
            {
                return NotFound();
            }

            //The customer must exist and this user must be the owner.
            if (!CustomerExistsForUser(customer.CustomerId))
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(customer);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CustomerExistsForUser(customer.CustomerId))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction("Details", new { id = customer.CustomerId });
            }
            return View(customer);
        }

        // POST: Customers/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            //The customer must exist and this user must be the owner.
            var customer = await GetCustomerById(id);
            if (customer == null)
            {
                return NotFound();
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool CustomerExistsForUser(int id)
        {
            return _context.Customers.Any(e => e.CustomerId == id && e.Owner.Id == _userManager.GetUserId(User));
        }

        private async Task<Customer> GetCustomerById(int id)
        {
            return await _context.Customers
                .Where(c => c.Owner.Id.Equals(_userManager.GetUserId(User))) //The current user must be the owner of the customer.
                .FirstOrDefaultAsync(m => m.CustomerId == id);
        }

        private async Task<int> GetCustomerCount()
        {
            return await _context.Customers
                .Where(c => c.Owner.Id.Equals(_userManager.GetUserId(User))) //Owned by this user.
                .AsNoTracking()
                .CountAsync();
        }
    }
}
