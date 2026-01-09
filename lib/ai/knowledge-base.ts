// Complete Knowledge Base - All Features, Paths, and Scenarios
// Comprehensive documentation for EventVenue AI Assistant

export interface KnowledgeChunk {
    id: string;
    category: string;
    keywords: string[];
    title: string;
    content: string;
}

export const KNOWLEDGE_BASE: KnowledgeChunk[] = [

    // ============================================================
    // SECTION 1: ABOUT & IDENTITY
    // ============================================================
    {
        id: "about-creator",
        category: "about",
        keywords: ["who created", "who made", "creator", "developer", "pranai", "team", "built by", "who are you", "your creator"],
        title: "Who Created EventVenue",
        content: `EventVenue was created by PRANAI AND HIS TEAM.

I am the EventVenue AI Assistant, here to help you with:
- Booking venues and events
- Managing points and payments
- Understanding all platform features

Ask me anything about EventVenue!`
    },
    {
        id: "about-platform",
        category: "about",
        keywords: ["what is eventvenue", "about platform", "what is this", "tell me about", "platform overview"],
        title: "About EventVenue Platform",
        content: `EventVenue is a multi-vendor venue and event booking platform.

WHAT YOU CAN DO:
- USERS: Book venues, buy event tickets, earn and use points
- VENDORS: List venues, host events, earn money
- ADMINS: Manage the entire platform

KEY FEATURES:
- Points system (2000 free on signup!)
- PayPal payments
- Real reviews and ratings
- Google Maps integration
- Secure booking process`
    },
    {
        id: "about-tech",
        category: "about",
        keywords: ["technology", "tech stack", "built with", "framework", "programming", "stack"],
        title: "Technology Stack",
        content: `EventVenue is built with modern technologies:

FRONTEND:
- Next.js 16 with React 19
- Tailwind CSS 4 for styling
- shadcn/ui components
- TypeScript

BACKEND:
- Spring Boot (Java)
- PostgreSQL database
- JWT Authentication
- RESTful APIs

INTEGRATIONS:
- PayPal for payments
- Google Maps for locations
- Gemini AI for this assistant`
    },

    // ============================================================
    // SECTION 2: USER FEATURES - COMPLETE GUIDE
    // ============================================================

    // --- Getting Started ---
    {
        id: "user-signup",
        category: "user",
        keywords: ["sign up", "register", "create account", "new user", "registration", "join", "get started"],
        title: "How to Sign Up (Register)",
        content: `To create an account on EventVenue:

STEPS:
1. Go to /signup or click "Sign Up"
2. Choose role: USER or VENDOR
3. Enter your email address
4. Create a strong password
5. Fill in your name
6. Click "Sign Up"
7. Check your email for OTP (verification code)
8. Enter the OTP to verify your account
9. Done! You now have 2000 FREE POINTS!

PATH: /signup
BONUS: 2000 points added automatically on signup!`
    },
    {
        id: "user-login",
        category: "user",
        keywords: ["login", "sign in", "log in", "access account", "enter account"],
        title: "How to Log In",
        content: `To log in to your EventVenue account:

STEPS:
1. Go to /login or click "Login"
2. Enter your email address
3. Enter your password
4. Click "Log In"
5. You're in!

FORGOT PASSWORD?
1. Click "Forgot Password" on login page
2. Enter your email
3. Check email for reset link
4. Click link and set new password

PATH: /login`
    },
    {
        id: "user-otp",
        category: "user",
        keywords: ["otp", "verification", "verify email", "code", "one time password", "verify account"],
        title: "OTP Email Verification",
        content: `OTP (One-Time Password) is used to verify your email:

HOW IT WORKS:
- After signup, a 6-digit code is sent to your email
- Enter this code on the verification screen
- Code expires after a few minutes
- If expired, click "Resend OTP"

WHY OTP?
- Confirms your email is valid
- Secures your account
- Prevents fake accounts

If you don't receive OTP:
- Check spam/junk folder
- Wait 1-2 minutes
- Click "Resend OTP"
- Contact pranaib20@gmail.com if issues persist`
    },
    {
        id: "user-dashboard",
        category: "user",
        keywords: ["dashboard", "user dashboard", "my account", "home", "main page", "account home"],
        title: "User Dashboard",
        content: `Your User Dashboard (/user/dashboard) is your control center:

WHAT YOU'LL SEE:
- Your profile info (name, email)
- POINTS BALANCE (how many points you have)
- Quick stats and recent activity
- Navigation to all features

QUICK ACTIONS:
- Buy Credits → Purchase more points
- My Bookings → View all reservations
- Profile → Update your information

PATH: /user/dashboard
ACCESS: Click your profile icon after logging in`
    },
    {
        id: "user-profile",
        category: "user",
        keywords: ["profile", "edit profile", "update info", "change name", "my info", "account settings"],
        title: "Managing Your Profile",
        content: `To view and edit your profile:

PATH: /user/profile

WHAT YOU CAN UPDATE:
- First name and last name
- Phone number
- Profile picture (if available)

WHAT YOU CANNOT CHANGE:
- Email address (this is your account ID)

HOW TO UPDATE:
1. Go to /user/profile
2. Edit the fields you want to change
3. Click "Save" or "Update Profile"
4. Changes are saved immediately`
    },

    // --- Points System (Complete) ---
    {
        id: "points-what",
        category: "points",
        keywords: ["what are points", "points explained", "credits explained", "virtual currency", "point system"],
        title: "What Are Points?",
        content: `Points are EventVenue's virtual currency!

KEY FACTS:
- Points = Money equivalent
- Conversion rate set by admin (typically 1 point = ₹1)
- Use points to pay for bookings
- Combine with PayPal for flexibility

HOW TO GET POINTS:
1. SIGNUP BONUS: 2000 free points on registration!
2. BUY CREDITS: Purchase via PayPal
3. CASHBACK: Earn 5% back on bookings
4. REQUEST: Ask admin for free credits

View balance: /user/dashboard or /user/credits`
    },
    {
        id: "points-buy",
        category: "points",
        keywords: ["buy points", "purchase points", "buy credits", "add points", "get more points", "purchase credits"],
        title: "How to Buy/Purchase Points",
        content: `To buy more points:

PATH: /user/credits or Dashboard → Buy Credits

STEPS:
1. Log in to your account
2. Go to /user/credits
3. Click "Buy Credits Now"
4. Enter amount you want to buy
5. Complete PayPal payment
6. Admin approves your request
7. Points added to your account!

DETAILS:
- Payment: PayPal (secure)
- Processing: Admin approval required
- Time: Usually within 24-48 hours
- Minimum: Check current limits`
    },
    {
        id: "points-request-free",
        category: "points",
        keywords: ["request credits", "free credits", "free points", "ask for points", "request free"],
        title: "How to Request Free Credits",
        content: `You can request free credits from admin:

PATH: /user/credits → "Request Free Credits"

STEPS:
1. Go to /user/credits
2. Click "Request Free Credits"
3. Enter amount you want
4. Write a valid reason (required)
5. Submit request
6. Wait for admin review (24-48 hours)
7. If approved, points added!

TIPS FOR APPROVAL:
- Explain why you need points
- Be reasonable with amount
- First-time users often approved
- Lost points? Mention it in reason`
    },
    {
        id: "points-use",
        category: "points",
        keywords: ["use points", "spend points", "pay with points", "redeem", "payment options"],
        title: "How to Use/Spend Points",
        content: `Use your points when booking:

PAYMENT OPTIONS AT CHECKOUT:
1. FULL POINTS - Pay entire amount with points
2. FULL PAYPAL - Pay everything via PayPal
3. HYBRID - Use some points + pay rest with PayPal

HOW TO USE:
1. Select venue/event and proceed to book
2. At payment step, see your points balance
3. Choose "Pay with Points" or select hybrid
4. Confirm booking
5. Points deducted automatically

TIP: Using points = instant savings!`
    },
    {
        id: "points-history",
        category: "points",
        keywords: ["points history", "transaction history", "points log", "see transactions", "point activity"],
        title: "Points History",
        content: `View all your points transactions:

PATH: /user/points-history

WHAT YOU'LL SEE:
- Current balance with INR value
- Total earned (all time)
- Total spent (all time)
- Net change

TRANSACTION TYPES:
- Signup bonus (+2000)
- Credit purchase (+amount)
- Booking payment (-amount)
- Cashback earned (+5%)
- Refunds (+amount)

FEATURES:
- Filter by: All, Earned, Spent, Requests
- Search transactions
- See dates and details`
    },
    {
        id: "points-conversion",
        category: "points",
        keywords: ["conversion rate", "points value", "how much worth", "points to rupees", "exchange rate"],
        title: "Points Conversion Rate",
        content: `Points have a real money value:

HOW IT WORKS:
- Admin sets the conversion rate
- Example: 1 point = ₹1 INR
- Rate shown on Credits page

WHERE TO SEE RATE:
- /user/credits - Shows current rate
- /user/dashboard - Balance in INR
- Checkout - See point value

EXAMPLE:
If rate = 1 and you have 5000 points:
- Balance = ₹5000 INR value
- Can pay for ₹5000 worth of bookings`
    },
    {
        id: "points-cashback",
        category: "points",
        keywords: ["cashback", "earn points", "earn cashback", "rewards", "get points back"],
        title: "Earning Cashback Points",
        content: `Earn points back on every booking!

HOW CASHBACK WORKS:
- Earn 5% cashback on bookings
- Points added automatically after booking
- View in points history

EXAMPLE:
- Book venue for ₹10,000
- Earn 500 cashback points!
- Use for future bookings

TIPS:
- Book more, earn more
- Cashback adds up over time
- Check points history for earnings`
    },

    // --- Browsing & Booking ---
    {
        id: "user-browse-venues",
        category: "venue",
        keywords: ["browse venues", "find venue", "search venue", "venue list", "see venues", "explore venues"],
        title: "Browsing Venues",
        content: `Find the perfect venue for your event:

PATH: /venues

HOW TO BROWSE:
1. Go to /venues
2. See all available venues
3. Use filters to narrow down:
   - Location
   - Price range
   - Capacity
   - Amenities
4. Click a venue to see details

EACH VENUE SHOWS:
- Images
- Name and description
- Location on map
- Price per day
- Capacity
- Rating and reviews
- Amenities list`
    },
    {
        id: "user-venue-details",
        category: "venue",
        keywords: ["venue details", "venue page", "venue info", "see venue", "venue description"],
        title: "Venue Details Page",
        content: `Each venue has a detailed page:

PATH: /venues/[id]

WHAT YOU'LL SEE:
1. IMAGES - Photo gallery
2. NAME & DESCRIPTION
3. LOCATION - Address + Google Maps
4. PRICE - Per day cost
5. CAPACITY - How many people fit
6. AMENITIES - WiFi, Parking, AC, etc.
7. REVIEWS - Customer ratings
8. AVAILABILITY - Calendar view
9. VENDOR CONTACT - Business info
10. BOOK NOW button

Click "Book Now" to reserve!`
    },
    {
        id: "user-book-venue",
        category: "venue",
        keywords: ["book venue", "reserve venue", "venue booking", "how to book venue", "make reservation"],
        title: "How to Book a Venue",
        content: `Complete guide to booking a venue:

PATH: Start at /venues → Select venue → Book

STEP-BY-STEP:
1. Browse venues at /venues
2. Click on your preferred venue
3. Check the AVAILABILITY CALENDAR
4. Select your booking dates
5. Click "Book Now"
6. Review booking details and price
7. Choose payment method:
   - Full Points
   - Full PayPal
   - Hybrid (Points + PayPal)
8. Confirm booking
9. Receive confirmation email!

REMEMBER: You have 2000 free points to use!`
    },
    {
        id: "user-browse-events",
        category: "events",
        keywords: ["browse events", "find events", "search events", "events list", "see events", "upcoming events"],
        title: "Browsing Events",
        content: `Discover events to attend:

PATH: /events

HOW TO BROWSE:
1. Go to /events
2. See all upcoming events
3. Filter by:
   - Date
   - Category
   - Location
   - Price range
4. Click an event for details

EACH EVENT SHOWS:
- Event name and images
- Date and time
- Venue/location
- Ticket prices
- Available seats
- Organizer info`
    },
    {
        id: "user-event-details",
        category: "events",
        keywords: ["event details", "event page", "event info", "see event", "event description"],
        title: "Event Details Page",
        content: `Each event has a detailed page:

PATH: /events/[id]

WHAT YOU'LL SEE:
1. EVENT NAME & DESCRIPTION
2. DATE & TIME
3. VENUE LOCATION with map
4. IMAGES/POSTERS
5. SEAT CATEGORIES:
   - VIP (premium, highest price)
   - General (standard)
   - Economy (budget-friendly)
6. PRICING per category
7. AVAILABLE SEATS remaining
8. ORGANIZER INFO
9. BUY TICKETS button`
    },
    {
        id: "user-book-event",
        category: "events",
        keywords: ["book event", "buy tickets", "event tickets", "attend event", "get tickets"],
        title: "How to Buy Event Tickets",
        content: `Complete guide to buying event tickets:

PATH: Start at /events → Select event → Buy

STEP-BY-STEP:
1. Browse events at /events
2. Click on event you want to attend
3. View event details and date
4. SELECT SEAT CATEGORY:
   - VIP, General, Economy, etc.
5. Enter NUMBER OF TICKETS
6. See total price calculated
7. Choose payment:
   - Points / PayPal / Hybrid
8. Confirm purchase
9. Get tickets/confirmation!

TIP: Book early for better seats!`
    },
    {
        id: "user-seat-categories",
        category: "events",
        keywords: ["seat categories", "ticket types", "vip", "general", "economy", "seating options"],
        title: "Event Seat Categories",
        content: `Events have different ticket types:

COMMON CATEGORIES:
1. VIP
   - Best seats
   - Premium experience
   - Highest price
   
2. GENERAL
   - Good seats
   - Standard experience
   - Moderate price
   
3. ECONOMY
   - Basic seats
   - Budget-friendly
   - Lowest price

EACH CATEGORY SHOWS:
- Category name
- Price per ticket
- Total seats available
- Remaining seats

Choose based on your budget and preference!`
    },

    // --- Bookings Management ---
    {
        id: "user-my-bookings",
        category: "user",
        keywords: ["my bookings", "view bookings", "booking history", "reservations", "see bookings"],
        title: "Viewing Your Bookings",
        content: `See all your venue and event bookings:

PATH: /user/bookings

WHAT YOU'LL SEE:
- List of all your bookings
- Venue bookings and event bookings

EACH BOOKING SHOWS:
- Venue/Event name
- Booking dates
- Status: Pending, Confirmed, Completed, Cancelled
- Amount paid (points/PayPal)
- Vendor contact info

ACTIONS:
- Click to view full details
- See booking receipt
- Contact vendor if needed`
    },
    {
        id: "user-booking-details",
        category: "user",
        keywords: ["booking details", "booking info", "view booking", "booking receipt"],
        title: "Booking Details",
        content: `View complete booking information:

PATH: /user/bookings/[id]

WHAT YOU'LL SEE:
- Complete booking summary
- Venue/Event details
- Your selected dates/seats
- Payment breakdown:
  - Total amount
  - Points used
  - PayPal paid
- Booking status
- Vendor contact information:
  - Business name
  - Phone number
  - Email address

Use vendor contact if you need to communicate!`
    },
    {
        id: "user-booking-status",
        category: "user",
        keywords: ["booking status", "pending", "confirmed", "cancelled", "completed", "status meaning"],
        title: "Booking Status Meanings",
        content: `What each booking status means:

PENDING:
- Booking submitted, waiting for vendor confirmation
- Vendor will review and approve

CONFIRMED:
- Vendor has approved your booking
- Your reservation is secured!

COMPLETED:
- Event/booking date has passed
- You attended successfully

CANCELLED:
- Booking was cancelled
- Check refund status if applicable

REFUNDED:
- Cancelled and money/points returned`
    },

    // --- User Transactions ---
    {
        id: "user-transactions",
        category: "user",
        keywords: ["transactions", "payment history", "all payments", "transaction list"],
        title: "User Transactions",
        content: `View all your financial transactions:

PATH: /user/transactions

WHAT YOU'LL SEE:
- Credit purchases
- Credit requests
- Booking payments
- Cashback earned
- Refunds

EACH TRANSACTION SHOWS:
- Date and time
- Transaction type
- Amount in points
- Status (pending/completed)
- Running balance`
    },

    // ============================================================
    // SECTION 3: VENDOR FEATURES - COMPLETE GUIDE
    // ============================================================

    {
        id: "vendor-become",
        category: "vendor",
        keywords: ["become vendor", "vendor registration", "sell venue", "list venue", "vendor signup", "start selling"],
        title: "How to Become a Vendor",
        content: `Want to list your venue or host events? Become a vendor!

STEPS TO REGISTER:
1. Go to /signup
2. Select "VENDOR" role
3. Fill in business details:
   - Business name
   - Phone number
   - Email address
4. Complete registration
5. WAIT FOR ADMIN APPROVAL (24-48 hours)
6. Get approval notification
7. Access your Vendor Dashboard!

AFTER APPROVAL YOU CAN:
- List venues
- Create events
- Receive bookings
- Earn money`
    },
    {
        id: "vendor-dashboard",
        category: "vendor",
        keywords: ["vendor dashboard", "vendor home", "vendor panel", "business dashboard"],
        title: "Vendor Dashboard",
        content: `Your Vendor Dashboard is your business control center:

PATH: /vendor/dashboard

WHAT YOU'LL SEE:
- Business overview
- Total earnings
- Pending payouts
- Recent bookings
- Quick stats

QUICK LINKS:
- Manage Venues → /vendor/venues
- Manage Events → /vendor/events
- View Bookings → /vendor/bookings
- Analytics → /vendor/analytics
- Withdrawals → Request payouts
- Profile → Business settings`
    },
    {
        id: "vendor-create-venue",
        category: "vendor",
        keywords: ["create venue", "add venue", "list venue", "new venue", "vendor venue"],
        title: "Creating a Venue (Vendor)",
        content: `List your venue on EventVenue:

PATH: /vendor/venues/new

STEP-BY-STEP:
1. Go to /vendor/venues/new
2. Fill in venue details:
   - Venue name
   - Description
   - Full address
3. Set location on Google Maps
4. Enter capacity (max people)
5. Set price per day
6. Select amenities:
   - WiFi, Parking, AC, Catering, etc.
7. Upload multiple images
8. Click "Create Venue"
9. Your venue is listed!

MANAGE: /vendor/venues`
    },
    {
        id: "vendor-manage-venues",
        category: "vendor",
        keywords: ["manage venues", "edit venue", "update venue", "my venues", "venue list vendor"],
        title: "Managing Your Venues",
        content: `Manage all your listed venues:

PATH: /vendor/venues

WHAT YOU CAN DO:
- View all your venues
- Edit venue details
- Update pricing
- Change images
- Set availability
- Block dates
- View venue bookings
- See analytics per venue

TO EDIT A VENUE:
1. Go to /vendor/venues
2. Click on the venue
3. Make changes
4. Save updates`
    },
    {
        id: "vendor-create-event",
        category: "vendor",
        keywords: ["create event", "host event", "add event", "new event", "vendor event"],
        title: "Creating an Event (Vendor)",
        content: `Host your own event on EventVenue:

PATH: /vendor/events/new

STEP-BY-STEP:
1. Go to /vendor/events/new
2. Enter event details:
   - Event name
   - Description
   - Date and time
   - Venue/location
3. Add SEAT CATEGORIES:
   - Category name (VIP, General, etc.)
   - Price per ticket
   - Number of seats available
4. Upload event images
5. Click "Create Event"
6. Your event is published!

MANAGE: /vendor/events`
    },
    {
        id: "vendor-manage-events",
        category: "vendor",
        keywords: ["manage events", "edit event", "update event", "my events", "event list vendor"],
        title: "Managing Your Events",
        content: `Manage all your hosted events:

PATH: /vendor/events

WHAT YOU CAN DO:
- View all your events
- Edit event details
- Update seat categories
- Change pricing
- Update images
- Cancel event if needed
- View ticket sales
- See analytics

TO EDIT AN EVENT:
1. Go to /vendor/events
2. Click on the event
3. Make changes
4. Save updates`
    },
    {
        id: "vendor-bookings",
        category: "vendor",
        keywords: ["vendor bookings", "customer bookings", "booking requests", "see bookings vendor"],
        title: "Vendor Bookings",
        content: `View all bookings for your venues/events:

PATH: /vendor/bookings

WHAT YOU'LL SEE:
- All bookings for your listings
- Customer details
- Booking dates
- Payment info
- Booking status

ACTIONS:
- View booking details
- Confirm pending bookings
- Contact customer if needed

INFORMATION SHOWN:
- Customer name and contact
- What they booked
- When and for how long
- How much they paid`
    },
    {
        id: "vendor-earnings",
        category: "vendor",
        keywords: ["vendor earnings", "my earnings", "revenue", "income", "money earned", "how much i made"],
        title: "Vendor Earnings",
        content: `Track your earnings as a vendor:

WHERE TO SEE: /vendor/dashboard and /vendor/transactions

HOW YOU EARN:
- Users book your venues → You earn
- Users buy event tickets → You earn
- Your earnings = Booking amount - Platform fee

EARNINGS BREAKDOWN:
- Total earnings
- Pending (awaiting completion)
- Available for withdrawal
- Already withdrawn

Platform takes a small commission (set by admin).`
    },
    {
        id: "vendor-withdraw",
        category: "vendor",
        keywords: ["withdraw", "withdrawal", "get paid", "payout", "cash out", "receive money"],
        title: "How to Withdraw Money (Vendor)",
        content: `Get your earnings paid out:

HOW TO WITHDRAW:
1. Go to Vendor Dashboard
2. Navigate to Withdrawals/Earnings section
3. Check your available balance
4. Click "Request Withdrawal"
5. Enter withdrawal amount
6. Submit request
7. Admin reviews and approves
8. Money sent to your PayPal/bank!

IMPORTANT:
- Update your payment details in settings
- Minimum withdrawal may apply
- Processing time: 1-3 business days after approval`
    },
    {
        id: "vendor-analytics",
        category: "vendor",
        keywords: ["vendor analytics", "statistics", "performance", "reports", "charts", "insights"],
        title: "Vendor Analytics",
        content: `Track your business performance:

PATH: /vendor/analytics

WHAT YOU'LL SEE:
- Booking trends over time
- Revenue charts
- Popular venues/events
- Customer patterns

USE ANALYTICS TO:
- Identify best performers
- Track growth
- Optimize pricing
- Plan marketing

Also available: Per-venue and per-event analytics`
    },
    {
        id: "vendor-reviews",
        category: "vendor",
        keywords: ["vendor reviews", "customer feedback", "ratings vendor", "respond reviews"],
        title: "Managing Reviews (Vendor)",
        content: `Handle customer reviews:

PATH: /vendor/reviews

WHAT YOU CAN DO:
- View all reviews for your listings
- See star ratings (1-5)
- Read customer feedback
- Respond to reviews

TIPS:
- Respond professionally to negative reviews
- Thank customers for positive reviews
- Address concerns promptly
- Good reviews attract more customers!`
    },
    {
        id: "vendor-profile",
        category: "vendor",
        keywords: ["vendor profile", "business settings", "vendor settings", "update business"],
        title: "Vendor Profile Settings",
        content: `Update your business information:

PATH: /vendor/profile

WHAT YOU CAN UPDATE:
- Business name
- Phone number
- Email address
- Payment details for withdrawals

IMPORTANT:
- Keep phone/email updated for customer contact
- Update payment details before requesting withdrawal
- Business name appears on all your listings`
    },
    {
        id: "vendor-transactions",
        category: "vendor",
        keywords: ["vendor transactions", "vendor payments", "earnings history", "payment log"],
        title: "Vendor Transactions",
        content: `View all your financial activity:

PATH: /vendor/transactions

WHAT YOU'LL SEE:
- Booking payments received
- Platform fees deducted
- Withdrawals processed
- Pending payouts

Each shows:
- Date and time
- Transaction type
- Amount
- Status`
    },

    // ============================================================
    // SECTION 4: ADMIN FEATURES
    // ============================================================

    {
        id: "admin-dashboard",
        category: "admin",
        keywords: ["admin dashboard", "admin panel", "admin home", "platform overview"],
        title: "Admin Dashboard",
        content: `Platform-wide management center:

PATH: /admin/dashboard

WHAT YOU'LL SEE:
- Total users count
- Total vendors count
- Total bookings
- Platform revenue
- Recent activity

QUICK ACCESS TO:
- User management
- Vendor management
- Booking management
- Financial management
- Platform settings`
    },
    {
        id: "admin-users",
        category: "admin",
        keywords: ["manage users", "user management", "all users", "user list admin"],
        title: "User Management (Admin)",
        content: `Manage all platform users:

PATH: /admin/users

WHAT YOU CAN DO:
- View all registered users
- Search and filter users
- See user details:
  - Email, name, phone
  - Points balance
  - Booking history
- Activate/deactivate accounts
- Add/remove points manually`
    },
    {
        id: "admin-vendors",
        category: "admin",
        keywords: ["manage vendors", "vendor approval", "approve vendor", "vendor management"],
        title: "Vendor Management (Admin)",
        content: `Manage all vendors:

PATH: /admin/vendors

WHAT YOU CAN DO:
- View all vendors
- APPROVE new vendor applications
- Reject vendor applications
- Verify vendors (add badge)
- Suspend/activate accounts
- View vendor listings`
    },
    {
        id: "admin-bookings",
        category: "admin",
        keywords: ["admin bookings", "all bookings", "booking management admin"],
        title: "Booking Management (Admin)",
        content: `View all platform bookings:

PATH: /admin/bookings

WHAT YOU CAN DO:
- View ALL system bookings
- Filter by venue/event
- Filter by status
- See booking details
- Resolve issues`
    },
    {
        id: "admin-credits",
        category: "admin",
        keywords: ["credit requests", "approve credits", "point requests", "add points admin"],
        title: "Credit Request Approval (Admin)",
        content: `Handle user credit requests:

PATH: /admin/credit-requests

WHAT YOU DO:
1. View pending credit requests
2. See user info and amount
3. Review request reason
4. Approve or Reject
5. Points added on approval

Both purchase requests and free credit requests appear here.`
    },
    {
        id: "admin-withdrawals",
        category: "admin",
        keywords: ["withdrawal requests", "approve withdrawal", "vendor payout", "process withdrawal"],
        title: "Processing Withdrawals (Admin)",
        content: `Handle vendor withdrawal requests:

PATH: /admin/withdrawals

STEPS:
1. View pending withdrawal requests
2. Check vendor balance
3. Verify withdrawal amount
4. Approve the request
5. Process payment
6. Mark as completed

Vendors receive money after your approval.`
    },
    {
        id: "admin-settings",
        category: "admin",
        keywords: ["platform settings", "admin settings", "conversion rate", "platform fee"],
        title: "Platform Settings (Admin)",
        content: `Configure platform settings:

PATH: /admin/settings

WHAT YOU CAN SET:
- CONVERSION RATE: Points to currency (e.g., 1 point = ₹1)
- PLATFORM FEE: Commission on bookings
- Other system settings

These settings affect:
- Point values
- Vendor payouts
- User payments`
    },
    {
        id: "admin-reviews",
        category: "admin",
        keywords: ["admin reviews", "moderate reviews", "review management"],
        title: "Review Moderation (Admin)",
        content: `Moderate platform reviews:

PATH: /admin/reviews

WHAT YOU CAN DO:
- View all reviews
- Remove inappropriate content
- Monitor review quality`
    },
    {
        id: "admin-audit",
        category: "admin",
        keywords: ["audit logs", "admin logs", "activity logs", "security logs"],
        title: "Audit Logs (Admin)",
        content: `Track admin activities:

PATH: /admin/audit-logs

WHAT YOU'LL SEE:
- All admin actions
- Timestamps
- Who did what
- Details of changes

Useful for:
- Security monitoring
- Compliance
- Troubleshooting`
    },

    // ============================================================
    // SECTION 5: SUPPORT & HELP
    // ============================================================

    {
        id: "support-contact",
        category: "support",
        keywords: ["contact", "support", "help", "email", "customer service", "reach", "talk to", "get help"],
        title: "How to Get Help",
        content: `Need help with EventVenue?

CONTACT METHODS:
1. EMAIL: pranaib20@gmail.com
   - Fastest way to get help
   - Admin team responds
   - Usually within 24-48 hours

2. AI ASSISTANT: That's me!
   - Ask questions anytime
   - Instant answers

3. HELP PAGE: /help
   - FAQs and guides

WHAT TO INCLUDE IN EMAIL:
- Your account email
- Clear description of issue
- Screenshots if helpful`
    },
    {
        id: "support-lost-points",
        category: "support",
        keywords: ["lost points", "missing points", "points gone", "where are my points", "points disappeared"],
        title: "Lost or Missing Points",
        content: `If your points are missing:

STEP 1: CHECK FIRST
- Go to /user/points-history
- Look for any transactions
- Points may have been used for booking

STEP 2: IF TRULY MISSING
- Email pranaib20@gmail.com
- Include:
  * Your account email
  * When you noticed
  * Expected vs actual balance

STEP 3: ALTERNATIVE
- Go to /user/credits
- Click "Request Free Credits"
- Explain the situation
- Admin will review

Support will investigate and restore points if there was an error.`
    },
    {
        id: "support-issues",
        category: "support",
        keywords: ["issue", "problem", "error", "not working", "bug", "trouble", "something wrong"],
        title: "Reporting Problems",
        content: `If something isn't working:

TRY FIRST:
- Refresh the page
- Clear browser cache
- Try different browser
- Check internet connection

STILL HAVING ISSUES?
Email pranaib20@gmail.com with:
- What you were trying to do
- What happened instead
- Error message (if any
- Screenshots if possible
- Your account email

Response time: 24-48 hours`
    },
    {
        id: "support-contact-admin",
        category: "support",
        keywords: ["contact admin", "speak to admin", "reach admin", "admin help", "administrator"],
        title: "Contacting Admin",
        content: `To reach the admin team:

PRIMARY METHOD:
- Email: pranaib20@gmail.com
- All support emails go to admin team

FOR POINT ISSUES:
- Use "Request Credits" feature
- Admin reviews requests

FOR URGENT MATTERS:
- Put "URGENT" in email subject
- Describe the critical nature

The admin team handles:
- Account issues
- Lost points
- Platform problems
- Vendor approvals
- Withdrawal processing`
    },
    {
        id: "support-account",
        category: "support",
        keywords: ["account issue", "cant login", "locked out", "account problem", "password reset"],
        title: "Account Issues",
        content: `Having account problems?

FORGOT PASSWORD:
1. Go to /login
2. Click "Forgot Password"
3. Enter your email
4. Check email for reset link
5. Set new password

CAN'T LOG IN:
- Verify correct email
- Check caps lock
- Try password reset
- Contact support if needed

ACCOUNT LOCKED:
- Email pranaib20@gmail.com
- Explain situation
- Provide account email

OTP NOT RECEIVED:
- Check spam folder
- Wait 2 minutes
- Click "Resend OTP"
- Contact support if still issues`
    },

    // ============================================================
    // SECTION 6: NAVIGATION & PATHS
    // ============================================================

    {
        id: "nav-all",
        category: "navigation",
        keywords: ["pages", "navigation", "urls", "paths", "where", "find", "go to"],
        title: "All Platform Pages",
        content: `Complete navigation guide:

PUBLIC PAGES:
- / (Homepage)
- /venues (Browse venues)
- /events (Browse events)
- /login (Sign in)
- /signup (Register)
- /help (Help center)
- /how-it-works (Guide)

USER PAGES:
- /user/dashboard (Your dashboard)
- /user/bookings (Your bookings)
- /user/profile (Your profile)
- /user/credits (Buy/request points)
- /user/points-history (Transaction history)
- /user/transactions (All transactions)

VENDOR PAGES:
- /vendor/dashboard
- /vendor/venues (Manage venues)
- /vendor/venues/new (Create venue)
- /vendor/events (Manage events)
- /vendor/events/new (Create event)
- /vendor/bookings
- /vendor/analytics
- /vendor/reviews
- /vendor/profile

ADMIN PAGES:
- /admin/dashboard
- /admin/users
- /admin/vendors
- /admin/bookings
- /admin/credit-requests
- /admin/withdrawals
- /admin/settings
- /admin/reviews
- /admin/audit-logs`
    },

    // ============================================================
    // SECTION 7: FAQ & COMMON QUESTIONS
    // ============================================================

    {
        id: "faq-payment-methods",
        category: "faq",
        keywords: ["payment methods", "how to pay", "payment options", "accepted payments"],
        title: "Payment Methods",
        content: `Payment options on EventVenue:

1. POINTS
   - Use your virtual currency
   - Get 2000 free on signup

2. PAYPAL
   - Secure online payment
   - Cards via PayPal

3. HYBRID
   - Mix points and PayPal
   - Use some points, pay rest with PayPal

Buy more points:
Dashboard → Buy Credits → PayPal`
    },
    {
        id: "faq-cancellation",
        category: "faq",
        keywords: ["cancel", "cancellation", "refund", "get money back", "cancel booking"],
        title: "Cancellation & Refunds",
        content: `About cancellations:

TO CANCEL:
- Contact the vendor directly
- Check venue/event cancellation policy
- Email support if vendor unresponsive

REFUNDS:
- Depend on vendor policy
- Depend on how close to event date
- Points refunded if applicable
- PayPal refunds processed by admin

For issues: pranaib20@gmail.com`
    },
    {
        id: "faq-how-it-works",
        category: "faq",
        keywords: ["how it works", "how to use", "getting started", "beginner", "new user"],
        title: "How EventVenue Works",
        content: `EventVenue in 4 simple steps:

STEP 1: SIGN UP
- Create account at /signup
- Get 2000 FREE points!

STEP 2: BROWSE
- Explore venues at /venues
- Discover events at /events

STEP 3: BOOK
- Select dates or tickets
- Pay with Points/PayPal

STEP 4: ENJOY
- Receive confirmation
- Attend your event!

WHY EVENTVENUE:
✓ Verified vendors
✓ Secure payments
✓ Earn cashback points
✓ Easy booking process`
    },
    {
        id: "faq-vendor-start",
        category: "faq",
        keywords: ["vendor start", "how to become vendor", "vendor guide", "list my venue"],
        title: "Getting Started as Vendor",
        content: `Want to earn money on EventVenue?

STEP 1: REGISTER
- Go to /signup → Select VENDOR
- Enter business details
- Submit and wait for approval

STEP 2: GET APPROVED
- Admin reviews your application
- Usually 24-48 hours
- You'll receive notification

STEP 3: LIST
- Add your venues or events
- Upload great photos
- Set competitive prices

STEP 4: EARN
- Receive bookings
- Earn money
- Request withdrawals`
    },
    {
        id: "faq-security",
        category: "faq",
        keywords: ["security", "safe", "secure", "privacy", "data protection"],
        title: "Security & Privacy",
        content: `EventVenue is secure:

ACCOUNT SECURITY:
- Passwords are encrypted
- JWT token authentication
- OTP email verification

PAYMENT SECURITY:
- PayPal handles payments
- SSL encryption
- No card details stored

DATA PRIVACY:
- Personal info protected
- Not shared with third parties
- Used only for service

TIPS:
- Use strong passwords
- Don't share login details
- Report suspicious activity`
    }
];

export default KNOWLEDGE_BASE;
