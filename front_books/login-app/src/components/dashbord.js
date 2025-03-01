"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  BookOpen,
  Home as HomeIcon,
  Info,
  Mail,
  Search,
  LogOut,
  Send,
  Users,
  Star,
  Library,
  Github,
  Twitter,
  Facebook,
} from "lucide-react";

export default function Dashboard() {
  const [activeView, setActiveView] = useState("home");
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [newBook, setNewBook] = useState({ title: '', author: '', description: '' });
  const [message, setMessage] = useState('');
  const [googleBooks, setGoogleBooks] = useState([]);
  const [isLoadingGoogleBooks, setIsLoadingGoogleBooks] = useState(false);

  // Fetch books from your API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(`http://localhost:5000/api/books?search=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooks(response.data);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchQuery]);

  // Fetch books from Google Books API
  const searchGoogleBooks = async (query) => {
    setIsLoadingGoogleBooks(true);
    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
      setGoogleBooks(response.data.items || []);
    } catch (error) {
      console.error("Error searching books:", error);
      setGoogleBooks([]);
    } finally {
      setIsLoadingGoogleBooks(false);
    }
  };

  // Handle adding a new book
  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/books', newBook);
      setNewBook({ title: '', author: '', description: '' });
      alert('Book added successfully!');
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book.');
    }
  };

  // Handle contact form submission
  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert(`Message sent: ${message}`);
    setMessage('');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Menu items for the sidebar
  const menuItems = [
    { title: "Home", icon: HomeIcon, view: "home" },
    { title: "Books", icon: BookOpen, view: "books" },
    { title: "About", icon: Info, view: "about" },
    { title: "Contact", icon: Mail, view: "contact" },
  ];

  // Render different views based on activeView state
  const renderContent = () => {
    switch (activeView) {
      case "home":
        return (
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Featured Books</h1>
              <form onSubmit={handleAddBook} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="Description"
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">
                  Add Book
                </button>
              </form>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <div key={book._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5" />
                      <h3 className="text-xl font-semibold">{book.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-2">By {book.author}</p>
                    <p className="text-sm text-gray-500">{book.description || "No description available"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "books":
        return (
          <div className="container mx-auto">
            <h2>Book Search</h2>
            <form onSubmit={(e) => { e.preventDefault(); searchGoogleBooks(searchQuery); }} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for books..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </form>
            {isLoadingGoogleBooks ? (
              <p>Loading...</p>
            ) : (
              <ul className="book-list">
                {googleBooks.map((book) => (
                  <li key={book.id} className="book-item">
                    <img
                      src={book.volumeInfo.imageLinks?.thumbnail || "/placeholder.png"}
                      alt={book.volumeInfo.title}
                      className="book-cover"
                    />
                    <div className="book-info">
                      <h3>{book.volumeInfo.title}</h3>
                      <p>
                        <strong>Author(s):</strong> {book.volumeInfo.authors?.join(", ") || "Unknown"}
                      </p>
                      <p>{book.volumeInfo.description?.slice(0, 150)}...</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case "about":
        return (
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">About BookApp</h1>
            <div className="prose max-w-none mb-8">
              <p className="text-gray-600">
                Welcome to BookApp, your ultimate destination for discovering and exploring books. Our platform is
                designed to help readers find their next favorite book while connecting with a community of book lovers.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: BookOpen,
                  title: "Vast Collection",
                  description: "Access thousands of books across various genres",
                },
                { icon: Users, title: "Community", description: "Connect with other readers and share experiences" },
                { icon: Star, title: "Personalized", description: "Get personalized book recommendations" },
                { icon: Library, title: "Digital Library", description: "Build and manage your personal library" },
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <feature.icon className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="container mx-auto max-w-2xl">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
                <p className="text-gray-600 mb-6">Have a question or feedback? We'd love to hear from you.</p>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea
                      placeholder="Your message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-md min-h-[150px]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container mx-auto flex h-14 items-center px-4">
          {activeView === "home" && (
            <div className="flex items-center ml-auto max-w-sm space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-[200px] lg:w-[300px] px-3 border rounded-md"
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-6 w-6" />
              <span>BookApp</span>
            </div>
          </div>
          <nav className="p-2">
            {menuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={`w-full flex items-center gap-2 px-4 py-2 rounded-md text-left mb-1 ${
                  activeView === item.view ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </button>
            ))}
          </nav>
          <div className="border-t p-2 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-left text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">{loading && activeView === "home" ? <div>Loading...</div> : renderContent()}</main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto flex flex-col items-center gap-4 py-6 md:h-16 md:flex-row md:justify-between md:py-0 px-4">
          <div className="text-center text-sm text-gray-600 md:text-left">
            Built by{" "}
            <a href="#" target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
              BookApp
            </a>
            . The source code is available on{" "}
            <a href="#" target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
              GitHub
            </a>
            .
          </div>
          <div className="flex gap-4">
            <a href="https://github.com/ismailelaalaoui/first-git" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}