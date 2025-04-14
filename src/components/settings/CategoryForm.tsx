import { useState } from 'react';
import './CategoryForm.css';

export default function CategoryForm({ category, onSuccess, onCancel }) {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Sample category icons - in a real app, these would be imported from a constants file
  const categoryIcons = [
    { name: 'food', label: 'Food' },
    { name: 'transportation', label: 'Transportation' },
    { name: 'housing', label: 'Housing' },
    { name: 'utilities', label: 'Utilities' },
    { name: 'entertainment', label: 'Entertainment' },
    { name: 'healthcare', label: 'Healthcare' },
    { name: 'shopping', label: 'Shopping' },
    { name: 'other', label: 'Other' }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // In a real implementation, this would save to Firestore
      // For now, we'll just simulate a successful save
      
      const categoryData = {
        id: category?.id || `cat-${Date.now()}`,
        name: name.trim(),
        icon
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (onSuccess) {
        onSuccess(categoryData);
      }
      
      // Reset form if it's a new category
      if (!category) {
        setName('');
        setIcon('other');
      }
    } catch (error) {
      console.error('Error submitting category form:', error);
      setError('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="category-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="category-name">Category Name</label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Icon</label>
        <div className="icon-selector">
          {categoryIcons.map((catIcon) => (
            <div 
              key={catIcon.name}
              className={`icon-option ${icon === catIcon.name ? 'selected' : ''}`}
              onClick={() => setIcon(catIcon.name)}
              title={catIcon.label}
            >
              {/* In a real app, this would be an actual icon */}
              <span className="icon-placeholder">{catIcon.name.charAt(0).toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}