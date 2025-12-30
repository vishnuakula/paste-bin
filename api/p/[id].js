import { getPaste, getRemainingViews, getExpiresAt } from '../../lib/pasteService.js';
import { getCurrentTime } from '../../lib/timeHelper.js';

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}

export default async function handler(req, res) {
    try {
        const { id } = req.query;

        if (!id) {
            res.setHeader('Content-Type', 'text/html');
            return res.status(404).send(generate404Page());
        }

        // Get current time (supports deterministic testing)
        const currentTime = getCurrentTime(req);

        // Get paste and increment view count (atomically)
        const paste = await getPaste(id, currentTime, true);

        if (!paste) {
            res.setHeader('Content-Type', 'text/html');
            return res.status(404).send(generate404Page());
        }

        // Return HTML with paste content
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).send(generatePastePage(paste));

    } catch (error) {
        console.error('Error viewing paste:', error);
        res.setHeader('Content-Type', 'text/html');
        return res.status(500).send(generate500Page());
    }
}

function generatePastePage(paste) {
    const remainingViews = getRemainingViews(paste);
    const expiresAt = getExpiresAt(paste);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>View Paste</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .container {
      max-width: 800px;
      width: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .metadata {
      background: #f8f9fa;
      padding: 15px 30px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      font-size: 14px;
      color: #6c757d;
    }
    
    .metadata-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .metadata-item strong {
      color: #495057;
    }
    
    .content {
      padding: 30px;
    }
    
    .paste-content {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      color: #212529;
      max-height: 600px;
      overflow-y: auto;
    }
    
    .actions {
      padding: 20px 30px 30px;
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    @media (max-width: 600px) {
      .metadata {
        flex-direction: column;
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Paste Content</h1>
    </div>
    
    <div class="metadata">
      ${remainingViews !== null ? `
      <div class="metadata-item">
        <strong>Remaining Views:</strong>
        <span>${remainingViews}</span>
      </div>
      ` : ''}
      ${expiresAt !== null ? `
      <div class="metadata-item">
        <strong>Expires At:</strong>
        <span>${new Date(expiresAt).toLocaleString()}</span>
      </div>
      ` : ''}
      ${remainingViews === null && expiresAt === null ? `
      <div class="metadata-item">
        <span>No expiry constraints</span>
      </div>
      ` : ''}
    </div>
    
    <div class="content">
      <div class="paste-content">${escapeHtml(paste.content)}</div>
    </div>
    
    <div class="actions">
      <a href="/" class="btn btn-primary">Create New Paste</a>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generate404Page() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paste Not Found</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .error-container {
      background: white;
      border-radius: 12px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
    }
    
    .error-icon {
      font-size: 72px;
      margin-bottom: 20px;
    }
    
    h1 {
      font-size: 32px;
      color: #212529;
      margin-bottom: 15px;
    }
    
    p {
      color: #6c757d;
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    
    .btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">🔍</div>
    <h1>Paste Not Found</h1>
    <p>This paste doesn't exist, has expired, or has reached its view limit.</p>
    <a href="/" class="btn">Create New Paste</a>
  </div>
</body>
</html>
  `.trim();
}

function generate500Page() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Error</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .error-container {
      background: white;
      border-radius: 12px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
    }
    
    .error-icon {
      font-size: 72px;
      margin-bottom: 20px;
    }
    
    h1 {
      font-size: 32px;
      color: #212529;
      margin-bottom: 15px;
    }
    
    p {
      color: #6c757d;
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    
    .btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h1>Server Error</h1>
    <p>Something went wrong. Please try again later.</p>
    <a href="/" class="btn">Go Home</a>
  </div>
</body>
</html>
  `.trim();
}
