// Complaint Entity - Defines the structure and helper methods for complaints

export const COMPLAINT_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export const COMPLAINT_STATUS_LABELS = {
  pending: 'Pending',
  in_review: 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const COMPLAINT_CATEGORIES = [
  { id: 'service_quality', label: 'Service Quality', icon: '⭐' },
  { id: 'pricing', label: 'Pricing Issue', icon: '💰' },
  { id: 'behavior', label: 'Behavior', icon: '👤' },
  { id: 'delay', label: 'Delay', icon: '⏰' },
  { id: 'damage', label: 'Damage', icon: '💔' },
  { id: 'other', label: 'Other', icon: '📝' },
];

export const COMPLAINT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const COMPLAINT_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const COMPLAINT_PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

class Complaint {
  constructor(data = {}) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.booking_id = data.booking_id;
    this.title = data.title;
    this.description = data.description;
    this.category = data.category;
    this.status = data.status || COMPLAINT_STATUS.PENDING;
    this.priority = data.priority || COMPLAINT_PRIORITY.MEDIUM;
    this.voice_url = data.voice_url;
    this.photo_urls = data.photo_urls || [];
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Check if complaint is pending
  isPending() {
    return this.status === COMPLAINT_STATUS.PENDING;
  }

  // Check if complaint is in review
  isInReview() {
    return this.status === COMPLAINT_STATUS.IN_REVIEW;
  }

  // Check if complaint is resolved
  isResolved() {
    return this.status === COMPLAINT_STATUS.RESOLVED;
  }

  // Check if complaint is rejected
  isRejected() {
    return this.status === COMPLAINT_STATUS.REJECTED;
  }

  // Check if complaint is high priority
  isHighPriority() {
    return this.priority === COMPLAINT_PRIORITY.HIGH;
  }

  // Get status label
  getStatusLabel() {
    return COMPLAINT_STATUS_LABELS[this.status] || this.status;
  }

  // Get category label
  getCategoryLabel() {
    const category = COMPLAINT_CATEGORIES.find(c => c.id === this.category);
    return category?.label || this.category;
  }

  // Get category icon
  getCategoryIcon() {
    const category = COMPLAINT_CATEGORIES.find(c => c.id === this.category);
    return category?.icon || '📝';
  }

  // Get priority label
  getPriorityLabel() {
    return COMPLAINT_PRIORITY_LABELS[this.priority] || this.priority;
  }

  // Get priority color class
  getPriorityColor() {
    return COMPLAINT_PRIORITY_COLORS[this.priority] || COMPLAINT_PRIORITY_COLORS.medium;
  }

  // Get formatted date
  getFormattedDate() {
    if (!this.created_at) return '';
    const date = new Date(this.created_at);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get short description (truncated)
  getShortDescription(maxLength = 100) {
    if (!this.description) return '';
    if (this.description.length <= maxLength) return this.description;
    return this.description.substring(0, maxLength) + '...';
  }

  // Check if has voice recording
  hasVoiceRecording() {
    return !!this.voice_url;
  }

  // Check if has photos
  hasPhotos() {
    return this.photo_urls && this.photo_urls.length > 0;
  }

  // Get photo count
  getPhotoCount() {
    return this.photo_urls?.length || 0;
  }

  // Convert to JSON for API
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      booking_id: this.booking_id,
      title: this.title,
      description: this.description,
      category: this.category,
      status: this.status,
      priority: this.priority,
      voice_url: this.voice_url,
      photo_urls: this.photo_urls,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Create from API response
  static fromJSON(json) {
    return new Complaint(json);
  }

  // Create list from API response
  static fromJSONList(jsonList) {
    return jsonList.map(item => new Complaint(item));
  }
}

export default Complaint;
