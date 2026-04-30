// Booking Entity - Defines the structure and helper methods for bookings

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const BOOKING_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const SERVICE_CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'carpentry', label: 'Carpentry', icon: '🪚' },
  { id: 'painting', label: 'Painting', icon: '🎨' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { id: 'appliance_repair', label: 'Appliance Repair', icon: '🔌' },
];

class Booking {
  constructor(data = {}) {
    this.id = data.id;
    this.customer_id = data.customer_id;
    this.provider_id = data.provider_id;
    this.customer_name = data.customer_name;
    this.provider_name = data.provider_name;
    this.category = data.category;
    this.status = data.status || BOOKING_STATUS.PENDING;
    this.service_date = data.service_date;
    this.service_time = data.service_time;
    this.location = data.location;
    this.notes = data.notes;
    this.photo_urls = data.photo_urls || [];
    this.total_amount = data.total_amount;
    this.rating = data.rating;
    this.review = data.review;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Check if booking is pending
  isPending() {
    return this.status === BOOKING_STATUS.PENDING;
  }

  // Check if booking is confirmed
  isConfirmed() {
    return this.status === BOOKING_STATUS.CONFIRMED;
  }

  // Check if booking is in progress
  isInProgress() {
    return this.status === BOOKING_STATUS.IN_PROGRESS;
  }

  // Check if booking is completed
  isCompleted() {
    return this.status === BOOKING_STATUS.COMPLETED;
  }

  // Check if booking is cancelled
  isCancelled() {
    return this.status === BOOKING_STATUS.CANCELLED;
  }

  // Check if booking is active (not completed or cancelled)
  isActive() {
    return [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS].includes(this.status);
  }

  // Get status label
  getStatusLabel() {
    return BOOKING_STATUS_LABELS[this.status] || this.status;
  }

  // Get category label
  getCategoryLabel() {
    const category = SERVICE_CATEGORIES.find(c => c.id === this.category);
    return category?.label || this.category;
  }

  // Get category icon
  getCategoryIcon() {
    const category = SERVICE_CATEGORIES.find(c => c.id === this.category);
    return category?.icon || '🔧';
  }

  // Format date for display
  getFormattedDate() {
    if (!this.service_date) return '';
    const date = new Date(this.service_date);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Format amount
  getFormattedAmount() {
    if (!this.total_amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(this.total_amount);
  }

  // Get display title
  getDisplayTitle() {
    return ${this.getCategoryLabel()} - ;
  }

  // Convert to JSON for API
  toJSON() {
    return {
      id: this.id,
      customer_id: this.customer_id,
      provider_id: this.provider_id,
      customer_name: this.customer_name,
      provider_name: this.provider_name,
      category: this.category,
      status: this.status,
      service_date: this.service_date,
      service_time: this.service_time,
      location: this.location,
      notes: this.notes,
      photo_urls: this.photo_urls,
      total_amount: this.total_amount,
      rating: this.rating,
      review: this.review,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Create from API response
  static fromJSON(json) {
    return new Booking(json);
  }

  // Create list from API response
  static fromJSONList(jsonList) {
    return jsonList.map(item => new Booking(item));
  }
}

export default Booking;
