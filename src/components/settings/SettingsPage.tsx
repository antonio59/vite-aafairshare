import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import './SettingsPage.css';
import CategoryForm from './CategoryForm';
import LocationForm from './LocationForm';

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [currency, setCurrency] = useState('GBP'); // Default currency
  const [notifications, setNotifications] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  
  // State for categories and locations
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  
  // State for dialogs
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [selectedLocation, setSelectedLocation] = useState(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Fetch categories and locations when component mounts
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch categories from Firestore
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        // Fetch from Firestore
        const categoriesCollection = collection(db, 'categories');
        const categoriesQuery = query(categoriesCollection, orderBy('name'));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    // Fetch locations from Firestore
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        // Fetch from Firestore
        const locationsCollection = collection(db, 'locations');
        const locationsQuery = query(locationsCollection, orderBy('name'));
        const locationsSnapshot = await getDocs(locationsQuery);
        const locationsData = locationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocations(locationsData);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLocationsLoading(false);
      }
    };
    
    fetchCategories();
    fetchLocations();
  }, [currentUser]);
  
  // These functions would actually save settings to a database in a real implementation
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    // In a real app, save this preference to user settings in the database
  };
  
  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
    // In a real app, save this preference to user settings in the database
  };
  
  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    // In a real app, save this preference to user settings in the database
  };
  
  // Category and Location management functions
  const handleAddCategory = () => {
    setSelectedCategory(undefined);
    setIsCategoryDialogOpen(true);
  };
  
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsCategoryDialogOpen(true);
  };
  
  const handleCategorySuccess = async (categoryData) => {
    try {
      if (selectedCategory) {
        // Update existing category in Firestore
        const categoryRef = doc(db, 'categories', categoryData.id);
        await updateDoc(categoryRef, {
          name: categoryData.name,
          icon: categoryData.icon
        });
        
        // Update local state
        setCategories(categories.map(cat =>
          cat.id === categoryData.id ? categoryData : cat
        ));
      } else {
        // Add new category to Firestore
        const { id, ...categoryWithoutId } = categoryData;
        const docRef = await addDoc(collection(db, 'categories'), categoryWithoutId);
        
        // Update local state with the new ID from Firestore
        const newCategory = { ...categoryWithoutId, id: docRef.id };
        setCategories([...categories, newCategory]);
      }
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };
  
  const handleAddLocation = () => {
    setSelectedLocation(undefined);
    setIsLocationDialogOpen(true);
  };
  
  const handleEditLocation = (location) => {
    setSelectedLocation(location);
    setIsLocationDialogOpen(true);
  };
  
  const handleLocationSuccess = async (locationData) => {
    try {
      if (selectedLocation) {
        // Update existing location in Firestore
        const locationRef = doc(db, 'locations', locationData.id);
        await updateDoc(locationRef, {
          name: locationData.name
        });
        
        // Update local state
        setLocations(locations.map(loc =>
          loc.id === locationData.id ? locationData : loc
        ));
      } else {
        // Add new location to Firestore
        const { id, ...locationWithoutId } = locationData;
        const docRef = await addDoc(collection(db, 'locations'), locationWithoutId);
        
        // Update local state with the new ID from Firestore
        const newLocation = { ...locationWithoutId, id: docRef.id };
        setLocations([...locations, newLocation]);
      }
      setIsLocationDialogOpen(false);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };
  
  const handleDeleteItem = (id, type) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'category') {
        // Delete from Firestore
        const categoryRef = doc(db, 'categories', itemToDelete.id);
        await deleteDoc(categoryRef);
        
        // Update local state
        setCategories(categories.filter(cat => cat.id !== itemToDelete.id));
      } else if (itemToDelete.type === 'location') {
        // Delete from Firestore
        const locationRef = doc(db, 'locations', itemToDelete.id);
        await deleteDoc(locationRef);
        
        // Update local state
        setLocations(locations.filter(loc => loc.id !== itemToDelete.id));
      }
    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button 
          className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          Locations
        </button>
      </div>
      
      {activeTab === 'general' && (
        <>
          <div className="settings-section">
            <h2>Account Information</h2>
            <div className="account-info">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{currentUser?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{currentUser?.displayName || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Created:</span>
                <span className="info-value">
                  {currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>Appearance</h2>
            <div className="setting-item">
              <div className="setting-label">
                <span>Dark Mode</span>
                <p className="setting-description">Use dark theme for the application</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={darkMode} 
                    onChange={handleDarkModeToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>Preferences</h2>
            <div className="setting-item">
              <div className="setting-label">
                <span>Currency</span>
                <p className="setting-description">Select your preferred currency</p>
              </div>
              <div className="setting-control">
                <select 
                  value={currency} 
                  onChange={handleCurrencyChange}
                  className="currency-select"
                >
                  <option value="GBP">British Pound (£)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Notifications</span>
                <p className="setting-description">Receive notifications for new expenses</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications} 
                    onChange={handleNotificationsToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="settings-section danger-zone">
            <h2>Danger Zone</h2>
            <div className="setting-item">
              <div className="setting-label">
                <span>Sign Out</span>
                <p className="setting-description">Sign out from your account</p>
              </div>
              <div className="setting-control">
                <button className="danger-button" onClick={logout}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'categories' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Categories</h2>
            <button className="add-button" onClick={handleAddCategory}>
              Add Category
            </button>
          </div>
          
          {categoriesLoading ? (
            <div className="loading-indicator">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <p>No categories found. Add your first category to get started!</p>
            </div>
          ) : (
            <div className="items-grid">
              {categories.map(category => (
                <div key={category.id} className="item-card">
                  <div className="item-icon">
                    {/* In a real app, this would be an actual icon */}
                    <span>{category.icon.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="item-details">
                    <h3>{category.name}</h3>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="edit-button" 
                      onClick={() => handleEditCategory(category)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteItem(category.id, 'category')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'locations' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Locations</h2>
            <button className="add-button" onClick={handleAddLocation}>
              Add Location
            </button>
          </div>
          
          {locationsLoading ? (
            <div className="loading-indicator">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="empty-state">
              <p>No locations found. Add your first location to get started!</p>
            </div>
          ) : (
            <div className="items-list">
              {locations.map(location => (
                <div key={location.id} className="item-row">
                  <div className="item-details">
                    <h3>{location.name}</h3>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="edit-button" 
                      onClick={() => handleEditLocation(location)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteItem(location.id, 'location')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Category Dialog */}
      {isCategoryDialogOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedCategory ? 'Edit' : 'Add'} Category</h2>
            <CategoryForm 
              category={selectedCategory}
              onSuccess={handleCategorySuccess}
              onCancel={() => setIsCategoryDialogOpen(false)}
            />
          </div>
        </div>
      )}
      
      {/* Location Dialog */}
      {isLocationDialogOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedLocation ? 'Edit' : 'Add'} Location</h2>
            <LocationForm 
              location={selectedLocation}
              onSuccess={handleLocationSuccess}
              onCancel={() => setIsLocationDialogOpen(false)}
            />
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={cancelDelete}>Cancel</button>
              <button onClick={confirmDelete} className="danger-button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}