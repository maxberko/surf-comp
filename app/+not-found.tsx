import { Redirect } from 'expo-router';

// Sur le web, l'app peut être servie depuis une URL quelconque (sous-chemin,
// fichier local ouvert en file://). Toute route non reconnue renvoie à la racine
// pour que l'app démarre normalement quel que soit le chemin.
export default function NotFound() {
  return <Redirect href="/" />;
}
