// lib/utils.ts

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // 60 * 60 * 24 * 365
  if (interval > 1) {
    const years = Math.floor(interval);
    return years === 1 ? `${years} year ago` : `${years} years ago`;
  }

  interval = seconds / 2592000; // 60 * 60 * 24 * 30
  if (interval > 1) {
    const months = Math.floor(interval);
    return months === 1 ? `${months} month ago` : `${months} months ago`;
  }

  interval = seconds / 86400; // 60 * 60 * 24
  if (interval > 1) {
    const days = Math.floor(interval);
    return days === 1 ? `${days} day ago` : `${days} days ago`;
  }

  interval = seconds / 3600; // 60 * 60
  if (interval > 1) {
    const hours = Math.floor(interval);
    return hours === 1 ? `${hours} hour ago` : `${hours} hours ago`;
  }

  interval = seconds / 60;
  if (interval > 1) {
    const minutes = Math.floor(interval);
    return minutes === 1 ? `${minutes} minute ago` : `${minutes} minutes ago`;
  }
  
  return `${Math.floor(seconds)} seconds ago`;
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(String(hours));
    }
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(remainingSeconds).padStart(2, '0'));
    
    
    if (hours === 0) {
        parts[0] = String(minutes);
    }

    return parts.join(':');
}



export function formatViews(count: number): string {
  if (count >= 1_000_000_000) {
    return (count / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}