import { useState, FormEvent } from 'react';
import type { Location } from '@shared/types';
import './LocationForm.css';

interface LocationFormProps {
  location?: Location;
  onSuccess: (location: Location) => void;
  onCancel: () => void;
}

export default function LocationForm({ location, onSuccess, onCancel }: LocationFormProps) {
  const [name, setName] = useState(location?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Location name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const locationData: Location = {
        id: location?.id || `loc-${Date.now()}`,
        name: name.trim(),
        createdAt: new Date()
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess(locationData);
      
      if (!location) {
        setName('');
      }
    } catch (error) {
      console.error('Error submitting location form:', error);
      setError('Failed to save location');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="location-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="location-name">Location Name</label>
        <input
          id="location-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter location name"
          required
        />
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
          {isSubmitting ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
        </button>
      </div>
    </form>
  );
}