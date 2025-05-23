// Application URLs and endpoints
export const APP_CONFIG = {
  // Site URLs
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  
  // API URLs
  catApi: {
    baseUrl: process.env.NEXT_PUBLIC_CAT_API_URL || 'https://api.thecatapi.com/v1/images/search',
    apiKey: process.env.NEXT_PUBLIC_CAT_API_KEY,
  },
  
  // External service URLs
  externalLinks: {
    youtubeDemo: process.env.NEXT_PUBLIC_YOUTUBE_DEMO_URL || 'https://www.youtube.com/watch?v=0qrs_kQAK7U',
    discord: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.com/invite/Guege5tXFK',
    github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/updatedotdev/js',
    docs: 'https://update.dev/docs',
    updateDashboard: 'https://update.dev/dashboard',
  },
  
  // Authentication configuration
  auth: {
    // Redirect URLs for authentication flows
    redirects: {
      afterSignIn: '/protected',
      afterSignUp: '/email-confirmation',
      afterReset: '/reset-password/confirm',
      afterSignOut: '/sign-in',
      afterEmailConfirmation: '/protected',
    },
    
    // Password requirements
    passwordMinLength: 6,
    passwordRecommendedLength: 8,
  },
};

// Helper function to get full URLs
export const getFullUrl = (path: string): string => {
  const baseUrl = APP_CONFIG.siteUrl.replace(/\/+$/, ''); // Remove trailing slashes
  const cleanPath = path.replace(/^\/+/, ''); // Remove leading slashes
  return `${baseUrl}/${cleanPath}`;
}; 