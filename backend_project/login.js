const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.MONGO_URI || !process.env.JWT_SECRET || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing required environment variables. Ensure MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET are set.');
    process.exit(1);
}

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Session setup for Passport
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
        },
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Models
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
});
const User = mongoose.model('User', userSchema);

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },
}, { timestamps: true });
const Book = mongoose.model('Book', bookSchema);

// Passport Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        email: profile.emails[0].value,
                    });
                    await user.save();
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// Serialize and Deserialize User
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        const token = jwt.sign({ email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=${token}`);
    }
);

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Invalid or expired token:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
}

// Register Route
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'An error occurred during registration.' });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'An error occurred during login.' });
    }
});

// Create a new book
app.post('/api/books', authenticateToken, async (req, res) => {
    try {
        const { title, author, description } = req.body;

        if (!title || !author) {
            return res.status(400).json({ message: 'Title and author are required.' });
        }

        const newBook = new Book({ title, author, description });
        await newBook.save();

        res.status(201).json(newBook);
    } catch (err) {
        console.error('Error creating book:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid book data.', details: err.message });
        }
        res.status(500).json({ message: 'An error occurred while creating the book.' });
    }
});

// Get all books (with optional search)
app.get('/api/books', authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { author: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ],
            };
        }
        const books = await Book.find(query);
        res.json(books);
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).json({ message: 'An error occurred while fetching books.' });
    }
});

// Get example books for reading
app.get('/api/example-books', authenticateToken, async (req, res) => {
    try {
        const exampleBooks = [
            { _id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', description: 'A classic novel.' },
            { _id: 2, title: '1984', author: 'George Orwell', description: 'A dystopian masterpiece.' },
            { _id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', description: 'A powerful story.' },
        ];
        res.json(exampleBooks);
    } catch (err) {
        console.error('Error fetching example books:', err);
        res.status(500).json({ message: 'An error occurred while fetching example books.' });
    }
});

// Delete a book
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }
        res.json({ message: 'Book deleted successfully.' });
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).json({ message: 'An error occurred while deleting the book.' });
    }
});

// Start Server with Graceful Shutdown
const PORT = process.env.PORT || 5000;
let server;

async function startServer() {
    try {
        server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Shutting down server...');
        await mongoose.connection.close();
        server.close(() => process.exit(0));
    });
}

startServer();