// Utility to parse SRT file content
export function parseSRT(data) {
  const subtitles = [];
  // Normalize line endings
  const content = data.replace(/\r\n|\r/g, '\n');
  
  // Split by double newline to get blocks
  const blocks = content.split(/\n\s*\n/);
  
  for (const block of blocks) {
    if (!block.trim()) continue;
    
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const id = lines[0].trim();
      const timecode = lines[1];
      const text = lines.slice(2).join('\n');
      
      const timeParts = timecode.split(' --> ');
      if (timeParts.length === 2) {
        const start = timeToSeconds(timeParts[0]);
        const end = timeToSeconds(timeParts[1]);
        
        subtitles.push({
          id,
          start,
          end,
          text
        });
      }
    }
  }
  
  return subtitles;
}

// Converts a time string "HH:MM:SS,MMM" to a float representing seconds
function timeToSeconds(timeStr) {
  const parts = timeStr.trim().split(/[:,]/);
  if (parts.length === 4) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    const milliseconds = parseInt(parts[3], 10);
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }
  return 0;
}
