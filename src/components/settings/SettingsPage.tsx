import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/NewAuthContext';
import './SettingsPage.css';
import CategoryForm from '@/components/settings/CategoryForm';
import LocationForm from '@/components/settings/LocationForm';
import { Category, Location } from "@shared/types";
import { ResourcesService } from '@/services/resources.service';

interface ItemToDelete {
  id: string;
  type: 'category' | 'location';
}

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [currency, setCurrency] = useState('GBP'); // Default currency
  const [notifications, setNotifications] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  
  // State for categories and locations
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  
  // State for dialogs
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  
  // Fetch categories and locations when component mounts
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const categoriesData = await ResourcesService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const locationsData = await ResourcesService.getLocations();
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
  
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
    // In a real app, save this preference to user settings in the database
  };
  
  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    // In a real app, save this preference to user settings in the database
  };
  
  // Category and Location management functions
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryDialogOpen(true);
  };
  
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryDialogOpen(true);
  };
  
  const handleCategorySuccess = async (categoryData: Category) => {
    try {
      if (selectedCategory) {
        // Update existing category
        await ResourcesService.updateCategory(categoryData.id, {
          name: categoryData.name,
          icon: categoryData.icon
        });
        setCategories(categories.map(cat =>
          cat.id === categoryData.id ? categoryData : cat
        ));
      } else {
        // Add new category
        const newCategory = await ResourcesService.createCategory({
          name: categoryData.name,
          icon: categoryData.icon
        });
        setCategories([...categories, newCategory]);
      }
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };
  
  const handleAddLocation = () => {
    setSelectedLocation(null);
    setIsLocationDialogOpen(true);
  };
  
  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setIsLocationDialogOpen(true);
  };
  
  const handleLocationSuccess = async (locationData: Location) => {
    try {
      if (selectedLocation) {
        // Update existing location
        await ResourcesService.updateLocation(locationData.id, {
          name: locationData.name
        });
        setLocations(locations.map(loc =>
          loc.id === locationData.id ? locationData : loc
        ));
      } else {
        // Add new location
        const newLocation = await ResourcesService.createLocation(locationData.name);
        setLocations([...locations, newLocation]);
      }
      setIsLocationDialogOpen(false);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };
  
  const handleDeleteItem = (id: string, type: 'category' | 'location') => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'category') {
        await ResourcesService.deleteCategory(itemToDelete.id);
        setCategories(categories.filter(cat => cat.id !== itemToDelete.id));
      } else if (itemToDelete.type === 'location') {
        await ResourcesService.deleteLocation(itemToDelete.id);
        setLocations(locations.filter(loc => loc.id !== itemToDelete.id));
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
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
                <span className="info-label">Username:</span>
                <span className="info-value">{currentUser?.username || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Created:</span>
                <span className="info-value">
                  {'Unknown'}
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
              _category={selectedCategory ?? undefined}
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