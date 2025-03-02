import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAddIngredient = () => {
    if (inputValue.trim() && !ingredients.includes(inputValue.trim())) {
      setIngredients([...ingredients, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(item => item !== ingredient));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await fetch('http://localhost:5000/api/v1/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ingredients }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate recipe');
      }
      
      setRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="recipe-generator">
        <h2>Generate a Recipe</h2>
        <p>Add ingredients you have and we'll create a recipe for you</p>
        
        <div className="ingredients-input">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter an ingredient"
          />
          <button onClick={handleAddIngredient}>Add</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="ingredients-list">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-tag">
              {ingredient}
              <button onClick={() => handleRemoveIngredient(ingredient)}>×</button>
            </div>
          ))}
        </div>
        
        <button 
          className="generate-button" 
          onClick={handleGenerateRecipe}
          disabled={ingredients.length === 0 || loading}
        >
          {loading ? 'Generating...' : 'Generate Recipe'}
        </button>
        
        {recipe && (
          <div className="recipe-result">
            <h3>{recipe.title}</h3>
            <div className="recipe-ingredients">
              <h4>Ingredients:</h4>
              <ul>
                {recipe.ingredients.map((ingredient: string, index: number) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>
            <div className="recipe-instructions">
              <h4>Instructions:</h4>
              <p>{recipe.instructions}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 