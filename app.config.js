// Étend app.json. Permet de builder pour un sous-chemin (GitHub Pages) via
// EXPO_BASE_URL sans toucher aux builds racine (fichier local / artifact).
module.exports = ({ config }) => {
  if (process.env.EXPO_BASE_URL) {
    config.experiments = { ...(config.experiments || {}), baseUrl: process.env.EXPO_BASE_URL };
  }
  return config;
};
