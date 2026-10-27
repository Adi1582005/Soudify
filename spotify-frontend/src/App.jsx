
import { useEffect, useState } from "react";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMusics,
  getAlbums,
  uploadMusic,
  createAlbum,
} from "./api/api";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");

  const [musics, setMusics] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [auth, setAuth] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [albumTitle, setAlbumTitle] = useState("");
  const [selectedMusics, setSelectedMusics] = useState([]);

  const getId = (item) => item?._id || item?.id;

  const getArtist = (artist) =>
    typeof artist === "object"
      ? artist?.username || "Unknown artist"
      : "Artist";

      const getArtistId = (artist) =>
  typeof artist === "object" ? artist?._id || artist?.id : artist;

const isMyItem = (item) => {
  const artistId = getArtistId(item?.artist);
  const currentUserId = getId(user);

  if (artistId && currentUserId) {
    return String(artistId) === String(currentUserId);
  }

  // Fallback, agar backend artist ID ki jagah username deta hai
  return (
    typeof item?.artist === "object" &&
    item.artist?.username === user?.username
  );
};

const myMusics = musics.filter(isMyItem);
const myAlbums = albums.filter(isMyItem);

  // Load music and albums for listeners
  const loadLibrary = async () => {
    try {
      const [musicResponse, albumResponse] = await Promise.all([
        getMusics(),
        getAlbums(),
      ]);

      setMusics(musicResponse.data.musics || []);
      setAlbums(albumResponse.data.albums || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Library load nahi hui. Dobara login karo."
      );
    }
  };

  // Load songs for Artist Studio
  const loadArtistMusics = async () => {
  try {
    const [musicResponse, albumResponse] = await Promise.all([
      getMusics(),
      getAlbums(),
    ]);

    setMusics(musicResponse.data.musics || []);
    setAlbums(albumResponse.data.albums || []);
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Music ya library load nahi hui."
    );
  }
};

  // Load data according to logged-in user role
  useEffect(() => {
    if (user?.role === "user") {
      loadLibrary();
    } else if (user?.role === "artist") {
      loadArtistMusics();
    }
  }, [user]);

  // Search music by title or artist username
  const filteredMusics = musics.filter((song) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    const songTitle = song.title?.toLowerCase() || "";

    const artistName =
      typeof song.artist === "object"
        ? song.artist?.username?.toLowerCase() || ""
        : "";

    return (
      songTitle.includes(query) ||
      artistName.includes(query)
    );
  });

  // Login and registration
  const handleAuth = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response =
        authMode === "register"
          ? await registerUser(auth)
          : await loginUser({
              username: auth.username,
              email: auth.email,
              password: auth.password,
            });

      setUser(response.data.user);

      setPage(
        response.data.user.role === "artist" ? "artist" : "home"
      );

      setMessage("Welcome, " + response.data.user.username + "!");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Clear local UI even if logout request fails.
    }

    setUser(null);
    setMusics([]);
    setAlbums([]);
    setCurrentSong(null);
    setSearchQuery("");
    setSelectedMusics([]);
    setPage("home");
    setMessage("Logged out.");
  };

  // Upload a music track
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file || !title.trim()) {
      setMessage("Song title aur audio file dono select karo.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await uploadMusic(title.trim(), file);

      // Refresh songs so the newly uploaded track appears.
      await loadArtistMusics();

      setMessage(response.data.message || "Music uploaded.");
      const musicResponse = await getMusics();
      setMusics(musicResponse.data.musics || []);
      setTitle("");
      setFile(null);
      event.target.reset();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Upload failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // Toggle song selection using its MongoDB ID
  const toggleMusic = (id) => {
    setSelectedMusics((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  // Create an album
  const handleCreateAlbum = async (event) => {
    event.preventDefault();

    if (!albumTitle.trim()) {
      setMessage("Album ka title enter karo.");
      return;
    }

    if (selectedMusics.length === 0) {
      setMessage("Album ke liye kam-se-kam ek song select karo.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await createAlbum(
        albumTitle.trim(),
        selectedMusics
      );

      setMessage(response.data.message || "Album created successfully.");
      setAlbumTitle("");
      setSelectedMusics([]);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Album creation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // Authentication page
  if (!user) {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={handleAuth}>
          <div className="brand">
            <span className="brand-icon">♫</span> Soundify
          </div>

          <h1>
            {authMode === "login"
              ? "Welcome back"
              : "Create account"}
          </h1>

          <p className="muted">Your music. Your world.</p>

          <label>Username</label>
          <input
            required
            value={auth.username}
            onChange={(e) =>
              setAuth({ ...auth, username: e.target.value })
            }
            placeholder="Your username"
          />

          {authMode === "register" && (
            <>
              <label>Email</label>
              <input
                type="email"
                required
                value={auth.email}
                onChange={(e) =>
                  setAuth({ ...auth, email: e.target.value })
                }
                placeholder="you@example.com"
              />

              <label>Account type</label>
              <select
                value={auth.role}
                onChange={(e) =>
                  setAuth({ ...auth, role: e.target.value })
                }
              >
                <option value="user">Listener</option>
                <option value="artist">Artist</option>
              </select>
            </>
          )}

          <label>Password</label>
          <input
            type="password"
            required
            value={auth.password}
            onChange={(e) =>
              setAuth({ ...auth, password: e.target.value })
            }
            placeholder="Enter password"
          />

          <button className="primary full" disabled={loading}>
            {loading
              ? "Please wait..."
              : authMode === "login"
                ? "Log in"
                : "Create account"}
          </button>

          <p className="switch-auth">
            {authMode === "login"
              ? "New here? "
              : "Already registered? "}

            <button
              type="button"
              className="text-button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                );
                setMessage("");
              }}
            >
              {authMode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>

          {message && <p className="notice">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">♫</span> Soundify
        </div>

        <p className="side-label">MENU</p>


        {user.role === "user" && (
  <>
    <button
      className={page === "home" ? "nav active" : "nav"}
      onClick={() => setPage("home")}
    >
      ◈ Home
    </button>

    <button
      className={page === "albums" ? "nav active" : "nav"}
      onClick={() => setPage("albums")}
    >
      ▣ Albums
    </button>
  </>
)}

        
{user.role === "artist" && (
  <>
    <button
      className={page === "artist" ? "nav active" : "nav"}
      onClick={() => setPage("artist")}
    >
      ◉ Artist Studio
    </button>

    <button
      className={page === "myMusic" ? "nav active" : "nav"}
      onClick={() => setPage("myMusic")}
    >
      ♫ My Music
    </button>

    <button
      className={page === "albums" ? "nav active" : "nav"}
      onClick={() => setPage("albums")}
    >
      ▣ My Album
    </button>
  </>
)}


       

        <div className="sidebar-bottom">
          <p className="muted">{user.username}</p>
          <span className="role-chip">{user.role}</span>

          <button className="nav" onClick={handleLogout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="muted">YOUR PERSONAL MUSIC SPACE</p>

            <h1>
              {page === "home"
                ? "Discover music"
                : page === "albums"
                  ? "Your albums"
                  : "Artist Studio"}
            </h1>
          </div>

          <div className="avatar">
            {user.username?.[0]?.toUpperCase()}
          </div>
        </header>

        {message && <p className="notice">{message}</p>}

        {/* Home and music search */}
        {user.role === "user" && page === "home" && (
          <section>
            <div className="hero">
              <p className="side-label">MADE FOR YOU</p>

              <h2>Find your next favourite song.</h2>

              <p>
                Search by song title or artist name and discover your
                next favourite track.
              </p>

              <div className="music-search">
                <span className="search-icon" aria-hidden="true">
                  ⌕
                </span>

                <input
                  type="search"
                  aria-label="Search songs or artists"
                  placeholder="What do you want to play?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="section-heading">
              <h2 className="section-title">
                {searchQuery.trim() ? "Search results" : "All tracks"}
              </h2>

              <span className="result-count">
                {filteredMusics.length}{" "}
                {filteredMusics.length === 1 ? "track" : "tracks"}
              </span>
            </div>

            <div className="song-list">
              {filteredMusics.map((song, index) => (
                <div className="song-row" key={getId(song)}>
                  <span className="track-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    className="song-info"
                    onClick={() => setCurrentSong(song)}
                  >
                    <span className="cover">♫</span>

                    <span>
                      <strong>{song.title}</strong>
                      <small>{getArtist(song.artist)}</small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="play-button"
                    onClick={() => setCurrentSong(song)}
                    aria-label={`Play ${song.title}`}
                    title="Play"
                  >
                    ▶
                  </button>
                </div>
              ))}

              {musics.length === 0 && (
                <p className="muted">
                  No tracks available yet. Artists need to upload music
                  first.
                </p>
              )}

              {musics.length > 0 && filteredMusics.length === 0 && (
                <div className="empty-search">
                  <span className="empty-search-icon">♫</span>
                  <h3>No music found</h3>
                  <p>Try another song title or artist name.</p>

                  <button
                    type="button"
                    className="primary"
                    onClick={() => setSearchQuery("")}
                  >
                    Show all tracks
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Albums */}
        {user.role === "user" && page === "albums" && (
          <section>
            <div className="album-grid">
              {albums.map((album) => (
                <article className="album-card" key={getId(album)}>
                  <div className="album-art">♫</div>

                  <h3>{album.title}</h3>

                  <p className="muted">{getArtist(album.artist)}</p>

                  {album.musics?.map((song) => (
                    <button
                      type="button"
                      className="album-track"
                      key={getId(song)}
                      onClick={() => setCurrentSong(song)}
                    >
                      ▶ {song.title || "Track"}
                    </button>
                  ))}
                </article>
              ))}

              {albums.length === 0 && (
                <p className="muted">No albums available yet.</p>
              )}
            </div>
          </section>
        )}

        
{/* My Music */}
{user.role === "artist" && page === "myMusic" && (
  <section>
    <div className="section-heading">
      <h2 className="section-title">My Music</h2>
      <span className="result-count">
        {myMusics.length} tracks
      </span>
    </div>

    <div className="song-list">
      {myMusics.map((song, index) => (
        <div className="song-row" key={getId(song)}>
          <span className="track-number">
            {String(index + 1).padStart(2, "0")}
          </span>

          <button
            type="button"
            className="song-info"
            onClick={() => setCurrentSong(song)}
          >
            <span className="cover">♫</span>

            <span>
              <strong>{song.title}</strong>
              <small>{getArtist(song.artist)}</small>
            </span>
          </button>

          <button
            type="button"
            className="play-button"
            onClick={() => setCurrentSong(song)}
            aria-label={`Play ${song.title}`}
          >
            ▶
          </button>
        </div>
      ))}

      {myMusics.length === 0 && (
        <div className="panel">
          <h3>No songs uploaded yet</h3>
          <p className="muted">
            Upload your first track from Artist Studio.
          </p>

          <button
            type="button"
            className="primary"
            onClick={() => setPage("artist")}
          >
            Upload music
          </button>
        </div>
      )}
    </div>
  </section>
)}


{/* My Library */}
{user.role === "artist" && page === "myLibrary" && (
  <section>
    <div className="section-heading">
      <h2 className="section-title">My Library</h2>
      <span className="result-count">
        {myAlbums.length} albums
      </span>
    </div>

    <div className="album-grid">
      {myAlbums.map((album) => (
        <article className="album-card" key={getId(album)}>
          <div className="album-art">♫</div>

          <h3>{album.title}</h3>

          <p className="muted">
            {album.musics?.length || 0} songs
          </p>

          <div className="album-tracks">
            {album.musics?.map((song) => (
              <button
                type="button"
                className="album-track"
                key={getId(song)}
                onClick={() => setCurrentSong(song)}
              >
                ▶ {song.title || "Track"}
              </button>
            ))}

            {(!album.musics || album.musics.length === 0) && (
              <p className="muted">
                No tracks in this album.
              </p>
            )}
          </div>
        </article>
      ))}

      {myAlbums.length === 0 && (
        <div className="panel">
          <h3>Your library is empty</h3>
          <p className="muted">
            Create your first album and add your songs to it.
          </p>

          <button
            type="button"
            className="primary"
            onClick={() => setPage("artist")}
          >
            Create an album
          </button>
        </div>
      )}
    </div>
  </section>
)}


        {/* Artist Studio */}
        {user.role === "artist" && page === "artist" && (
          <section className="artist-grid">
            {/* Upload song */}
            <form className="panel" onSubmit={handleUpload}>
              <h2>Upload a track</h2>

              <p className="muted">
                Upload an audio file to your music library.
              </p>

              <label>Track title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter song title"
              />

              <label>Audio file</label>
              <input
                required
                type="file"
                accept="audio/*"
                onChange={(e) =>
                  setFile(e.target.files?.[0] || null)
                }
              />

              <button className="primary full" disabled={loading}>
                {loading ? "Uploading..." : "Upload track"}
              </button>
            </form>

            {/* Create album with checkbox song selection */}
            <form className="panel" onSubmit={handleCreateAlbum}>
              <h2>Create an album</h2>

              <p className="muted">
               Select the songs want to add in this album 
              </p>

              <label>Album title</label>
              <input
                required
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                placeholder="Enter album title"
              />

              <label>Select Songs for Album</label>

              <div className="song-list album-song-selector">
                {musics.map((music) => {
                  const musicId = getId(music);

                  if (!musicId) return null;

                  return (
                    <label key={musicId} className="song-item">
                      <input
                        type="checkbox"
                        checked={selectedMusics.includes(musicId)}
                        onChange={() => toggleMusic(musicId)}
                      />

                      <span className="song-item-details">
                        <strong>{music.title || "Untitled track"}</strong>
                        <small>{getArtist(music.artist)}</small>
                      </span>
                    </label>
                  );
                })}

                {musics.length === 0 && (
                  <p className="muted empty-song-list">
                    No song is available currently. add your first song now
                  </p>
                )}
              </div>

              <p className="muted selected-count">
                {selectedMusics.length}{" "}
                {selectedMusics.length === 1 ? "song" : "songs"} selected
              </p>

              <button className="primary full" disabled={loading}>
                {loading ? "Creating..." : "Create album"}
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Music player */}
      {currentSong && (
        <footer className="player">
          <div className="player-track">
            <span className="cover">♫</span>

            <span>
              <strong>{currentSong.title}</strong>
              <small>{getArtist(currentSong.artist)}</small>
            </span>
          </div>

          <audio
            key={currentSong.uri}
            src={currentSong.uri}
            controls
            autoPlay
          />

          <button
            type="button"
            className="close-player"
            onClick={() => setCurrentSong(null)}
            aria-label="Close player"
          >
            ✕
          </button>
        </footer>
      )}
    </div>
  );
}
