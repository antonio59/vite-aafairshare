import { useState, FormEvent } from 'react';
import type { Category, CategoryIconName } from '@shared/types';
import { CATEGORY_ICONS, CATEGORY_ICONS_EMOJI } from '@/lib/constants';
import './CategoryForm.css';

interface CategoryFormProps {
  _category?: Category;
  onSuccess: (_category: Category) => void;
  onCancel: () => void;
}

export default function CategoryForm({ _category: __category, onSuccess, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(__category?.name || '');
  const [icon, setIcon] = useState<string>(__category?.icon || 'other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Use the actual icon names as strings
  const ICON_NAMES: string[] = Object.keys(CATEGORY_ICONS_EMOJI);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const _categoryData: Category = {
        id: __category?.id || `cat-${Date.now()}`,
        name: name.trim(),
        icon,
        createdAt: new Date()
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess(_categoryData);
      
      if (!__category) {
        setName('');
        setIcon('other');
      }
    } catch (error) {
      console.error('Error submitting _category form:', error);
      setError('Failed to save _category');
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
          {ICON_NAMES.map((name) => {
            const IconComponent = CATEGORY_ICONS[name as CategoryIconName];
            return (
              <div 
                key={name}
                className={`icon-option ${icon === name ? 'selected' : ''}`}
                onClick={() => setIcon(name)}
                title={name.charAt(0).toUpperCase() + name.slice(1)}
              >
                {IconComponent ? (
                  <IconComponent className="w-6 h-6" />
                ) : (
                  <span className="icon-placeholder">{name.charAt(0)}</span>
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
          {isSubmitting ? 'Saving...' : __category ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}