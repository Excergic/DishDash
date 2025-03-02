import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Recipe {
  _id: string;
  ingredients: string[];
  generatedRecipe: {
    title: string;
    instructions: string;
  };
  createdAt: string;
}

const MyRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/signin');
          return;
        }

        const response = await fetch('http://localhost:5000/api/recipes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            // No recipes found is not an error
            setRecipes([]);
          } else {
            throw new Error(data.message || 'Failed to fetch recipes');
          }
        } else {
          setRecipes(data.recipes);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Loading your recipes...</div>;
  }

  return (
    <div className="my-recipes-container">
      <h2>My Recipes</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {recipes.length === 0 ? (
        <div className="no-recipes">
          <p>You haven't generated any recipes yet.</p>
          <button onClick={() => navigate('/dashboard')}>Generate Your First Recipe</button>
        </div>
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <div key={recipe._id} className="recipe-card">
              <h3>{recipe.generatedRecipe.title}</h3>
              <div className="recipe-ingredients">
                <h4>Ingredients:</h4>
                <div className="ingredients-tags">
                  {recipe.ingredients.map((ingredient, index) => (
                    <span key={index} className="ingredient-tag">{ingredient}</span>
                  ))}
                </div>
              </div>
              <div className="recipe-instructions">
                <h4>Instructions:</h4>
                <p>{recipe.generatedRecipe.instructions}</p>
              </div>
              <div className="recipe-date">
                Created: {new Date(recipe.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRecipes; 