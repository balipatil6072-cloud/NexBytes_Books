let allBooks = [];
let currentBooks = [];
let favoriteBookIds = JSON.parse(localStorage.getItem('favBooks')) || [];
let showingFavoritesOnly = false;

const DEFAULT_COVER = 'https://via.placeholder.com/180x260?text=No+Cover+Available';

// Load books from local JSON file on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadLocalJSON();
});

async function loadLocalJSON() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = `<div class="status-msg">Loading books dataset...</div>`;

  try {
    const response = await fetch('books.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Map JSON fields directly from books.json
    allBooks = data.map((book, index) => ({
      id: book.id || index,
      title: book.title || 'Untitled',
      author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown Author'),
      year: book.firstPublishedYear || 'N/A',
      coverUrl: book.cover || DEFAULT_COVER,
      rating: book.rating ? `⭐ ${book.rating}` : 'N/A',
      ratingsCount: book.ratingsCount ? book.ratingsCount.toLocaleString() : 'N/A',
      subjects: Array.isArray(book.genres) ? book.genres.join(', ') : (book.genres || 'General'),
      isbn: book.isbn13 || 'N/A',
      language: book.language || 'English'
    }));

    currentBooks = [...allBooks];
    displayBooks(currentBooks);
  } catch (error) {
    console.error("Error loading JSON file:", error);
    resultsDiv.innerHTML = `
      <div class="status-msg">
        Failed to load <code>books.json</code>.<br>
        <small>Make sure you run your project using <b>Live Server</b> in VS Code to avoid CORS file restrictions.</small>
      </div>`;
  }
}

// Live Search Filter
function searchBooks() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  if (!query) {
    currentBooks = [...allBooks];
  } else {
    currentBooks = allBooks.filter(book => 
      book.title.toLowerCase().includes(query) || 
      book.author.toLowerCase().includes(query) ||
      book.subjects.toLowerCase().includes(query)
    );
  }

  sortResults();
}

// Render Books Grid
function displayBooks(books) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (books.length === 0) {
    resultsDiv.innerHTML = `<div class="status-msg">No books found.</div>`;
    return;
  }

  books.forEach(book => {
    const isFav = favoriteBookIds.includes(book.id);
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='${DEFAULT_COVER}'" onclick="showDetails('${book.id}')">
      <div class="book-card-content">
        <h3 class="book-title" onclick="showDetails('${book.id}')">${book.title}</h3>
        <div class="book-author">${book.author}</div>
        <div class="book-year">Published: ${book.year} | ${book.rating}</div>
        <button class="fav-btn" onclick="toggleFavorite(event, ${book.id})">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
    `;
    resultsDiv.appendChild(card);
  });
}

// Sort Books
function sortResults() {
  const sortValue = document.getElementById('sortSelect').value;
  let sorted = [...currentBooks];

  if (sortValue === 'year-asc') {
    sorted.sort((a, b) => (parseInt(a.year) || 9999) - (parseInt(b.year) || 9999));
  } else if (sortValue === 'year-desc') {
    sorted.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  } else if (sortValue === 'rating-desc') {
    sorted.sort((a, b) => parseFloat(b.rating.replace('⭐ ', '') || 0) - parseFloat(a.rating.replace('⭐ ', '') || 0));
  }

  displayBooks(sorted);
}

// Toggle Favorites
function toggleFavorite(event, bookId) {
  event.stopPropagation();
  if (favoriteBookIds.includes(bookId)) {
    favoriteBookIds = favoriteBookIds.filter(id => id !== bookId);
  } else {
    favoriteBookIds.push(bookId);
  }
  localStorage.setItem('favBooks', JSON.stringify(favoriteBookIds));
  
  if (showingFavoritesOnly) {
    const favBooks = currentBooks.filter(book => favoriteBookIds.includes(book.id));
    displayBooks(favBooks);
  } else {
    displayBooks(currentBooks);
  }
}

function toggleFavoritesFilter() {
  showingFavoritesOnly = !showingFavoritesOnly;
  const btn = document.getElementById('favFilterBtn');

  if (showingFavoritesOnly) {
    btn.textContent = 'Show All Books';
    const favBooks = currentBooks.filter(book => favoriteBookIds.includes(book.id));
    displayBooks(favBooks);
  } else {
    btn.textContent = 'Show Favorites';
    displayBooks(currentBooks);
  }
}

// Modal View Details
function showDetails(bookId) {
  const book = allBooks.find(b => b.id == bookId);
  if (!book) return;

  document.getElementById('modalCover').src = book.coverUrl;
  document.getElementById('modalTitle').textContent = book.title;
  document.getElementById('modalAuthor').textContent = book.author;
  document.getElementById('modalYear').textContent = book.year;
  document.getElementById('modalRating').textContent = `${book.rating} (${book.ratingsCount} ratings)`;
  document.getElementById('modalSubjects').textContent = book.subjects;
  document.getElementById('modalIsbn').textContent = book.isbn;
  document.getElementById('modalLanguage').textContent = book.language;

  document.getElementById('bookModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('bookModal').style.display = 'none';
}

// Dark / Light Mode Toggle
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    searchBooks();
  }
}