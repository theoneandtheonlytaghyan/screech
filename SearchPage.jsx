/**
 * Search Page
 * Search for posts, users, and hashtags
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../utils/api';
import PostCard from '../components/posts/PostCard';
import UserCard from '../components/users/UserCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
  const [results, setResults] = useState({ posts: [], users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    
    if (q) {
      setQuery(q);
      setSearchType(type);
      performSearch(q, type);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery, type) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&type=${type}`);
      setResults(response.data.data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearchParams({ q: query, type: searchType });
  };

  const handleTypeChange = (type) => {
    setSearchType(type);
    if (query.trim()) {
      setSearchParams({ q: query, type });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-screech-text mb-4">
          Search Screech
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, users, hashtags..."
              className="w-full bg-screech-card border border-screech-border rounded-lg px-4 py-3 pl-12 text-screech-text placeholder-screech-textDark focus:outline-none focus:border-screech-accent"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-screech-textMuted" size={20} />
          </div>
        </form>

        {/* Search Type Tabs */}
        <div className="flex space-x-2 overflow-x-auto">
          {['all', 'posts', 'users', 'hashtags'].map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                searchType === type
                  ? 'bg-screech-accent text-screech-dark'
                  : 'bg-screech-card text-screech-textMuted hover:bg-screech-hover'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div className="space-y-6">
          {/* Posts Results */}
          {(searchType === 'all' || searchType === 'posts') && results.posts?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-screech-text mb-4">
                Posts ({results.posts.length})
              </h2>
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* Users Results */}
          {(searchType === 'all' || searchType === 'users') && results.users?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-screech-text mb-4">
                Users ({results.users.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </div>
            </div>
          )}

          {/* Hashtags Results */}
          {(searchType === 'all' || searchType === 'hashtags') && results.hashtags?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-screech-text mb-4">
                Hashtags ({results.hashtags.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.hashtags.map((hashtag) => (
                  <a
                    key={hashtag.hashtag}
                    href={`/hashtag/${hashtag.hashtag}`}
                    className="bg-screech-card border border-screech-border rounded-lg p-4 hover:bg-screech-hover transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-screech-accent font-medium">
                        #{hashtag.hashtag}
                      </span>
                      <span className="text-screech-textMuted text-sm">
                        {hashtag.count} {hashtag.count === 1 ? 'post' : 'posts'}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.posts?.length === 0 && 
           results.users?.length === 0 && 
           results.hashtags?.length === 0 && (
            <div className="bg-screech-card rounded-lg border border-screech-border p-8 text-center">
              <p className="text-screech-textMuted text-lg mb-2">
                No results found
              </p>
              <p className="text-screech-textDark text-sm">
                Try different keywords or check your spelling
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <div className="bg-screech-card rounded-lg border border-screech-border p-12 text-center">
          <Search className="mx-auto mb-4 text-screech-textMuted" size={48} />
          <p className="text-screech-textMuted text-lg mb-2">
            Search for hoots, owls, or hashtags
          </p>
          <p className="text-screech-textDark text-sm">
            Enter a search query above to get started
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;