// src/pages/Ads.jsx
import AdCard from "../components/AdCard";

const ads = [
  {
    id: 1,
    partnerIcon: "/icons/partner1.png",
    partnerName: "BrandX",
    description: "Watch a 30s video and earn instantly!",
    points: 20,
    adType: "Video",
    completed: 560,
    isFavorite: false,
  },
  // ...more ads
];

export default function Ads() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
      {ads.map(ad => (
        <AdCard
          key={ad.id}
          {...ad}
          onWatch={() => alert(`Watch ad from ${ad.partnerName}`)}
          onFavorite={() => alert(`Favorited ad from ${ad.partnerName}`)}
        />
      ))}
    </div>
  );
}
