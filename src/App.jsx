import React, { useEffect, useState } from "react";
import "./App.css";
import Search from "./components/search";
import Spinner from "./components/spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { updateSearchCount, getTrendingMovies } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  },
};

function App() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [movieList, setMovieList] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [debounceSearchTerm, setDebounceSearchTerm] = React.useState();
  const [trendingMovies, setTrendingMovies] = React.useState([]);

  useDebounce(() => setDebounceSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const endPoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURI(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endPoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error("Failed to fetch movie");
      }
      const data = await response.json();
      if (data.Response == "false") {
        setErrorMessage(data.Error || "Failed to fetch movies");
        setMovieList([]);
      }

      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.erro(`Error fetching movies: ${error}`);
      setErrorMessage(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrendingMovies = async () => {
    try {
      const results = await getTrendingMovies();
      setTrendingMovies(results);
    } catch (error) {
      console.log("error fetching trending moview", error);
    }
  };

  useEffect(() => {
    fetchMovies(debounceSearchTerm);
  }, [debounceSearchTerm]);

  useEffect(() => {
    fetchTrendingMovies();
  }, []);
  return (
    <main>
      <div className="pattern">
        <div className="wrapper">
          <header>
            <img src="./hero.png" alt="Herobanner" />
            <h1>
              Find <span className="text-gradient">Movies</span> you'll enjoy
            </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>

          {trendingMovies.length > 0 && (
            <section className="trending">
              <h2 className="">Trending Movies</h2>
              <ul>
                {trendingMovies.map((movie, index) => (
                  <li key={movie.$id}>
                    <p>{index + 1}</p>
                    <img src={movie.poster_url} alt={movie.title} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="all-movies">
            <h2 className="">All movies</h2>
            {isLoading ? (
              <p className="text-white">
                <Spinner />
              </p>
            ) : errorMessage ? (
              <p>{errorMessage}</p>
            ) : (
              <ul>
                {movieList.map((movie, index) => (
                  <MovieCard movie={movie} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
