
# 🎬 Movie Search App (OMDb API)

A modern, stylish web app to search movies by title and view rich movie details — powered by the [OMDb API](http://www.omdbapi.com/).

---

## 📖 Overview

This app uses two OMDb API endpoints:

- **Search Endpoint:**  
  `https://www.omdbapi.com/?s=TITLE&apikey=API_KEY`  
  Used to search for movies based on a user-entered title.

- **Detail Endpoint:**  
  `https://www.omdbapi.com/?i=IMDB_ID&apikey=API_KEY`  
  Used to retrieve detailed information about a specific movie using its IMDb ID.

These endpoints were selected to support both a fast search experience and detailed movie exploration, including reviews and metadata.

---

## ⚙️ Setup

1. **Clone the repository**

```bash
git clone https://github.com/Devasundari/movie-info-finder.git
cd movie-info-finder
```

2. **Insert your OMDb API key**

- Open the `app.js` file.
- Replace the placeholder with your actual OMDb API key:

```javascript
const API_KEY = 'YOUR_OMDB_API_KEY';
```

> You can request a free key from: [http://www.omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx)

3. **Run the app locally**

Just open the `index.html` file in any modern browser — no backend or server setup required.

---

## 🧑‍💻 Usage

- Type a movie name (e.g., "Interstellar") in the search bar.
- Click the **Search** button or press **Enter**.
- Movie cards will appear with title, year, and poster.
- Click a card to view full movie details like plot, cast, runtime, genres, and IMDb ratings in a modal.
- Close the modal by clicking the ✖ icon or outside the popup.

---

## 🛠️ Challenges

1. **Missing Poster Images**  
   - *Problem:* Some API results returned `"Poster": "N/A"`.
   - *Fix:* Used a placeholder clapperboard graphic and text when posters were unavailable.

2. **Redundant API Requests**  
   - *Problem:* Details were being fetched multiple times for the same movie.
   - *Fix:* Implemented caching with `Map()` to store previously fetched results.

3. **API Key Handling**  
   - *Problem:* Missing or invalid API key caused blank results and unclear errors.
   - *Fix:* Added an early error check with a descriptive message.

4. **No Ratings or Reviews**  
   - *Problem:* Some movies lacked ratings from major sources.
   - *Fix:* Added fallback content like director, writer, and cast information.

5. **DOM Flickering / Layout Shifts**  
   - *Problem:* Cards appeared empty while waiting for content.
   - *Fix:* Used smooth loading indicators and asynchronous updates to improve UX.

---

## 🙌 Acknowledgements

- Data: [OMDb API](http://www.omdbapi.com/)
- Emojis: Used for expressive UI feedback and reviews
- Fonts & Icons: System fonts, custom icons, and emoji-based design

---

## 📜 License

Free to use for personal and educational projects.
