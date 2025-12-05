/**
 * Browser Console Script to Export localStorage Data
 * 
 * Copy and paste this entire script into your browser console while on the app,
 * then it will download a JSON file with all your localStorage data.
 * 
 * After exporting, run: npm run migrate <exported-file.json> <userId>
 */

(function() {
  const migrationData = {};

  // Custom responses
  const storedObjections = localStorage.getItem('objections-app-data');
  if (storedObjections) {
    try {
      const objections = JSON.parse(storedObjections);
      migrationData.customResponses = objections.flatMap((obj) =>
        (obj.customResponses || []).map((response) => ({
          objectionId: obj.id,
          response,
        }))
      );
    } catch (error) {
      console.error('Error parsing custom responses:', error);
    }
  }

  // Confidence ratings
  const ratings = localStorage.getItem('objections-app-confidence-ratings');
  if (ratings) {
    try {
      migrationData.confidenceRatings = JSON.parse(ratings);
    } catch (error) {
      console.error('Error parsing confidence ratings:', error);
    }
  }

  // Practice sessions
  const sessions = localStorage.getItem('objections-app-sessions');
  if (sessions) {
    try {
      migrationData.practiceSessions = JSON.parse(sessions);
    } catch (error) {
      console.error('Error parsing practice sessions:', error);
    }
  }

  // Notes
  const notes = localStorage.getItem('objections-app-notes');
  if (notes) {
    try {
      migrationData.notes = JSON.parse(notes);
    } catch (error) {
      console.error('Error parsing notes:', error);
    }
  }

  // Templates
  const templates = localStorage.getItem('objections-app-templates');
  if (templates) {
    try {
      migrationData.responseTemplates = JSON.parse(templates);
    } catch (error) {
      console.error('Error parsing templates:', error);
    }
  }

  // Practice history
  const history = localStorage.getItem('objections-app-practice-history');
  if (history) {
    try {
      migrationData.practiceHistory = JSON.parse(history);
    } catch (error) {
      console.error('Error parsing practice history:', error);
    }
  }

  // Points
  const points = localStorage.getItem('objections-app-points');
  if (points) {
    try {
      const pointsData = JSON.parse(points);
      migrationData.points = {
        total: pointsData.total || 0,
        history: pointsData.history || [],
      };
    } catch (error) {
      console.error('Error parsing points:', error);
    }
  }

  // Review schedules
  const reviewSchedules = localStorage.getItem('objections-app-review-schedules');
  if (reviewSchedules) {
    try {
      migrationData.reviewSchedules = JSON.parse(reviewSchedules);
    } catch (error) {
      console.error('Error parsing review schedules:', error);
    }
  }

  // Learning path progress
  const learningPaths = localStorage.getItem('objections-app-learning-path-progress');
  if (learningPaths) {
    try {
      const paths = JSON.parse(learningPaths);
      migrationData.learningPathProgress = Array.isArray(paths) ? paths : [paths];
    } catch (error) {
      console.error('Error parsing learning paths:', error);
    }
  }

  // Voice sessions
  const voiceSessions = localStorage.getItem('response-ready-voice-sessions');
  if (voiceSessions) {
    try {
      migrationData.voiceSessions = JSON.parse(voiceSessions);
    } catch (error) {
      console.error('Error parsing voice sessions:', error);
    }
  }

  // Get current user ID
  const userId = localStorage.getItem('response-ready-current-user-id');
  if (userId) {
    migrationData.userId = userId;
  }

  // Download as JSON file
  const dataStr = JSON.stringify(migrationData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `localStorage-export-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ localStorage data exported!');
  console.log('Summary:');
  console.log(`- Custom Responses: ${migrationData.customResponses?.length || 0}`);
  console.log(`- Confidence Ratings: ${migrationData.confidenceRatings?.length || 0}`);
  console.log(`- Practice Sessions: ${migrationData.practiceSessions?.length || 0}`);
  console.log(`- Notes: ${migrationData.notes?.length || 0}`);
  console.log(`- Templates: ${migrationData.responseTemplates?.length || 0}`);
  console.log(`- Practice History: ${migrationData.practiceHistory?.length || 0}`);
  console.log(`- Points: ${migrationData.points?.history?.length || 0}`);
  console.log(`- Review Schedules: ${migrationData.reviewSchedules?.length || 0}`);
  console.log(`- Learning Path Progress: ${migrationData.learningPathProgress?.length || 0}`);
  console.log(`- Voice Sessions: ${migrationData.voiceSessions?.length || 0}`);
  if (userId) {
    console.log(`\nUser ID: ${userId}`);
    console.log('\nTo migrate, run:');
    console.log(`npm run migrate localStorage-export-${dateStr}.json ${userId}`);
  } else {
    console.log('\n⚠️  No user ID found. Make sure you are logged in.');
    console.log('To find your user ID, run: npm run list-users');
  }
})();

