import { useState } from 'react';
import './LocationForm.css';

export default function LocationForm({ location, onSuccess, onCancel }) {
  const [name, setName] = useState(location?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Location name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // In a real implementation, this would save to Firestore
      // For now, we'll just simulate a successful save
      
      const locationData = {
        id: location?.id || `loc-${Date.now()}`,
        name: name.trim()
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (onSuccess) {
        onSuccess(locationData);
      }
      
      // Reset form if it's a new location
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