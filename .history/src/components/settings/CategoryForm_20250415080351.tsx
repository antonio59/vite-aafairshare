import { useState, FormEvent } from 'react';
import type { Category, CategoryIconName } from '@shared/types';
import { CATEGORY_ICONS, CATEGORY_ICONS_EMOJI } from '@/lib/constants';
import './CategoryForm.css';

interface CategoryFormProps {
  category?: Category;
  onSuccess: (category: Category) => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState<CategoryIconName>(category?.icon || 'other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Use the actual CategoryIconName values from our constants
  const categoryIcons = Object.entries(CATEGORY_ICONS_EMOJI).map(([name, emoji]) => ({
    name: name as CategoryIconName,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    emoji
  }));
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const categoryData: Category = {
        id: category?.id || `cat-${Date.now()}`,
        name: name.trim(),
        icon,
        createdAt: new Date()
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess(categoryData);
      
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
          {categoryIcons.map((catIcon) => {
            const IconComponent = CATEGORY_ICONS[catIcon.name];
            return (
              <div 
                key={catIcon.name}
                className={`icon-option ${icon === catIcon.name ? 'selected' : ''}`}
                onClick={() => setIcon(catIcon.name)}
                title={catIcon.label}
              >
                {IconComponent ? (
                  <IconComponent className="w-6 h-6" />
                ) : (
                  <span className="icon-placeholder">{catIcon.emoji}</span>
                )}
              </div>
            );
          })}
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