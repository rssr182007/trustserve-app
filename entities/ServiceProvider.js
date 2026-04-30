// ServiceProvider Entity - Defines the structure and helper methods for service providers

export const SERVICE_CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: '🔧', color: 'blue' },
  { id: 'electrical', label: 'Electrical', icon: '⚡', color: 'yellow' },
  { id: 'carpentry', label: 'Carpentry', icon: '🪚', color: 'amber' },
  { id: 'painting', label: 'Painting', icon: '🎨', color: 'purple' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹', color: 'green' },
  { id: 'appliance_repair', label: 'Appliance Repair', icon: '🔌', color: 'red' },
];

export const PROVIDER_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
};

export const PROVIDER_STATUS_LABELS = {
  available: 'Available',
  busy: 'Busy',
  offline: 'Offline',
};

export const PROVIDER_STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-amber-100 text-amber-700',
  offline: 'bg-gray-100 text-gray-500',
};

class ServiceProvider {
  constructor(data = {}) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.user_email = data.user_email;
    this.name = data.name;
    this.full_name = data.full_name || data.name;
    this.category = data.category;
    this.category_id = data.category_id;
    this.photo_url = data.photo_url;
    selfie_url = data.selfie_url;
    this.rating = data.rating || 0;
    this.total_rating = data.total_rating || data.rating || 0;
    this.total_reviews = data.total_reviews || 0;
    this.hourly_rate = data.hourly_rate || 0;
    this.experience_years = data.experience_years || 0;
    this.is_available = data.is_available !== undefined ? data.is_available : true;
    this.is_on_duty = data.is_on_duty !== undefined ? data.is_on_duty : false;
    this.location = data.location;
    this.skills = data.skills || [];
    this.completed_jobs = data.completed_jobs || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Handle nested user_profiles from Supabase
    if (data.user_profiles) {
      this.full_name = data.user_profiles.full_name || this.full_name;
      this.selfie_url = data.user_profiles.selfie_url || this.selfie_url;
      this.phone = data.user_profiles.phone;
    }
    
    // Handle nested service_categories from Supabase
    if (data.service_categories) {
      this.category_label = data.service_categories.name;
      this.category_icon = data.service_categories.icon;
    }
  }

  // Check if provider is available for booking
  isAvailable() {
    return this.is_available && this.is_on_duty;
  }

  // Check if provider is online
  isOnline() {
    return this.is_on_duty;
  }

  // Get available status for display
  getAvailabilityStatus() {
    if (!this.is_available) return 'offline';
    if (this.is_on_duty) return 'available';
    return 'offline';
  }

  // Get availability label
  getAvailabilityLabel() {
    const status = this.getAvailabilityStatus();
    return PROVIDER_STATUS_LABELS[status] || 'Offline';
  }

  // Get availability color class
  getAvailabilityColor() {
    const status = this.getAvailabilityStatus();
    return PROVIDER_STATUS_COLORS[status] || PROVIDER_STATUS_COLORS.offline;
  }

  // Get category label
  getCategoryLabel() {
    const category = SERVICE_CATEGORIES.find(c => c.id === this.category);
    return category?.label || this.category_label || this.category;
  }

  // Get category icon
  getCategoryIcon() {
    const category = SERVICE_CATEGORIES.find(c => c.id === this.category);
    return category?.icon || this.category_icon || '🔧';
  }

  // Get category color
  getCategoryColor() {
    const category = SERVICE_CATEGORIES.find(c => c.id === this.category);
    return category?.color || 'blue';
  }

  // Get formatted rating
  getFormattedRating() {
    return this.rating.toFixed(1);
  }

  // Get formatted hourly rate
  getFormattedRate() {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(this.hourly_rate);
  }

  // Get display name
  getDisplayName() {
    return this.full_name || this.name;
  }

  // Get initial for avatar
  getInitial() {
    const name = this.getDisplayName();
    return name ? name.charAt(0).toUpperCase() : 'P';
  }

  // Get profile photo or placeholder
  getProfilePhoto() {
    return this.photo_url || this.selfie_url;
  }

  // Get skills as comma separated string
  getSkillsString() {
    return this.skills?.join(', ') || '';
  }

  // Check if provider has skills listed
  hasSkills() {
    return this.skills && this.skills.length > 0;
  }

  // Convert to JSON for API
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      user_email: this.user_email,
      name: this.name,
      full_name: this.full_name,
      category: this.category,
      category_id: this.category_id,
      photo_url: this.photo_url,
      selfie_url: this.selfie_url,
      rating: this.rating,
      total_rating: this.total_rating,
      total_reviews: this.total_reviews,
      hourly_rate: this.hourly_rate,
      experience_years: this.experience_years,
      is_available: this.is_available,
      is_on_duty: this.is_on_duty,
      location: this.location,
      skills: this.skills,
      completed_jobs: this.completed_jobs,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Create from API response
  static fromJSON(json) {
    return new ServiceProvider(json);
  }

  // Create list from API response
  static fromJSONList(jsonList) {
    return jsonList.map(item => new ServiceProvider(item));
  }
}

export default ServiceProvider;
